const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken')
const Admin_Signup_Schema = new mongoose.Schema({

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

    Registration: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'New_Registration_Model'
    }],

    Token: [{

        tokens: {

            type: String
        }

    }]


})

Admin_Signup_Schema.methods.GenerateJWT = async function () {

    try {

        const tokens = jwt.sign({ _id: this._id.toString() }, '12345');
        this.Token = await this.Token.concat({ tokens });
        await this.save();
        return tokens;

    }
    catch {

        console.log('JWT error')
    }
}




Admin_Signup_Schema.pre('save', async function (next) {
    if (this.isModified('Password')) {
        this.Password = await bcryptjs.hash(this.Password, 10);
    }
    next();
});


const Admin_Signup_Model = mongoose.model('Admin_Signup_Model', Admin_Signup_Schema);
module.exports = Admin_Signup_Model



