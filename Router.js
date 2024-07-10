const express = require('express');
const app = express();
const db = require('./Database/dbT');

const path = require('path');
const bodyParser = require('body-parser');
const FacultyModel = require('./Database/Models/FacultyModel')


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'Public')));
app.use(bodyParser.json());

app.set('view engine', 'ejs');



app.get('/Teacher', function (req, res) {
  res.render('Employee')
})

app.post('/Teacher', async function (req, res) {
  try {

    const data = req.body;
    const newModel = new FacultyModel(data);
    await newModel.save();
    res.status(200).send(newModel);


  }
  catch (error) {
    res.status(500).send(error)

  }

})


app.get('/Teacher/:Class', async function (req, res) {

  try {

    const data = req.params.Class;
    if (data == 'Bengali' || data == 'English' || data == 'Math' || data == 'Arabic') {

      const response = await FacultyModel.find({ Designation: data });
      res.status(200).send(response);

    }
    else {

      res.send("Sorry ! Data Not Founded");

    }

  }
  catch (error) {

    res.status(500).send(error)

  }

})

app.listen(5000);