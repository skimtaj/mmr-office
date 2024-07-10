const mongoose = require('mongoose');
const RegiSchema = new mongoose.Schema({

Name : {

    type : String, 
    required : true
}, 

Email : {

    type : String, 
    unique : true
},

Mobile: {

    type : String, 
    unique : true
}

})

const Regi = mongoose.model('Regi',RegiSchema);
module.exports =Regi ;

