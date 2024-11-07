const mongoose = require('mongoose');
const patientSchema = mongoose.Schema({

    Patient_Name: {

        type: String
    },

    Mobile: {

        type: String
    },

    Gender: {

        type: String
    },


    DOB: {

        type: String
    },

    Date: {

        type: String
    },

    Medical_History: {

        type: String
    },


    Medications: {

        type: String
    },

    Follow_up: {

        type: String
    },

});

const Patient_Model = mongoose.model('Patient_Model', patientSchema);
module.exports = Patient_Model;