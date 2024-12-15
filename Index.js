const express = require('express')
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const JWT = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const nodemailer = require('nodemailer');
const moment = require('moment');
const cron = require('node-cron');


const user_signup_model = require('./Models/user_signup_model');
const note_model = require('./Models/note_model')
const db = require('./DB')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('./upload', express.static(path.join(__dirname, 'upload')));


app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(cookieParser())

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));


app.use(flash());

app.use((req, res, next) => { res.locals.messages = req.flash(); next(); });


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

    const token = req.cookies.userToken;

    if (!token) {

        return res.redirect('/user-login')
    }

    const verified = JWT.verify(token, '12345');
    req.userId = verified._id;
    next()
}


app.get('/logout', function (req, res) {

    res.clearCookie('userToken');
    return res.redirect('/user-login')

})



app.get('/notemaster', function (req, res) {
    res.render('../views/notemaster')
})


app.get('/user-signup', function (req, res) {
    res.render('../views/user-signup')
})


app.post('/user-signup', upload.single('Profile_Image'), async function (req, res) {

    const userSignupdate = req.body;
    userSignupdate.Profile_Image = req.file.filename;

    const signupEmail = await user_signup_model.findOne({ Email: userSignupdate.Email });
    const signupMobile = await user_signup_model.findOne({ Mobile: userSignupdate.Mobile });

    if (signupEmail) {

        req.flash('error', 'Email already exist');
        return res.redirect('/user-signup')
    }

    if (signupMobile) {

        req.flash('error', 'Mobile already exist');
        return res.redirect('/user-signup')
    }

    else {

        const userSignup = user_signup_model(userSignupdate);
        await userSignup.save();

        const token = await userSignup.GenerateJWT();
        res.cookie('userToken', token), {

            httpOnly: true,
            secure: true,
            maxAge: 365 * 24 * 60 * 60 * 1000,
        }

        return res.redirect('/user-dashboard')
    }
})

app.get('/user-login', function (req, res) {
    res.render('../views/user-login')
})

app.post('/user-login', async function (req, res) {
    const { Email, Password } = req.body;

    const loginEmail = await user_signup_model.findOne({ Email: Email });
    if (loginEmail) {
        const matchPassword = await bcryptjs.compare(Password, loginEmail.Password);
        if (matchPassword) {

            const token = await loginEmail.GenerateJWT();

            res.cookie('userToken', token), {

                httpOnly: true,
                secure: true,
                maxAge: 365 * 24 * 60 * 60 * 1000,
            }

            return res.redirect('/user-dashboard')
        }

        else {

            req.flash('error', 'Incorrcet Email or Password');
            return res.redirect('/user-login')
        }
    }

    else {

        req.flash('error', 'Invalid login details');
        return res.redirect('/user-login')

    }

})


app.get('/user-dashboard', auth, async function (req, res) {

    const userID = req.userId;
    const userSource = await user_signup_model.findById(userID).populate({
        path: 'Note',
        options: { sort: { _id: -1 } },
    });

    res.render('../views/user-dashboard', { userSource })
})


app.get('/user-dashboard/new-note', auth, async function (req, res) {

    res.render('../views/insert-note')
})


app.post('/user-dashboard/new-note', auth, upload.single('Note_PDF'), async function (req, res) {

    const noteData = req.body;

    if (req.file) {
        noteData.Note_PDF = req.file.filename
    }

    const new_note_model = note_model(noteData);
    await new_note_model.save();

    const userID = req.userId;
    const userSource = await user_signup_model.findById(userID).populate('Note');
    userSource.Note.push(new_note_model._id);
    await userSource.save();

    const today = moment().format('YYYY-MM-DD');
    const reminderNote = userSource.Note.filter((notification) => notification.Reminder_Date === today);



    if (reminderNote) {


        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'thelearningworld20@gmail.com',
                pass: 'lejp nhlb tpex vlay'
            }
        });

        reminderNote.forEach((note) => {

            var mailOptions = {
                from: 'thelearningworld20@gmail.com',
                to: userSource.Email,
                subject: 'Note Reminder',
                text: ` Note Title : ${note.Note_Title}, Note Content : ${note.Note_Description}`
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                }
            });

        })
    }


    req.flash('success', 'Notes insert successfully')
    return res.redirect('/user-dashboard')

})


app.get('/user-dashboard/view-note/:id', async function (req, res) {
    const noteSource = await note_model.findById(req.params.id)
    res.render('../views/view-note', { noteSource })
})

app.get('/user-dashboard/note-delete/:id', async function (req, res) {
    await note_model.findByIdAndDelete(req.params.id);
    req.flash('success', 'Notes delete successfully')
    return res.redirect('/user-dashboard')
})


app.get('/notemaster/user-dashboard/edit-note/:id', async function (req, res) {

    const editNote = await note_model.findById(req.params.id)
    res.render('../views/edit-note', { editNote })
})


app.post('/notemaster/user-dashboard/edit-note/:id', upload.single('Note_PDF'), async function (req, res) {

    const { Note_Title, Note_Description, Reminder_Date } = req.body

    let Note_PDF;

    if (req.file) {
        Note_PDF = req.file.filename
    }

    await note_model.findByIdAndUpdate(req.params.id, { Note_Title, Note_Description, Reminder_Date, Note_PDF })
    req.flash('success', 'Note update successfully');
    return res.redirect('/user-dashboard')

})



app.get('/user-dashboard/pinned-note', auth, async function (req, res) {

    const userID = req.userId;
    const userSource = await user_signup_model.findById(userID).populate('Note');
    const pinnedNote = userSource.Note.filter((note) => note.Status === 'Pin')

    res.render('../views/pinned-dashboard', { pinnedNote })
})


app.get('/user-dashboard/unpin-note/:id', auth, async function (req, res) {

    const noteSource = await note_model.findById(req.params.id);
    noteSource.Status = 'unpin';
    await noteSource.save();
    req.flash('success', 'Note unpin Successfully');
    return res.redirect('/user-dashboard');

})


app.get('/user-dashboard/pinned-note/:id', async function (req, res) {

    const noteSource = await note_model.findById(req.params.id);
    noteSource.Status = 'Pin'
    await noteSource.save();
    req.flash('success', 'Note pinned successfully. Plesae visit your pin page');
    return res.redirect('/user-dashboard');

})


app.get('/pdf-download/:id', async function (req, res) {

    const pdfData = await note_model.findById(req.params.id);

    const pdfpath = path.join(__dirname, 'upload', pdfData.Note_PDF);
    res.download(pdfpath, (error) => {

        if (error) {
            return res.status(404).send('File not found');
        }
    })
})


app.get('/user-dashboard/profile', auth, async function (req, res) {

    const userID = req.userId;
    const userSource = await user_signup_model.findById(userID)
    res.render('../views/user-profile', { userSource })
})


app.get('/user-dashboard/profile/edit', auth, async function (req, res) {

    const userID = req.userId;
    const userSource = await user_signup_model.findById(userID)
    res.render('../views/edit-user', { userSource })
})

app.post('/user-dashboard/profile/edit', upload.single('Profile_Image'), auth, async function (req, res) {

    const { Name, Mobile, Email } = req.body;
    let Profile_Image;

    if (req.file) {

        Profile_Image = req.file.filename
    }


    const userID = req.userId;
    await user_signup_model.findByIdAndUpdate(userID, { Name, Mobile, Email, Profile_Image })
    req.flash('success', 'User Profile update successfully');
    return res.redirect('/user-dashboard/profile')

})


app.get('/forget-password', async function (req, res) {

    res.render('../views/forget-password.ejs')
})

app.post('/forget-password', async function (req, res) {

    const { Email } = req.body;
    const userEmail = await user_signup_model.findOne({ Email: Email });

    if (userEmail) {


        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'thelearningworld20@gmail.com',
                pass: 'lejp nhlb tpex vlay'
            }
        });

        const mailOptions = {
            from: 'thelearningworld20@gmail.com',
            to: userEmail.Email,
            subject: 'Reset Your Password',
            text: `Click the following link to reset your password: https://localhost:3000/Reset-Password/${userEmail._id}`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        req.flash('success', 'Plesae check your Email');
        return res.redirect('/forget-password')

    }

    else {
        req.flash('error', ' Sorry ! You have not signup yet');
        return res.redirect('forget-password')
    }


})


app.get('/reset-password/:id', async function (req, res) {

    res.render('../views/reset-password.ejs')
})

app.post('/reset-password/:id', async function (req, res) {

    const { Email, Password } = req.body;
    const userEmail = await user_signup_model.findOne({ Email: Email });
    userEmail.Password = Password;
    await userEmail.save();;
    req.flash('password Reset Successfully')
    return res.redirect('/user-dashboard')
})




app.listen(3000, () => {

    console.log('Server is connected')
})