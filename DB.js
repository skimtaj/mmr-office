const mongoose = require('mongoose');

// const mongourl = 'mongodb://localhost:27017/Hospital_Management';

const mongourl = 'mongodb+srv://imtajdatabase:e5g1oAqkKh7NhD2o@hospitalmanagement.qo1uh.mongodb.net/?retryWrites=true&w=majority&appName=hospitalmanagement'

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