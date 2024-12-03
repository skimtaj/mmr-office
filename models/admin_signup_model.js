const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const JWT = require('jsonwebtoken')
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

    Notice: [{

        type: mongoose.Schema.Types.ObjectId,
        ref: 'notice_model'
    }]
});


adminSchema.methods.GenerateJWT = async function () {

    try {

        const token = JWT.sign({ _id: this._id.toString() }, '12345', { expiresIn: '365d' });
        this.Token = this.Token.concat({ token: token });
        await this.save();
        return token;
    }

    catch (error) {

        console.log('This is Token generate error', error)
    }

}

adminSchema.pre('save', async function (next) {
    if (this.isModified('Password')) {
        this.Password = await bcryptjs.hash(this.Password, 10);
    }
    next();
});

const admin_signup_model = mongoose.model('admin_signup_model', adminSchema);
module.exports = admin_signup_model; 