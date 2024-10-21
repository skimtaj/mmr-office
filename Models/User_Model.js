const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const JWT = require('jsonwebtoken');
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

    Token: [{

        tokens: {
            type: String
        }
    }],

    Dawat: [{

        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dawat_Model'
    }]

});

userSchema.methods.GenerateJWT = async function () {

    try {

        const tokens = JWT.sign({ _id: this._id }, '12345', { expiresIn: '1h' });
        this.Token = this.Token.concat({ tokens: tokens });
        await this.save();
        return tokens;
    }

    catch {
        console.log('This is JWT error')
    }
}


userSchema.pre('save', async function (next) {
    if (this.isModified('Password')) {
        this.Password = await bcryptjs.hash(this.Password, 10);
    }
    next();
});

const User_Model = mongoose.model('User_Model', userSchema);
module.exports = User_Model; 