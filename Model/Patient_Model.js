const mongoose = require('mongoose');
const PatientSchema = new mongoose.Schema({


    Name: {

        type: String

    },


    Age: {

        type: String

    },

    Gender: {

        type: String

    },


    Address: {

        type: String

    },


    Mobile: {

        type: String

    },


    Referred: {

        type: String

    },


    Test: {

        type: String

    },



})
const Patient_Model = mongoose.model("Patient_Model", PatientSchema);
module.exports=Patient_Model; 