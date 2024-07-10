const mongoose = require('mongoose');
const mongourl='mongodb://localhost:27017/Registration'; 
mongoose.connect(mongourl);

const db = mongoose.connection; 

db.on('connnected', ()=>{

console.log('Connected to MongoDB server');

})

db.on('error', ()=>{

    console.error('MongoDB connection error', error);
    
})

db.on('disconnected', ()=>{

    console.log('MongoDB disconnected '); 
    
})

module.exports= db; 