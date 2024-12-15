const mongoose = require('mongoose');
const noteSchema = mongoose.Schema({

    Date: {

        type: String
    },

    Time: {

        type: String
    },

    Note_Title: {

        type: String
    },

    Note_Description: {

        type: String
    },

    Note_PDF: {

        type: String
    },

    Status: {

        type: String,
        default: 'unpin'
    },

    Reminder_Date: {

        type: String
    }


});

const note_model = mongoose.model('note_model', noteSchema);
module.exports = note_model; 