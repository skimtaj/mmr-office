const mongoose = require('mongoose');
const SMSchema = new mongoose.Schema({

    Name: {
        type: String,

    },

    Mobile: {
        type: String,

    },

    Email: {
        type: String,

    },

    Address: {
        type: String,

    },

    DOB: {
        type: String,

    },
    Gender: {
        type: String,

    },

    Course: {
        type: String,

    },




});

const SMmodel = mongoose.model('SMmodel', SMSchema);
module.exports=SMmodel ; 