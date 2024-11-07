const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const adsminSchema = mongoose.Schema({

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

    Doctor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor_Model'
    }],


});``

adsminSchema.methods.generateJWT = async function () {

    try {

        const tokens = jwt.sign({ _id: this._id.toString() }, '12345', { expiresIn: '365d' });
        this.Token = this.Token.concat({ tokens });
        await this.save();
        return tokens;
    }

    catch (error) {
        console.log(' This is jwt generating error', error)

    }
}

adsminSchema.pre('save', async function (next) {
    if (this.isModified('Password')) {
        this.Password = await bcryptjs.hash(this.Password, 10);
    }
    next();
});


const Admin_Model = mongoose.model('Admin_Model', adsminSchema);
module.exports = Admin_Model

