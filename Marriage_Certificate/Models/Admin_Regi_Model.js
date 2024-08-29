const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin_Regi_Schems = new mongoose.Schema({

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

    Tokens: [{

        token: {

            type: String
        }
    }],

    
    Regi_Data: [{

        type: mongoose.Schema.Types.ObjectId, 
        ref: 'New_Registration_Model'

    }]
});


Admin_Regi_Schems.methods.GenerateJWT = async function () {

    try {
``
        const token = jwt.sign({ _id: this._id.toString() }, 'Rifa12345');
        this.Tokens = this.Tokens.concat({ token: token });
        await this.save();
        return token;

    }

    catch {
        console.log('This is Interner JWT error ')

    }

}

Admin_Regi_Schems.pre('save', async function (next) {
    if (this.isModified('Password')) {
        this.Password = await bcryptjs.hash(this.Password, 10);
    }
    next();
});

const Admin_Regi_Model = mongoose.model('Admin_Regi_Model', Admin_Regi_Schems);
module.exports = Admin_Regi_Model; 