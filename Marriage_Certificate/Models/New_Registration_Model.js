const mongoose = require('mongoose');
const RegistrationSchema = new mongoose.Schema({

    Name: {

        type: String,
    },

    Father_Name: {

        type: String,
    },

    Village: {

        type: String,
    },

    Post: {

        type: String,
    },

    PS: {

        type: String,
    },


    Dist: {

        type: String,
    },

    Pin: {

        type: String,
    },

    DOB: {

        type: String,
    },



    L_Name: {

        type: String,
    },

    L_Father_Name: {

        type: String,
    },

    L_Village: {

        type: String,
    },

    L_Post: {

        type: String,
    },

    L_PS: {

        type: String,
    },

    L_Dist: {

        type: String,
    },

    L_Pin: {

        type: String,
    },

    L_DOB: {

        type: String,
    },

    MD: {

        type: String,
    },

    RD: {

        type: String,
    },

    Mohor: {

        type: String,
    },
    
    Place: {

        type: String,
    },

    Page: {

        type: String,
    },
    vol:{

        type : String 
    }



}) ; 


const New_Registration_Model = mongoose.model('New_Registration_Model', RegistrationSchema ) ; 
module.exports= New_Registration_Model ; 