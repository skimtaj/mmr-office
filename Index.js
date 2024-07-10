const express = require('express')
const app = express();
const db = require("./Database/db")
const Models = require('./Database/Models/Regi');

const path = require('path');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'Public')));
app.set('view engine', 'ejs');

const bodyParser = require('body-parser');
const Regi = require('./Database/Models/Regi');
app.use(bodyParser.json());




app.get('/Imtaj', function (req, res) {
    res.render("Form")
}) 

app.post('/Imtaj',  async (req, res) => {

    try {
        const data = req.body;
        const newRegi = new Regi(data);
        await newRegi.save();
        res.status(201).send(newRegi);

    }
    catch (error) {
        res.status(500).send(error)
0
    }

})

app.listen(5000) 