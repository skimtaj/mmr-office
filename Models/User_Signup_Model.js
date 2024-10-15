const mongoose = require('mongoose');
const JWT = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const userSchema = mongoose.Schema({

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

        tokens: {

            type: String
        }
    }],

    Upload: [{

        type: mongoose.Schema.Types.ObjectId,
        ref: 'Upload_Model'
    }],

    Job: [{

        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job_Registration_Model'
    }]
});

userSchema.methods.GenerateJWT = async function () {

    try {

        const tokens = JWT.sign({ _id: this._id.toString() }, '12345');
        this.Token = this.Token.concat({ tokens: tokens });
        await this.save();
        return tokens;

    }

    catch {
        console.log('This is JWT errpo')

    }
}

userSchema.pre('save', async function (next) {
    if (this.isModified('Password')) {
        this.Password = await bcryptjs.hash(this.Password, 10);
    }
    next();
});

const User_Signup_Model = mongoose.model('User_Signup_Model', userSchema);
module.exports = User_Signup_Model;