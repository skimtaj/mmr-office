const mongoose = require('mongoose');
const paymentSchema = mongoose.Schema({

    Name: {

        type: String
    },

    Mobile: {

        type: String
    },

    Pay_Month: {

        type: String
    },

    Pay_Amount: {

        type: String
    },

    Date: {

        type: String
    },

    Status: {

        type: String,
        default: 'Unpaid'
    },

    Payment_Proof: {

        type: String
    },

    Donation_Year: {

        type: String
    }
});


const payment_model = mongoose.model('payment_model', paymentSchema);
module.exports = payment_model;