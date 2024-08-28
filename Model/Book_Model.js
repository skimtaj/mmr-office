const mongoose = require('mongoose');
const bcryptjs= require('bcryptjs')
const Book_Schema =  new mongoose.Schema({

Name : {

    type: String 
},


Mobile : {

    type: String 
},

Email : {

    type: String 
},

Username : {

    type: String 
},

Password : {

    type : String 

}

});



Book_Schema.pre('save', async function(next) {
    if (this.isModified('Password')) {
        this.Password = await bcryptjs.hash(this.Password, 10);
    }
    next();

});

const Book_Model = mongoose.model('Book_Model', Book_Schema);
module.exports = Book_Model;