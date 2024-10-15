const mongoose = require('mongoose');
const uploadSchema = mongoose.Schema({

    Name: {

        type: String
    },

    DateTime: {

        type: String
    },

    Caption: {

        type: String
    },

    Media: {

        type: String
    },


});


const Upload_Model = mongoose.model('Upload_Model', uploadSchema);
module.exports = Upload_Model; 