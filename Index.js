const express = require('express')
const app = express();
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const multer = require('multer');
const JWT = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcryptjs = require('bcryptjs');
const nodemailer = require('nodemailer');
require('dotenv').config();




app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('./upload', express.static(path.join(__dirname, 'upload')));
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.set('view engine', 'ejs');

const admin_signup_model = require('./models/admin_signup_model');
const notice_model = require('./models/notice_model');
const donator_model = require('./models/donator_model');
const db = require('./DB');
const payment_model = require('./models/payment_model');

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}))

app.use(flash());

app.use((req, res, next) => { res.locals.messages = req.flash(); next(); });

app.use(cookieParser());

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


const auth = (req, res, next) => {

    const adminToken = req.cookies.adminToken;
    if (!adminToken) {
        return res.redirect('/admin-login')
    }

    const verified = JWT.verify(adminToken, '12345');
    req.adminId = verified._id
    next()
}


const authen = (req, res, next) => {

    const token = req.cookies.donatorToken;
    if (!token) {

        return res.redirect('/donator-login')
    }

    const verified = JWT.verify(token, '12345');
    req.donatorId = verified._id;
    next()
}


app.get('/admin-signup', function (req, res) {
    res.render('../views/admin-signup')
})

app.post('/admin-signup', upload.single('Profile_Image'), async function (req, res) {

    const adminData = req.body;
    adminData.Profile_Image = req.file.filename;

    const adminEmail = await admin_signup_model.findOne({ Email: adminData.Email });
    const adminMobile = await admin_signup_model.findOne({ Mobile: adminData.Mobile });

    if (adminEmail) {

        req.flash('error', 'Email alreday exist ');
        return res.redirect('/admin-signup');
    }

    else if (adminMobile) {

        req.flash('error', 'Mobile number alreday exist ');
        return res.redirect('/admin-signup');
    }

    else {

        const new_admin_signup = admin_signup_model(adminData);
        await new_admin_signup.save();
        const token = await new_admin_signup.GenerateJWT();

        res.cookie('adminToken', token), {

            httpOnly: true,
            secure: true,
            maxAge: 365 * 24 * 60 * 60 * 1000,
        }
        return res.redirect('/admin-dashboard')
    }
})

app.get('/admin-login', function (req, res) {

    res.render('../views/admin-login')
})

app.post('/admin-login', async function (req, res) {
    const { Email, Password } = req.body;

    const loginEmail = await admin_signup_model.findOne({ Email: Email });
    if (loginEmail) {

        const matchPassword = await bcryptjs.compare(Password, loginEmail.Password);
        if (matchPassword) {

            const token = await loginEmail.GenerateJWT();
            res.cookie('adminToken', token, {

                httpOnly: true,
                secure: true,
                maxAge: 365 * 24 * 60 * 60 * 1000,
            })

            return res.redirect('/admin-dashboard')
        }

        else {

            req.flash('error', 'Incorrect Email Password');
            return res.redirect('/admin-login')
        }

    }

    else {

        req.flash('error', 'Invalid login details');
        return res.redirect('/admin-login')

    }

})


app.get('/admin-dashboard', auth, async function (req, res) {

    const adminID = req.adminId;
    const adminSourse = await admin_signup_model.findById(adminID);
    const donator = await donator_model.find();

    const totalDonator = donator.length;

    res.render('../views/admin_dashboard', { adminSourse, totalDonator })
});



app.get('/admin-edit', auth, async function (req, res) {

    const adminId = req.adminId;
    const editAdmin = await admin_signup_model.findById(adminId)
    res.render('../views/edit_admin', { editAdmin });
})

app.post('/admin-edit', auth, upload.single('Profile_Image'), async function (req, res) {

    const { Name, Mobile, Email } = req.body;
    const adminID = req.adminId;
    let Profile_Image;

    if (req.file) {
        Profile_Image = req.file.filename
    }

    await admin_signup_model.findByIdAndUpdate(adminID, { Name, Mobile, Email, Profile_Image });
    req.flash('success', 'Edit Admin successfully')
    return res.redirect('/admin-dashboard')

})


app.get('/admin-dashboard/notice', auth, async function (req, res) {

    const adminID = req.adminId;
    const adminSource = await admin_signup_model.findById(adminID).populate('Notice')
    res.render('../views/notice_dashboard', { adminSource });
})

app.get('/admin-dashboard/notice/add-notice', auth, async function (req, res) {

    res.render('../views/notice_form');
})

app.post('/admin-dashboard/notice/add-notice', upload.single('Notice_Pdf'), auth, async function (req, res) {

    const noticeData = req.body;
    noticeData.Notice_Pdf = req.file.filename;
    const new_notice_model = notice_model(noticeData);
    await new_notice_model.save();

    const adminID = req.adminId;

    const noticeConnect = await admin_signup_model.findById(adminID);
    noticeConnect.Notice.push(new_notice_model._id);
    await noticeConnect.save();
    req.flash('success', 'Notice published successfully');
    return res.redirect('/admin-dashboard/notice')
})


app.get('/notice-download/:id', async function (req, res) {

    const noticePdf = await notice_model.findById(req.params.id);
    const pdfpath = path.join(__dirname, 'Upload', noticePdf.Notice_Pdf);

    res.download(pdfpath, (err) => {
        if (err) {
            return res.status(404).send('File not found');
        }
    });

})


app.get('/delete-notice/:id', async function (req, res) {

    await notice_model.findByIdAndDelete(req.params.id);
    req.flash('success', 'Notice delete successfully')
    return res.redirect('/admin-dashboard/notice');


})


app.post('/donator-form', upload.single('Profile_Image'), auth, async function (req, res) {

    const donatorData = req.body;
    donatorData.Profile_Image = req.file.filename;

    const donatorEmail = await donator_model.findOne({ Email: donatorData.Email });
    const donatorMobile = await donator_model.findOne({ Mobile: donatorData.Mobile });

    if (donatorEmail) {

        req.flash('error', 'Email already exist');
        return res.redirect('/donator-form');
    }

    if (donatorMobile) {
        req.flash('error', 'Mobile number already exist');
        return res.redirect('/donator-form');
    }

    else {
        const new_donator_model = donator_model(donatorData);
        await new_donator_model.save();
        res.send('Registration complete successfully');
    }
})


app.get('/admin-dashboard/donator', auth, async function (req, res) {

    const donatorSource = await donator_model.find();
    res.render('../views/donator', { donatorSource });
})

app.get('/donator-reject/:id', async function (req, res) {

    const deleteDonator = await donator_model.findByIdAndDelete(req.params.id);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'thelearningworld20@gmail.com',
            pass: 'lejp nhlb tpex vlay'
        }
    });

    const mailOptions = {
        from: 'thelearningworld20@gmail.com',
        to: deleteDonator.Email,
        subject: 'Membership Rejected ',
        text: `Dear ${deleteDonator.Name} ! We are reject you form our DPS Community for breaking rules and regulation. For Detials enquire You may call : 7797593863`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

    req.flash('success', 'Donator rejected successfully');
    res.redirect('/admin-dashboard/donator')
})


app.get('/donator-form', async function (req, res) {

    res.render('../views/donator-signup');
})


app.get('/donator-login', async function (req, res) {


    res.render('../views/donator-login');
})


app.post('/donator-login', async function (req, res) {

    const { Email, Password } = req.body;

    const donatorEmail = await donator_model.findOne({ Email: Email });


    if (donatorEmail) {

        const matchPassword = await bcryptjs.compare(Password, donatorEmail.Password);
        if (matchPassword) {

            const token = await donatorEmail.GenerateJWT();

            res.cookie('donatorToken', token, {

                httpOnly: true,
                secure: true,
                maxAge: 365 * 24 * 60 * 60 * 1000,
            })


            return res.redirect('/donator-dashboard')

        }

        else {

            req.flash('error', 'Incorrect Email or Password ');
            return res.redirect('/donator-login')
        }
    }

    else {

        req.flash('error', 'Invalid Login details  ');
        return res.redirect('/donator-login')
    }


    res.render('../views/donator-login');
})

app.get('/donator-dashboard', authen, async function (req, res) {

    const donatorID = req.donatorId;
    const donatorSource = await donator_model.findById(donatorID).populate('Payment');
    const notice = await notice_model.find();

    res.render('../views/donator-dashboard', { donatorSource, notice });
});

app.get('/edit-donator', authen, async function (req, res) {

    const donatorID = req.donatorId;
    const donatorSource = await donator_model.findById(donatorID)
    res.render('../views/edit-donator', { donatorSource });
});

app.post('/edit-donator', upload.single('Profile_Image'), authen, async function (req, res) {

    const donatorID = req.donatorId;

    const { Name, Mobile, Email, Passing_Year } = req.body;
    let Profile_Image;

    if (req.file) {

        Profile_Image = req.file.filename;
    }

    await donator_model.findByIdAndUpdate(donatorID, { Name, Mobile, Email, Passing_Year, Profile_Image });
    req.flash('success', 'Edit profile successfully');
    return res.redirect('/donator-dashboard');

});


app.get('/donator-dashboard/donate-form', authen, async function (req, res) {

    const donatorID = req.donatorId;
    const donatorSource = await donator_model.findById(donatorID)

    res.render('../views/donate-form', { donatorSource });
});

app.post('/donator-dashboard/donate-form', upload.single('Payment_Proof'), authen, async function (req, res) {


    const paymentData = req.body;
    paymentData.Payment_Proof = req.file.filename;

    if (paymentData.Pay_Amount < 30) {

        req.flash('error', 'sorry ! you have to pay minimum 30 rupees');
        return res.redirect('/donator-dashboard/donate-form')
    }

    else {

        const new_payment_model = payment_model(paymentData);
        await new_payment_model.save();
        const donatorID = req.donatorId;
        const donatiorConncet = await donator_model.findById(donatorID);
        donatiorConncet.Payment.push(new_payment_model._id);
        await donatiorConncet.save();


        const adminSource = await admin_signup_model.find();
        const adminEmail = adminSource.map((admin) => admin.Email.split(','))

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'thelearningworld20@gmail.com ',
                pass: 'gzpg nqjs vfwx oudu'
            }
        });

        var mailOptions = {
            from: 'thelearningworld20@gmail.com',
            to: adminEmail,
            subject: 'New Payment form DPS Community',
            text: ` Name : ${new_payment_model.Name}, 
            Mobile : ${new_payment_model.Mobile}, 
            Payment Month : ${new_payment_model.Pay_Month}`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });



        req.flash('success', 'Payment successfull');
        return res.redirect('/donator-dashboard');
    }
});


app.get('/payment-accept/:id', async function (req, res) {

    const paymentSource = await payment_model.findById(req.params.id);
    paymentSource.Status = 'Paid'
    await paymentSource.save();

    req.flash('success', 'Payment verified successfully');
    res.redirect('/admin-dashboard/donator')

});



app.get('/donator-dashboard/donator/payment-report/:id', auth, async function (req, res) {

    const donator = await donator_model.findById(req.params.id).populate('Payment');
    res.render('../views/donator-payment', { donator });


});


app.get('/forget-password', function (req, res) {


    res.render('../views/forget-password-email')
})

app.post('/forget-password', async function (req, res) {

    const forgetPasswordemail = req.body;
    const donatorSource = await donator_model.findOne({ Email: forgetPasswordemail.Email })

    if (donatorSource) {


        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'thelearningworld20@gmail.com',
                pass: 'gzpg nqjs vfwx oudu'
            }
        });

        const mailOptions = {
            from: 'thelearningworld20@gmail.com',
            to: donatorSource.Email,
            subject: 'Reset Password ',
            text: `Please reset your password by clicking the following link: http://localhost:3000/reset-password/${donatorSource._id}`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        req.flash('success', 'Please check your Email');
        return res.redirect('/forget-password')
    }

    else {

        req.flash('error', 'You are not Donator');
        return res.redirect('/forget-password')
    }

})

app.get('/reset-password/:id', function (req, res) {

    res.render('../views/reset-password')
});

app.post('/reset-password/:id', async function (req, res) {
    const { Email, Password } = req.body;
    const resetPassword = await donator_model.findOne({ Email: Email });

    resetPassword.Password = Password;
    await resetPassword.save();
    res.send('Password Update Successfully')

})


const port = process.env.PORT

app.listen(port, () => {

    console.log('Server is connected');
})  