const mongoose = require('mongoose');
const certificateSchema = mongoose.Schema({

    Name: {

        type: String
    },

    Father_Name: {

        type: String
    },

    Village: {

        type: String
    },

    Post: {

        type: String
    },

    PS: {

        type: String
    },

    Dist: {

        type: String
    },

    Pin: {

        type: String
    },


    DOB: {

        type: String
    },


    L_Name: {

        type: String
    },

    L_Father_Name: {

        type: String
    },


    L_Village: {

        type: String
    },

    L_Post: {

        type: String
    },

    L_PS: {

        type: String
    },

    L_Dist: {

        type: String
    },


    Bride_Pin: {

        type: String
    },

    L_DOB: {

        type: String
    },

    MD: {

        type: String
    },

    RD: {

        type: String
    },

    POM: {

        type: String
    },

    Mohor: {

        type: String
    },

    Page_No: {

        type: String
    },

    Vol_No: {

        type: String
    },

    Payment: {

        type: String,
        default: 'due'
    }



});


const mmr_certificate = mongoose.model('mmr_certificate', certificateSchema);

module.exports = mmr_certificate; 