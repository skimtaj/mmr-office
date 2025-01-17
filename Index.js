

require('dotenv').config();
const express = require('express')
const app = express();
app.set('view engine', 'ejs')
const path = require('path');
const multer = require('multer');
const flash = require('connect-flash');
const session = require('express-session');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const bcryptjs = require('bcryptjs');
const JWT = require('jsonwebtoken');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs/promises');
const nodemailer = require('nodemailer')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/upload', express.static(path.join(__dirname, 'upload')));
app.set('view engine', 'ejs');
const bodyParser = require('body-parser');
app.use(bodyParser.json());


const admin_signup = require('./models/admin_signup');
const db = require('./DB');
const mmr_certificate = require('./models/mmr_certificate')

app.use(session({
    secret: 'xyz',
    resave: false,
    saveUninitialized: true,
}));

app.use(flash());
app.use((req, res, next) => { res.locals.messages = req.flash(); next(); });
app.use(cookieParser())


const storage = multer.diskStorage({
    limits: { fileSize: 10000000 },
    destination: function (req, file, cb) {
        cb(null, './upload')
    },

    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
})

const upload = multer({ storage: storage })




const adminAuth = (req, res, next) => {

    const token = req.cookies.adminToken;
    if (!token) {

        return res.redirect('/mmr-office/admin-login')
    }

    const verified = JWT.verify(token, process.env.Token_Password);
    req.adminId = verified._id;
    next();

}

app.get('/mmr-office', function (req, res) {
    res.render('../views/mmr-office')
})


app.get('/logout', async function (req, res) {

    res.clearCookie('adminToken');
    return res.redirect('/mmr-office/admin-login')

})


app.get('/mmr-office/admin-signup', function (req, res) {
    res.render('../views/admin-signup')
})

app.post('/mmr-office/admin-signup', upload.single('Profile_Image'), async function (req, res) {

    const adminSignup = req.body;
    adminSignup.Profile_Image = req.file.filename;

    const adminEmail = await admin_signup.findOne({ Email: adminSignup.Email });
    const adminMobile = await admin_signup.findOne({ Mobile: adminSignup.Email });

    if (adminEmail) {

        req.flash('error', 'Email already exist')
        return res.redirect('/mmr-office/admin-signup')
    }

    else if (adminMobile) {

        req.flash('error', 'Mobile Number already exist')
        return res.redirect('/mmr-office/admin-signup')
    }

    const new_admin_signup = admin_signup(adminSignup);
    await new_admin_signup.save();

    const token = await new_admin_signup.GenerateJWT();
    res.cookie('adminToken', token), {

        httpOnly: true,
        secure: true,
        maxAge: 365 * 24 * 60 * 60 * 1000
    }

    return res.redirect('/mmr-office/admin-dashboard')
})


app.get('/mmr-office/admin-login', function (req, res) {
    res.render('../views/admin-login')
})

app.post('/mmr-office/admin-login', async function (req, res) {

    const { Email, Password } = req.body;
    const loginEmail = await admin_signup.findOne({ Email: Email });

    if (loginEmail) {
        const matchPassword = await bcryptjs.compare(Password, loginEmail.Password)

        if (matchPassword) {

            const token = await loginEmail.GenerateJWT();
            res.cookie('adminToken', token), {

                httpOnly: true,
                secure: true,
                maxAge: 365 * 24 * 60 * 60 * 1000
            }

            return res.redirect('/mmr-office/admin-dashboard')
        }

        else {

            req.flash('error', 'Incorrcet Email or Password')
            return res.redirect('/mmr-office/admin-login')
        }

    }

    else {

        req.flash('error', 'Invalid Login Details')
        return res.redirect('/mmr-office/admin-login')
    }

})


app.get('/mmr-office/admin-dashboard', adminAuth, async function (req, res) {

    const adminID = req.adminId;
    const adminSourse = await admin_signup.findById(adminID).populate('certificate');

    const totalCertificate = adminSourse.certificate.length;

    const totalAdmin = admin_signup.length;

    res.render('../views/admin-dashboard', { adminSourse, totalCertificate, totalAdmin })
})

app.get('/mmr-office/admin-profile', adminAuth, async function (req, res) {

    const adminID = req.adminId;
    const adminSourse = await admin_signup.findById(adminID)

    res.render('../views/admin-profile', { adminSourse })
})


app.get('/mmr-office/edit-profile', adminAuth, async function (req, res) {

    const adminID = req.adminId;
    const adminSourse = await admin_signup.findById(adminID);

    res.render('../views/edit-admin', { adminSourse })
})

app.post('/mmr-office/edit-profile', adminAuth, upload.single('Profile_Image'), async function (req, res) {

    const adminID = req.adminId;

    const { Name, Mobile, Email } = req.body;

    let Profile_Image;

    if (req.file) {

        Profile_Image = req.file.filename
    }

    await admin_signup.findByIdAndUpdate(adminID, { Name, Mobile, Email, Profile_Image });
    req.flash('success', 'Admin Profile update successfully');
    return res.redirect('/mmr-office/admin-profile')

})


app.get('/mmr-office/add-certificate', adminAuth, async function (req, res) {


    res.render('../views/add-certificate',)
})

app.post('/mmr-office/add-certificate', adminAuth, async function (req, res) {

    const adminID = req.adminId;

    const certificateData = req.body;
    const new_mmr_certificate = mmr_certificate(certificateData);
    await new_mmr_certificate.save();

    const adminSourse = await admin_signup.findById(adminID);
    adminSourse.certificate.push(new_mmr_certificate._id);
    await adminSourse.save();

    return res.redirect('/mmr-office/admin-dashboard')


})


app.get('/delete-certificate/:id', async function (req, res) {

    await mmr_certificate.findByIdAndDelete(req.params.id);

    req.flash('success', 'Certificate delete succesfully')
    return res.redirect('/mmr-office/admin-dashboard')

})

app.get('/certificate-pdf/:id', async function (req, res) {

    try {

        const pdfData = await mmr_certificate.findById(req.params.id);
        console.log(pdfData);

        async function CreatePdf(input, pdfData) {
            const existingPdfBytes = await fs.readFile(input);
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            const form = pdfDoc.getForm();

            form.getTextField('Name').setText(pdfData.Name || '');
            form.getTextField('Father_Name').setText(pdfData.Father_Name || '');
            form.getTextField('Village').setText(pdfData.Village.toString() || '');
            form.getTextField('Post').setText(pdfData.Post || '');
            form.getTextField('PS').setText(pdfData.PS || '');
            form.getTextField('Dist').setText(pdfData.Dist || '');
            form.getTextField('Pin').setText(pdfData.Pin.toString() || '');
            form.getTextField('DOB').setText(pdfData.DOB || '');

            form.getTextField('L_Name').setText(pdfData.L_Name || '');
            form.getTextField('L_Father_Name').setText(pdfData.L_Father_Name || '');
            form.getTextField('L_Village').setText(pdfData.L_Village.toString() || '');
            form.getTextField('L_Post').setText(pdfData.L_Post || '');
            form.getTextField('L_PS').setText(pdfData.L_PS || '');
            form.getTextField('L_Dist').setText(pdfData.L_Dist || '');
            form.getTextField('Bride_Pin').setText(pdfData.Bride_Pin.toString() || '');
            form.getTextField('L_DOB').setText(pdfData.L_DOB || '');

            form.getTextField('MD').setText(pdfData.MD || '');
            form.getTextField('RD').setText(pdfData.RD.toString() || '');
            form.getTextField('POM').setText(pdfData.POM || '');
            form.getTextField('Mohor').setText(pdfData.Mohor || '');
            form.getTextField('Page_No').setText(pdfData.Page_No.toString() || '');
            form.getTextField('Vol_No').setText(pdfData.Vol_No || '');


            const pdfBytes = await pdfDoc.save();
            return pdfBytes;
        }

        const pdfBytes = await CreatePdf('./pdf/Certificate (10) (1).pdf', pdfData);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Modified_Certificate.pdf"');
        res.end(pdfBytes);

    } catch (error) {
        console.log('Error:', error);
        res.status(500).send('An error occurred while processing the PDF.');
    }



})


app.get('/mmr-office/edit-certificate/:id', async function (req, res) {

    const certificateSourse = await mmr_certificate.findById(req.params.id)

    res.render('../views/edit-certificate', { certificateSourse })
})

app.post('/mmr-office/edit-certificate/:id', async function (req, res) {

    const editData = req.body;
    await mmr_certificate.findByIdAndUpdate(req.params.id, editData);
    req.flash('success', 'Certificate Update Successfully');
    return res.redirect('/mmr-office/admin-dashboard')
})


app.get('/mmr-office/edit-payment/:id', async function (req, res) {

    const certificateData = await mmr_certificate.findById(req.params.id);
    certificateData.Payment = 'Success';
    await certificateData.save();

    req.flash('success', 'Payment done Successfully');
    return res.redirect('/mmr-office/admin-dashboard');

})


app.get('/mmr-office/admin-login/forget-password', async function (req, res) {

    res.render('../views/forget-password')
})

app.post('/mmr-office/admin-login/forget-password', async function (req, res) {


    const { Email } = req.body;
    const adminEmail = await admin_signup.findOne({ Email: Email });

    if (adminEmail) {


        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.User,
                pass: process.env.Pass
            }
        });

        var mailOptions = {
            from: process.env.Pass,
            to: adminEmail.Email,
            subject: 'Forget Password',
            text: ` Please reset your Password using this link : http://localhost:3000/mmr-office/admin-login/reset-password/${adminEmail._id} `
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        req.flash('success', 'Please check your Email ');
        return res.redirect('/mmr-office/admin-login/forget-password')

    }

    else {

        req.flash('error', 'Email does not exist ');
        return res.redirect('/mmr-office/admin-login/forget-password')

    }
})


app.get('/mmr-office/admin-login/reset-password/:id', async function (req, res) {

    res.render('../views/reset-password')
})

app.post('/mmr-office/admin-login/reset-password/:id', async function (req, res) {

    const { Email, Password } = req.body;
    const adminEmail = await admin_signup.findOne({ Email: Email });

    if (adminEmail) {

        adminEmail.Password = Password;
        await adminEmail.save();
        req.flash('success', 'Password reset successfully');
        return res.redirect('/mmr-office/admin-dashboard')
    }

    else {

        req.flash('error', 'Email does not exist ');
        return res.redirect('/mmr-office/admin-login/reset-password')
    }


})


const port = process.env.PORT || 3000;

app.listen(port, () => {

    console.log('Server is connected')
})