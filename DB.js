const mongoose = require('mongoose');

const mongourl = 'mongodb+srv://dpsdatabase:Skimtaj786@dps.wwxxg.mongodb.net/'

//const mongourl = 'mongodb://localhost:27017/DPS_Project';

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