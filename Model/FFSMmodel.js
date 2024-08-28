

const mongoose = require('mongoose');
const FFSMSchema = new mongoose.Schema({

    Student_Name: {

        type: String,

    },

    Student_Name: {

        type: String,

    },

    Father_Name: {

        type: String,

    },

    Mobile: {

        type: String,

    },

    Email: {

        type: String,

    },

    Username: {

        type: String,

    },


    Password: {

        type: String,

    },

    Course: {

        type: String,

    },

    Gender: {

        type: String,

    },

    DOB: {

        type: String,

    },

    Image: {

        type: String,

    }




})

const FFSMmodel = mongoose.model("FFSMmodel",FFSMSchema );
module.exports=FFSMmodel; 