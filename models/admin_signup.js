
require('dotenv').config();
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const JWT = require('jsonwebtoken');
require('dotenv').config();

const adminSchema = mongoose.Schema({

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

    Token: [{

        token: {

            type: String
        }
    }],

    certificate: [{

        type: mongoose.Schema.Types.ObjectId,
        ref: 'mmr_certificate'
    }]


});


adminSchema.pre('save', async function (next) {
    if (this.isModified('Password')) {
        this.Password = await bcryptjs.hash(this.Password, 10);
    }
    next();
});


adminSchema.methods.GenerateJWT = async function () {

    try {
        const token = JWT.sign({ _id: this._id.toString() }, process.env.Token_Password, { expiresIn: '365d' });
        this.Token = this.Token.concat({ token: token });
        await this.save();
        return token;
    }

    catch (error) {

        console.log('This is Token genarate error', error);

    }
}


const admin_signup = mongoose.model('admin_signup', adminSchema);

module.exports = admin_signup;

