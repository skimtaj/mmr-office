const mongoose = require('mongoose');
const jobSchema = mongoose.Schema({

    Job_Title: {

        type: String
    },

    Description: {

        type: String
    },

    Roles_Responsibilities: {

        type: String
    },

    Duty_Time: {

        type: String
    },


    Qualification: {

        type: String
    },

    Location: {

        type: String
    },

    Contact_Info: {

        type: String
    },

    Category: {

        type: String
    }

});

const Job_Registration_Model = mongoose.model('Job_Registration_Model', jobSchema);

module.exports = Job_Registration_Model; 