
const express = require('express')
const app = express();
const db = require('./Database/blogdb')
const BlogModel = require('./Database/Models/BlogModel');
const path = require('path');
const bodyParser = require('body-parser');

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'Public')));
app.use(bodyParser.json()); 
app.set('view engine', 'ejs');


app.get('/blog', function (req, res) {
  res.render('BlogForm')
})

app.post('/blog', async function (req, res) {

    try{

     const data =req.body;
     const newModel= new BlogModel(data);
     await newModel.save()
     res.status(200).send(newModel);

    }
    catch (error){
   res.status(500).send(error)

    }

  })


  
  app.get('/blog/:class', async function (req, res) {
   
    try{
 
      const data = req.params.class;
      if(data=='Personal Development' || data=='Health and Fitness' ||  data=='Tech and Gadgets' ||data=='Education'  ){

          const response = await BlogModel.find({Category:data})
          res.status(200).send(response);

      }
      else {
        res.send(" Record Not Founded");


      }

    
    }
     catch (error){
      res.status(500).send(error)


     }


  })
  


app.listen(5000)
