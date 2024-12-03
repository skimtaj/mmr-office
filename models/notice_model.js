const mongoose = require('mongoose');
const noticeSchema = mongoose.Schema({

    Title: {

        type: String
    },

    Short_Description: {

        type: String
    },

    Date: {

        type: String
    },

    Notice_Pdf: {

        type: String
    }

});

const notice_model = mongoose.model('notice_model', noticeSchema);
module.exports = notice_model;