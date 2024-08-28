const mongoose = require('mongoose');
const NewSchema = new mongoose.Schema({

    First_Name :{

     type: String

}, 

Last_Name :{

    type: String

}, 



Email : {
    type: String

},

Phone_Number : {
    type: String

}, 

DOB : {
    type: String

}, 

Category : {
    type: String

}, 

Username: {
    type: String

}, 

Password: {
    type: String

}, 



Image: {
    type: String

}, 


})

const DSM_Student_Registration = mongoose.model('DSM_Student_Registration', NewSchema );
module.exports = DSM_Student_Registration;
