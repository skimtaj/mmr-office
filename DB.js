
const mongoose = require('mongoose');

//const mongourl = 'mongodb://localhost:27017/Registration_certificate';


const mongourl = 'mongodb+srv://imtajdatabase:12345@project.3e1ld.mongodb.net/?retryWrites=true&w=majority&appName=project'

mongoose.connect(mongourl);

const db = mongoose.connection;

db.on('connected', () => {

    console.log('Connected to MongoDB server');

});


db.on('error', (error) => {

    console.error('MongoDB connection error:', error);

});


db.on('disconnected', () => {

    console.log('MongoDB disconnected');

});



module.exports = db;