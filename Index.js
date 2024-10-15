const express = require('express')
const app = express();
app.set('view engine', 'ejs');
const db = require('./db');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

const User_Signup_Model = require('./Models/User_Signup_Model');
const Upload_Model = require('./Models/Upload_Model');
const Job_Registration_Model = require('./Models/Job_Registration_Model');

const path = require('path');
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use('/Upload', express.static(path.join(__dirname, 'Upload')));

const bodyParser = require('body-parser');

app.use(bodyParser.json());

const multer = require('multer');

const session = require('express-session');
const flash = require('connect-flash');

app.use(session({
  secret: 'your_secret_key', // Replace with your own secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}));

app.use(flash());

app.use((req, res, next) => { res.locals.messages = req.flash(); next(); });


const auth = (req, res, next) => {
  if (!req.session.userId) {

    res.redirect('/BB-User-Login')

  }

  next();
}


app.get('/Logout', function (req, res) {

  req.session.destroy(() => {

    res.redirect('/BB-User-Login')

  })

})



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './Upload')
  },

  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
  }
})

const upload = multer({ storage: storage })


app.get('/BrandBoost/:id', async function (req, res) {

  const userData = await User_Signup_Model.findById(req.params.id).populate('Upload');
  const userUpload = await Upload_Model.find().sort({ _id: -1 });
  res.render('../Views/User_Dashboard', { userData, userUpload })
})

app.get('/BrandBoost/Edit-Profile/:id', async function (req, res) {
  const userData = await User_Signup_Model.findById(req.params.id);
  res.render('../Views/Edit_Profile', { userData })
})


app.post('/BrandBoost/Edit-Profile/:id', upload.single('Profile_Image'), async function (req, res) {
  const { Name, Mobile, Email } = req.body;
  Profile_Image = req.file.filename;

  const ediData = await User_Signup_Model.findByIdAndUpdate(req.params.id, { Name, Mobile, Email, Profile_Image });
  req.flash('successa', 'Edit profile successfully');
  console.log('Edit profile successfully')
  res.redirect(`/BrandBoost/${ediData._id}`);

})

app.get('/BrandBoost/Job/:id', async function (req, res) {
  const userData = await User_Signup_Model.findById(req.params.id).populate('Job');

  res.render('../Views/Job', { userData })
})


app.get('/BB-User-Login', function (req, res) {
  res.render('../Views/Login')
})

app.post('/BB-User-Login', async function (req, res) {

  const { Email, Password } = req.body;

  const userEmail = await User_Signup_Model.findOne({ Email: Email });
  if (userEmail) {
    const matchPassword = await bcryptjs.compare(Password, userEmail.Password);
    if (matchPassword) {
      const tokens = await userEmail.GenerateJWT();
      console.log('This is login token ', tokens);
      res.redirect(`/BrandBoost/${userEmail._id}`)
    }

    else {
      req.flash('error', 'Incorrect email or password');
      res.redirect('/BB-User-Login')
    }
  }

  else {
    req.flash('error', 'Invalid login deatils');
    return res.redirect('/BB-User-Login')
  }
})

app.get('/BB-User-Signup', function (req, res) {
  res.render('../Views/User_Signup')
})

app.post('/BB-User-Signup', upload.single('Profile_Image'), async function (req, res) {

  const userSignupdata = req.body;
  userSignupdata.Profile_Image = req.file.filename;

  const userEmail = await User_Signup_Model.findOne({ Email: userSignupdata.Email });
  const userMobile = await User_Signup_Model.findOne({ Mobile: userSignupdata.Mobile })

  if (userEmail) {

    req.flash('error', 'Email already exist ');
    return res.redirect('/BB-User-Signup');
  }

  else if (userMobile) {

    req.flash('error', 'Mobile number already exist ');
    return res.redirect('/BB-User-Signup');
  }

  else if (userSignupdata.Mobile.length !== 10) {
    req.flash('error', 'Mobile number already must be 10 charecters ');
    return res.redirect('/BB-User-Signup');
  }

  const New_User_Signup_Model = new User_Signup_Model(userSignupdata);

  const tokens = await New_User_Signup_Model.GenerateJWT();
  console.log('This is Signup token ', tokens);

  await New_User_Signup_Model.save();


  res.redirect(`/BrandBoost/${New_User_Signup_Model._id}`);

});

app.get('/BB-Forget-Password', function (req, res) {
  res.render('../Views/Forget_Password')
})

app.post('/BB-Forget-Password', async function (req, res) {

  const { Email, Password } = req.body;
  const forgetEmail = await User_Signup_Model.findOne({ Email: Email });

  if (forgetEmail) {
    forgetEmail.Password = Password;
    await forgetEmail.save();
    req.flash('success', 'Password update successfully')
    res.redirect('/BB-User-Login');
  }


  else {
    req.flash('error', 'Email is not matching');
    return res.redirect('/BB-Forget-Password')
  }
})




app.get('/BrandBoost/Post/:id', async function (req, res) {

  const userData = await User_Signup_Model.findById(req.params.id);

  res.render('../Views/Upload_Form', { userData })
})

app.post('/BrandBoost/Post/:id', upload.single('Media'), async function (req, res) {

  const uploadData = req.body;
  uploadData.Media = req.file.filename;
  const New_Upoad_Media = new Upload_Model(uploadData);
  await New_Upoad_Media.save();

  const connect = await User_Signup_Model.findById(req.params.id)
  connect.Upload.push(New_Upoad_Media._id);
  await connect.save();
  res.redirect(`/BrandBoost/${connect._id}`);

})


app.get('/Delete-Post/:id', async function (req, res) {

  await Upload_Model.findByIdAndDelete(req.params.id);
  const deletePost = await User_Signup_Model.findOne({ Upload: req.params.id });
  req.flash('success', 'Post deleted successfuly')
  res.redirect(`/User-Profile/${deletePost._id}`)

})


app.get('/Edit-Post/:id', async function (req, res) {

  const userData = await User_Signup_Model.findOne({ Upload: req.params.id })

  const editDatasource = await Upload_Model.findById(req.params.id)

  res.render('../Views/Edit_Upload', { editDatasource, userData })

})


app.post('/Edit-Post/:id', upload.single('Media'), async function (req, res) {

  const { Caption } = req.body;
  Media = req.file.filename;

  await Upload_Model.findByIdAndUpdate(req.params.id, { Caption, Media });

  const editUsersource = await User_Signup_Model.findOne({ Upload: req.params.id });
  req.flash('success', 'Edit post successfully');
  res.redirect(`/user-Profile/${editUsersource._id}`)
})


app.get('/User-Profile/:id', async function (req, res) {
  const userData = await User_Signup_Model.findById(req.params.id).populate('Upload')
  res.render('../Views/Profile', { userData })
});


app.get('/BrandBoost/Job-Registration/:id', async function (req, res) {
  const userData = await User_Signup_Model.findById(req.params.id);
  res.render('../Views/Job_Registration_Page', { userData })
});


app.post('/BrandBoost/Job-Registration/:id', async function (req, res) {

  const job = req.body;
  const New_Job_REgistration_Model = Job_Registration_Model(job);
  await New_Job_REgistration_Model.save();

  const jobConnect = await User_Signup_Model.findById(req.params.id);
  jobConnect.Job.push(New_Job_REgistration_Model._id);
  await jobConnect.save();
  res.redirect(`/BrandBoost/Job/${jobConnect._id}`);

});



const PORT = process.env.PORT || 3000

app.listen(PORT, () => {

  console.log('Server is connected')
})