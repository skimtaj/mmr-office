const express = require('express')
const app = express();
const Admin_Model = require('./Models/Admin_Model');
const Doctor_Model = require('./Models/Doctor_Model');
const Appoinment_Model = require('./Models/Appoinment_Model');
const Patient_Model = require('./Models/Patient_Model');
const db = require('./db');
const bcryptjs = require('bcryptjs');
const nodemailer = require('nodemailer');
const moment = require('moment');


const { PDFDocument } = require('pdf-lib');
const fs = require('fs/promises');


const path = require('path');
app.set('view engine', 'ejs');
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use('/Upload', express.static(path.join(__dirname, 'Upload')));
const bodyParser = require('body-parser');
app.use(bodyParser.json());

const session = require('express-session');
const flash = require('connect-flash');

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

app.use(flash())

app.use((req, res, next) => { res.locals.messages = req.flash(); next(); });


const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './Upload')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
  }
});



const upload = multer({ storage: storage });


const auth = (req, res, next) => {

  if (!req.session.adminId) {

    return res.redirect('/admin-login')
  }

  next()
}

const Auth = (req, res, next) => {

  if (!req.session.doctorId) {
    return res.redirect('/doctor-login')
  }
  next();
}



app.get('/admin-signup', function (req, res) {
  res.render('../Views/Admin_Signup')
})

app.post('/admin-signup', upload.single('Profile_Image'), async function (req, res) {

  try {

    const adminData = req.body;
    adminData.Profile_Image = req.file.filename;
    const adminEmail = await Admin_Model.findOne({ Email: adminData.Email });
    const adminMobile = Admin_Model.findOne({ Mobile: adminData.Mobile });

    if (adminEmail) {
      req.flash('error', 'Email already exist');
      return res.redirect('/admin-signup')
    }

    else if (adminMobile) {
      req.flash('error', 'Mobile already exist');
      return res.redirect('/admin-signup')
    }

    else if (adminData.Mobile.length !== 10) {

      req.flash('error', 'Mobile number must be 10 charecters ');
      return res.redirect('/admin-signup')
    }

    else {
      const newAdminmodel = new Admin_Model(adminData);
      await newAdminmodel.save();
      const tokens = await newAdminmodel.generateJWT();
      req.session.adminId = newAdminmodel._id;
      return res.redirect('/admin-dashboard')
    }

  }

  catch (error) {

    console.log('This is signup error', error)

  }

})

app.get('/admin-login', function (req, res) {
  res.render('../Views/Admin_Login')
})

app.post('/admin-login', async function (req, res) {

  const { Email, Password } = req.body;

  const adminLoginemail = await Admin_Model.findOne({ Email })

  if (adminLoginemail) {
    const matchPassword = await bcryptjs.compare(Password, adminLoginemail.Password);

    if (matchPassword) {
      const tokens = await adminLoginemail.generateJWT();
      req.session.adminId = adminLoginemail._id;
      return res.redirect('/admin-dashboard')
    }

    else {
      req.flash('error', 'Incorrect Email or Password');
      return res.redirect('/admin-login')
    }
  }

  else {
    req.flash('error', 'Invalid login details ');
    return res.redirect('/admin-login')
  }

})

app.get('/admin-dashboard', auth, async function (req, res) {

  const adminID = req.session.adminId;
  const adminData = await Admin_Model.findById(adminID);
  const appoinment = await Appoinment_Model.find();
  const appoinmentCount = appoinment.length;
  const doctor = adminData.Doctor.length;


  res.render('../Views/Admin_Dashboard', { adminData, appoinmentCount, doctor, appoinment })
})


app.get('/admin-dashboard/profile/:id', async function (req, res) {

  const adminData = await Admin_Model.findById(req.params.id)

  res.render('../Views/Admin_Profile.ejs', { adminData })
})



app.get('/admin-dashboard/profile/edit-profile/:id', async function (req, res) {

  const adminData = await Admin_Model.findById(req.params.id)

  res.render('../Views/Edit_Admin.ejs', { adminData })
})



app.post('/admin-dashboard/profile/edit-profile/:id', upload.single('Profile_Image'), async function (req, res) {

  try {
    const { Name, Mobile, Email } = req.body;
    const Profile_Image = req.file.filename;
    const editAdmin = await Admin_Model.findByIdAndUpdate(req.params.id, { Name, Mobile, Email, Profile_Image });
    req.session.adminId = editAdmin._id;
    return res.redirect('/admin-dashboard')
  }

  catch (error) {

    console.log(' This is File uploading error', error)
  }

})



app.get('/admin-dashboard/:id/new-doctor', async function (req, res) {

  const adminData = await Admin_Model.findById(req.params.id)

  res.render('../Views/Doctor_Join_Form.ejs', { adminData })
})



app.post('/admin-dashboard/:id/new-doctor', upload.single('Profile_Image'), async function (req, res) {

  const doctorData = req.body;
  doctorData.Profile_Image = req.file.filename;
  const New_Doctor_Model = new Doctor_Model(doctorData);
  await New_Doctor_Model.save();

  const connect = await Admin_Model.findById(req.params.id);
  connect.Doctor.push(New_Doctor_Model._id);
  await connect.save();

  req.flash('success', 'Doctor added successfully')

  return res.redirect(`/admin-dashboard/${connect._id}/doctors`)

})

app.get('/admin-dashboard/:id/doctors', async function (req, res) {
  const adminData = await Admin_Model.findById(req.params.id).populate('Doctor');
  res.render('../Views/Doctor_List.ejs', { adminData })
})

app.get('/admin-dashboard/delete-doctor/:id', async function (req, res) {

  await Doctor_Model.findByIdAndDelete(req.params.id);
  const deleteDoctorsource = await Admin_Model.findOne({ Doctor: req.params.id });
  req.flash('success', 'New Doctor added successfully')
  return res.redirect(`/admin-dashboard/${deleteDoctorsource._id}/doctors`);
})


app.get('/admin-dashboard/edit-doctor/:id', async function (req, res) {

  const editDoctordata = await Doctor_Model.findById(req.params.id)

  res.render('../Views/Edit_Doctor.ejs', { editDoctordata })
})

app.post('/admin-dashboard/edit-doctor/:id', upload.single('Profile_Image'), async function (req, res) {

  const { Doctor_Name, Mobile, Email, DOB, Department, Gender, Address } = req.body;
  Profile_Image = req.file.filename;
  await Doctor_Model.findByIdAndUpdate(req.params.id, { Doctor_Name, Mobile, Email, DOB, Department, Gender, Address, Profile_Image });

  const updateAdmin = await Admin_Model.findOne({ Doctor: req.params.id })
  return res.redirect(`/admin-dashboard/${updateAdmin._id}/doctors`)

})


app.get('/penrohospital/appponment', async function (req, res) {

  const doctorList = await Doctor_Model.find();
  res.render('../Views/Appoinment_Form.ejs', { doctorList })
})



app.post('/penrohospital/appponment', async function (req, res) {

  const appoinmentData = req.body;
  const New_Appoinment_Model = new Appoinment_Model(appoinmentData);
  await New_Appoinment_Model.save();

  const doctorId = New_Appoinment_Model.Doctor;


  const connectWithdoctor = await Doctor_Model.findById(doctorId);
  connectWithdoctor.Appoinment.push(New_Appoinment_Model._id);
  await connectWithdoctor.save();
  res.send('Apponment success');


  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "skimtaj779@gmail.com",
      pass: 'qahj ocox shtp dlog',
    }
  });


  const mailOptions = {
    from: 'skimtaj779@gmail.com',
    to: connectWithdoctor.Email,
    subject: 'Appoinment Mail',
    text: ` A new patient is requiesting for an appoinment. 
        Patient Name : ${New_Appoinment_Model.Patient_Name},
        Mobile : ${New_Appoinment_Model.Mobile}`
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
})

app.get('/penrohospital', async function (req, res) {


  res.render('../Views/Penro_Hospital.ejs')
})


app.get('/Logout', function (req, res) {

  req.session.destroy(() => {

    return res.redirect('/admin-login')
  })
})



app.get('/penrohospital/doctor-profile', Auth, async function (req, res) {
  const DoctorID = req.session.doctorId;
  const doctorData = await Doctor_Model.findById(DoctorID).populate(['Appoinment', 'Patient ']);
  const today = moment().format('YYYY-MM-DD');
  const todaPatient = doctorData.Appoinment.filter(patient => patient.Appointment_Date === today)

  res.render('../Views/Doctor_Profile.ejs', { doctorData, todaPatient, DoctorID })
})


app.get('/doctor-login', async function (req, res) {

  res.render('../Views/Doctor_Login.ejs')
});


app.post('/doctor-login', async function (req, res) {

  const { Email, Password } = req.body;
  const doctorEmail = await Doctor_Model.findOne({ Email });
  if (doctorEmail) {

    const matchPassword = await bcryptjs.compare(Password, doctorEmail.Password);
    if (matchPassword) {
      const token = await doctorEmail.generateJDW();
      console.log('This is Doctor login Token ', token)
      req.session.doctorId = doctorEmail._id;
      res.redirect("/penrohospital/doctor-profile")
    }

    else {

      req.flash('error', 'Incorrect Email or Password');
      return res.redirect("/doctor-login")
    }
  }

  else {
    req.flash('error', 'Invalid login details');
    return res.redirect("/doctor-login")
  }

});


app.get('/penrohospital/doctor-profile/:id/patient-form', async function (req, res) {


  res.render('../Views/Patient_Form.ejs')
});

app.post('/penrohospital/doctor-profile/:id/patient-form', async function (req, res) {

  const patientData = req.body;
  const New_Patiend_Model = new Patient_Model(patientData);
  await New_Patiend_Model.save();

  const connectDoctor = await Doctor_Model.findById(req.params.id)
  connectDoctor.Patient.push(New_Patiend_Model._id);
  await connectDoctor.save();
  return res.redirect('/penrohospital/doctor-profile')

});


app.get('/admin-dashboard/:id/patint-list', async function (req, res) {
  const adminData = await Admin_Model.findById(req.params.id);

  res.render('../Views/Patiend_List.ejs', { adminData })
});

app.get('/accept/:id', async function (req, res) {

  const acceptData = await Appoinment_Model.findById(req.params.id);
  acceptData.Status = 'Accept'
  await acceptData.save();

  return res.redirect('/admin-dashboard');


});


app.get('/reject/:id', async function (req, res) {

  const rejectData = await Appoinment_Model.findById(req.params.id);
  rejectData.Status = 'Reject'
  await rejectData.save();
  return res.redirect('/admin-dashboard');

});


app.get('/patient-report/:id', async function (req, res) {

  try {

    const patientReport = await Patient_Model.findById(req.params.id)
    console.log(patientReport);

    async function CreatePdf(input, patientReport) {
      const existingPdfBytes = await fs.readFile(input);
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const form = pdfDoc.getForm();

      form.getTextField('Patient_Name').setText(patientReport.Patient_Name || '');
      form.getTextField('Gender').setText(patientReport.Gender || '');
      form.getTextField('DOB').setText(patientReport.DOB || '');
      form.getTextField('Date').setText(patientReport.Date || '');
      form.getTextField('Medical_History').setText(patientReport.Medical_History || '');
      form.getTextField('Medications').setText(patientReport.Medications || '');

      const pdfBytes = await pdfDoc.save();
      return pdfBytes;
    }

    const pdfBytes = await CreatePdf('./Prescription/Doctor Prescription (1) (1).pdf', patientReport);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Modified_Report.pdf"');
    res.end(pdfBytes);

  } catch (error) {
    console.log('Error:', error);
    res.status(500).send('An error occurred while processing the PDF.');
  }


});


app.listen(3000, () => {

  console.log('Server is connected')
})