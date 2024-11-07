const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const JWT = require('jsonwebtoken');
const doctorSchema = mongoose.Schema({

    Doctor_Name: {

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

    DOB: {

        type: String
    },

    Department: {

        type: String
    },

    Profile_Image: {

        type: String
    },

    Gender: {

        type: String
    },

    Address: {

        type: String
    },

    Appoinment: [{

        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appoinment_Model'
    }],

    Token: [{

        token: {

            type: String
        }
    }],

    Patient: [{

        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient_Model'
    }]

});

doctorSchema.methods.generateJDW = async function () {
    try {

        const token = JWT.sign({ _id: this._id }, '12345', { expiresIn: '365d' });
        this.Token = this.Token.concat({ token: token });
        await this.save();
        return token;

    }

    catch (error) {

        console.log('This is Doctor JWT generate error', error)
    }

};

doctorSchema.pre('save', async function (next) {
    if (this.isModified('Password')) {
        this.Password = await bcryptjs.hash(this.Password, 10);
    }
    next();
});

const Doctor_Model = mongoose.model('Doctor_Model', doctorSchema);
module.exports = Doctor_Model; 