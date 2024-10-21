const mongoose = require('mongoose');
const dawatSchema = mongoose.Schema({

    Date: {

        type: String
    },


    Place: {

        type: String
    },

    Program_Type: {

        type: String
    },

    Name: {

        type: String
    },

    Mobile: {

        type: String
    },


});


const Dawat_Model = mongoose.model('Dawat_Model', dawatSchema);
module.exports = Dawat_Model; 