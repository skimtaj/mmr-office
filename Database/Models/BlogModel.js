const mongoose = require('mongoose');
const blogSchema = new mongoose.Schema({

    Title:{

        type: String, 
        rquired : true

    },

    Description:{

        type: String, 
        rquired : true

    },

    Category:{

        type: String, 
        rquired : true

    },
})

const BlogModel = mongoose.model('BlogModel', blogSchema); 
module.exports = BlogModel; 