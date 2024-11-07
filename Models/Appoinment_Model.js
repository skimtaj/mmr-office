const mongoose = require('mongoose');
const appoinmentSchema = mongoose.Schema({

    Patient_Name: {

        type: String
    },


    Mobile: {

        type: String
    },

    Email: {

        type: String
    },


    Appointment_Date: {

        type: String
    },


    Appointment_Time: {

        type: String
    },

    Doctor: {

        type: String
    },

    Message: {

        type: String
    },

    Status: {

        type: String,
        default: 'Pending'

    }

});

const Appoinment_Model = mongoose.model('Appoinment_Model', appoinmentSchema);
module.exports = Appoinment_Model; 