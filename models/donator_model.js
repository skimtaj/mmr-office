const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const JWT = require('jsonwebtoken');
const donatorSchema = mongoose.Schema({

    Name: {

        type: String
    },

    Mobile: {

        type: String
    },

    Email: {

        type: String
    },

    Password: {

        type: String
    },

    Profile_Image: {

        type: String
    },

    Passing_Year: {

        type: String
    },

    Token: [{

        token: {

            type: String
        }
    }],

    Payment: [{

        type: mongoose.Schema.Types.ObjectId,
        ref: 'payment_model'
    }]

});

donatorSchema.methods.GenerateJWT = async function () {

    try {

        const token = JWT.sign({ _id: this._id.toString() }, '12345', { expiresIn: '365d' });
        this.Token = this.Token.concat({ token: token });
        await this.save();
        return token
    }

    catch (error) {
        console.log('This is Donator Generate token error', error)

    }

}


donatorSchema.pre('save', async function (next) {
    if (this.isModified('Password')) {
        this.Password = await bcryptjs.hash(this.Password, 10);
    }
    next();
});



const donatorModel = mongoose.model('donatorModel', donatorSchema);
module.exports = donatorModel; 