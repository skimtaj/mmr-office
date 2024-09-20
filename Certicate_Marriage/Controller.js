const express = require('express')
const app = express();
app.set('view engine', 'ejs');
const path = require('path');
const db = require('../Certicate_Marriage/DB');
const Admin_Signup_Model = require('../Certicate_Marriage/Models/Admin_Signup_Model');

const { PDFDocument } = require('pdf-lib');

const fs = require('fs/promises');

const bcryptjs = require('bcryptjs')

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'Public')));
const bodyParser = require('body-parser');

app.use(bodyParser.json());

const session = require('express-session');
const flash = require('connect-flash');
const New_Registration_Model = require('./Models/New_Registration_Model');

app.use(session({
    secret: 'my_secret_key',
    resave: false,
    saveUninitialized: true,
}));

app.use(flash());

app.use((req, res, next) => { res.locals.messages = req.flash(); next(); });



app.get('/Dashboard/:AdminID', async function (req, res) {

    const Admin_Data = await Admin_Signup_Model.findById(req.params.AdminID).populate('Registration');
    const countUser = Admin_Data.Registration.length;
    const totalUser = await New_Registration_Model.countDocuments();

    res.render('../Certicate_Marriage/Views/Dashboard', { Admin_Data, countUser, totalUser })
})





app.get('/Admin_Signup', function (req, res) {
    res.render('../Certicate_Marriage/Views/Admin_Signup')
})

app.post('/Admin_Signup', async function (req, res) {
    try {
        const Admin_Signup_Data = req.body;


        const Admin_Email = await Admin_Signup_Model.findOne({ Email: Admin_Signup_Data.Email });
        const Admin_Mobile = await Admin_Signup_Model.findOne({ Mobile: Admin_Signup_Data.Mobile });

        if (Admin_Email) {
            req.flash('error', 'Email already exists');
            return res.redirect('/Admin_Signup');
        }

        if (Admin_Mobile) {
            req.flash('error', 'Mobile number already exists');
            return res.redirect('/Admin_Signup');
        }


        if (Admin_Signup_Data.Mobile.length !== 10) {
            req.flash('error', 'Invalid Mobile Number');
            return res.redirect('/Admin_Signup');
        }


        const New_Admin_Signup_Model = new Admin_Signup_Model(Admin_Signup_Data);
        await New_Admin_Signup_Model.save();
        const tokens = await New_Admin_Signup_Model.GenerateJWT();
        console.log('this is signup token ', tokens)

        req.flash('success', 'Registration complete successfully');
        res.redirect(`/Dashboard/${New_Admin_Signup_Model._id}`);

    } catch (error) {
        console.error('Error during admin signup:', error);
        req.flash('error', 'An error occurred during signup. Please try again.');
        res.redirect('/Admin_Signup');
    }
});


app.get('/Admin_Login', function (req, res) {
    res.render('../Certicate_Marriage/Views/Admin_Login')
})


app.post('/Admin_Login', async function (req, res) {
    const { Email, Password } = req.body;
    const Match_Email = await Admin_Signup_Model.findOne({ Email: Email });

    if (Match_Email) {

        const Match_Password = await bcryptjs.compare(Password, Match_Email.Password);
        if (Match_Password) {
            const tokens = await Match_Email.GenerateJWT();
            console.log('This is login token', tokens)
            res.redirect(`/Dashboard/${Match_Email._id}`)
        }

        else {

            req.flash('error', 'Incorrect Email or Password')
        }


    }

    else {

        req.flash('error', 'Invalid login details')
    }

})


app.get('/Dashboard/:AdminID/New_Registration', async function (req, res) {

    const Admin_source = await Admin_Signup_Model.findById(req.params.AdminID)

    res.render('../Certicate_Marriage/Views/New_Registration', { Admin_source })
})


app.post('/Dashboard/:AdminID/New_Registration', async function (req, res) {


    const Registration_Data = req.body;
    const Latest_New_Registration_Model = new New_Registration_Model(Registration_Data);
    await Latest_New_Registration_Model.save();
    const connection = await Admin_Signup_Model.findById(req.params.AdminID);
    connection.Registration.push(Latest_New_Registration_Model._id);
    await connection.save();

    res.redirect(`/Dashboard/${connection._id}`)
})


app.get('/Delete/:id', async function (req, res) {

    await New_Registration_Model.findByIdAndDelete(req.params.id);
    const Delete_Data = await Admin_Signup_Model.findOne({ Registration: req.params.id });
    req.flash('success', 'Data delete Successfully');
    res.redirect(`/Dashboard/${Delete_Data._id}`)

})


app.get('/Edit_User/:id', async function (req, res) {
    try {

        const User_Edit_Data = await New_Registration_Model.findById(req.params.id);
        const Admin_Source = await Admin_Signup_Model.findOne({ Registration: req.params.id })
    

        res.render('../Certicate_Marriage/Views/Edit_Registration', { User_Edit_Data, Admin_Source });


    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Server error');
    }
});




app.post('/Edit_User/:id', async function (req, res) {
    const { Name, Father_Name, Village, PS, Dist, Pin, DOB, L_Name, L_Father_Name, L_Village, L_Post, L_PS, L_Dist, L_Pin, L_DOB, MD, RD, Mohor, Page_No, Vol_No } = req.body

    await New_Registration_Model.findByIdAndUpdate(req.params.id, { Name, Father_Name, Village, PS, Dist, Pin, DOB, L_Name, L_Father_Name, L_Village, L_Post, L_PS, L_Dist, L_Pin, L_DOB, MD, RD, Mohor, Page_No, Vol_No });
    const editData_Source = await Admin_Signup_Model.findOne({ Registration: req.params.id });
    req.flash('success', 'Data edited successfully')
    res.redirect(`/Dashboard/${editData_Source._id}`)


})


app.get('/Pdf_User/:id', async function (req, res) {

    try {
        const pdfData = await New_Registration_Model.findById(req.params.id);
        async function CreatePdf(input, pdf_data) {
            const existingPdfBytes = await fs.readFile(input);
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            const form = pdfDoc.getForm();


            form.getTextField('Name').setText(pdf_data.Name || '');
            form.getTextField('Father_Name').setText(pdf_data.Father_Name || '');
            form.getTextField('Village').setText(pdf_data.Village || '');
            form.getTextField('PS').setText(pdf_data.PS || '');
            form.getTextField('Dist').setText(pdf_data.Dist || '');
            form.getTextField('Age').setText(pdf_data.DOB || '');
            form.getTextField('Post').setText(pdf_data.Post || '');
            form.getTextField('Pin').setText(pdf_data.Pin || '');

            form.getTextField('BName').setText(pdf_data.L_Name || '');
            form.getTextField('BFather_Name').setText(pdf_data.L_Father_Name || '');
            form.getTextField('BVillage').setText(pdf_data.L_Village || '');
            form.getTextField('BPS').setText(pdf_data.L_PS || '');
            form.getTextField('BDist').setText(pdf_data.L_Dist || '');
            form.getTextField('BAge').setText(pdf_data.L_DOB || '');
            form.getTextField('BPost').setText(pdf_data.L_Post || '');
            form.getTextField('BPin').setText(pdf_data.L_Pin || '');

            form.getTextField('MD').setText(pdf_data.MD || '');
            form.getTextField('Mohor').setText(pdf_data.Mohor || '');
            form.getTextField('Vol').setText(pdf_data.vol || '');
            form.getTextField('RD').setText(pdf_data.RD || '');
            form.getTextField('Place').setText(pdf_data.Place || '');
            form.getTextField('Page').setText(pdf_data.Page || '');


            const pdfBytes = await pdfDoc.save();
            return pdfBytes;
        }

        const pdfBytes = await CreatePdf('./Certicate_Marriage/Pdf/Marriage Certificate.pdf', pdfData);


        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Modified_Certificate.pdf"');


        res.end(pdfBytes);

    }
    catch {

        console.log('This is pdf error ')
    }


});

app.listen(3000, () => {

    console.log('Server is connected')
})