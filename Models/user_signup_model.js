const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const JWT = require('jsonwebtoken');

const userSignupschema = mongoose.Schema({

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

    Note: [{

        type: mongoose.Schema.Types.ObjectId,
        ref: 'note_model'
    }]
});



userSignupschema.methods.GenerateJWT = async function () {

    try {


        const token = JWT.sign({ _id: this._id.toString() }, '12345', { expiresIn: '365d' });
        this.Token = this.Token.concat({ token: token });
        await this.save();
        return token;
    }

    catch (error) {

        console.log(' This is token generate error', error)
    }
}

userSignupschema.pre('save', async function (next) {
    if (this.isModified('Password')) {
        this.Password = await bcryptjs.hash(this.Password, 10);
    }
    next();
});


const user_signup_model = mongoose.model('user_signup_model', userSignupschema);

module.exports = user_signup_model;