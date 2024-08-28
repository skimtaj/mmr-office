const express = require('express');
const Student_Registration_Model = require('./Models/Student_Registration_Model');
const Book_Collection_Model = require('../Magazine/Models/Book_Collection_Model');
const DbConnection = require('../Magazine/DB_Connect');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
app.set('view engine', 'ejs');

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'Public')));

const bodyParser = require('body-parser');
const { title } = require('process');

app.use(bodyParser.json());


app.get('/Student_Registration', function (req, res) {
    res.render('../Magazine/Views/Student_Registration');
});

app.post('/Student_Registration', async function (req, res) {

    const data = req.body;
    const Student_Email = await Student_Registration_Model.findOne({ Email: data.Email });
    if (Student_Email) {

        res.send('Email already exist'); 
    }
    else { 

        const NewModel = new Student_Registration_Model(data);
        const token = NewModel.GenerateJWT();
        console.log('This is Registration Token ' + token);
        await NewModel.save();
     


        res.redirect(`/Dashboard/${NewModel._id}`)
    }

});

app.get('/Student_Login', function (req, res) {
    res.render('../Magazine/Views/Student_Login');
});


app.get('/Dashboard/:id/New_Magazine', function (req, res) {

    res.render('../Magazine/Views/New_Post_Form');
});


app.post('/Dashboard/:id/New_Magazine', async function (req, res) {

    try {

        const BookData = req.body;
        const New_Book_Model = new Book_Collection_Model(BookData);
        await New_Book_Model.save();

        const StudentData = await Student_Registration_Model.findById(req.params.id);
        StudentData.Books.push(New_Book_Model._id);
        await StudentData.save();

        res.redirect(`/Dashboard/${StudentData._id}`);

    }
    catch (error) { 

        req.status(500).send(error)
    } 
});


app.get('/Delete/:BookID', async function (req, res) {
    try {
        // Attempt to delete the book by its ID
        const afterDelete = await Book_Collection_Model.findByIdAndDelete(req.params.BookID);

        if (afterDelete) {
            // Redirect to the general dashboard


            const DeleteStudentBook = await Student_Registration_Model.findOne({Books:req.params.BookID}) ; 


            res.redirect(`/Dashboard/${DeleteStudentBook._id}`);
        } else {
            // Send a message if the book was not found
            res.send('Book Not Found');
        }
    } catch (error) {
        // Log the error and send a generic error message
        console.error('Error deleting book:', error);
        res.status(500).send('Deleting error');
    }
});


app.get('/Edit/:BookID', async function (req, res) {

    const Edit_Data = await Book_Collection_Model.findById(req.params.BookID); 

    res.render('../Magazine/Views/Edit',{Edit_Data});

});


app.post('/Edit/:BookID', async function (req, res) {

    const {Title} = req.body
    const Editdata  = await Book_Collection_Model.findByIdAndUpdate(req.params.BookID,{Title});
 
 if(Editdata){
 
   
const UpdateData = await Student_Registration_Model.findOne({Books: req.params.BookID})

    res.redirect(`/Dashboard/${UpdateData._id}`);

 }

});



app.get('/Home', async function (req, res) {

    const AllBook = await Book_Collection_Model.find() ; 

    res.render('../Magazine/Views/Home',{AllBook});
});

app.get('/Blog_View/:id', async function (req, res) {

    const ReadBlog = await Book_Collection_Model.findById(req.params.id) ; 

    res.render('../Magazine/Views/ViewBlog',{ReadBlog});
});



app.post('/like/:id', async function (req, res) {
    try {
        console.log('Received Like Request for ID:', req.params.id); // Debug log
        const LikeBook = await Book_Collection_Model.findById(req.params.id);
        if (LikeBook) {
            LikeBook.Like += 1;
            await LikeBook.save();
            console.log('Like Count Updated:', LikeBook.Like); // Debug log
        }
        res.redirect('/Home');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

app.post('/dislike/:id', async function (req, res) {
    try {
        console.log('Received Dislike Request for ID:', req.params.id); // Debug log
        const DisLikeBook = await Book_Collection_Model.findById(req.params.id);
        if (DisLikeBook) {
            DisLikeBook.Dislike += 1;
            await DisLikeBook.save();
            console.log('Dislike Count Updated:', DisLikeBook.Dislike); // Debug log
        }
        res.redirect('/Home');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});



app.get('/Dashboard/:id', async function (req, res) {

    const Student_data = await Student_Registration_Model.findById(req.params.id).populate('Books');

    res.render('../Magazine/Views/Student_Dashboard', { Student_data });
});




app.listen(3000, () => {

    console.log('Server is connected');
})