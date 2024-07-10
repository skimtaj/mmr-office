const mongoose = require('mongoose');

const ModelSchema = new mongoose.Schema({

    Name: {
        type: String,
        required: true

    },

    Designation: {
        type: String,
        required: false

    },

    Mobile: {
        type: String,
        required: true,
        unique: true

    }


})

const FacultyModel = mongoose.model('FacultyModel', ModelSchema ); 
module.exports=FacultyModel; 