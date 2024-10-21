const mongoose = require('mongoose');

//const mongourl = 'mongodb://localhost:27017/Dawatnama';

const mongourl = 'mongodb+srv://DawatNama:Skimtaj786@cluster0.v2fcn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'

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