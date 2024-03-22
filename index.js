//get dependencies
const express = require('express');
const path = require('path');
let getApp = express();

//set directories
getApp.set('views', path.join(__dirname,'views'));
getApp.use(express.static(__dirname + '/public'));
getApp.set('view engine', 'ejs');

//use body parser
getApp.use(express.urlencoded({extended:true}));

// Setup Database Connection
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/blog', {
    UseNewUrlParser : true,
    UseUnifiedTopology : true
});

// Setup Database Model
const Post = mongoose.model('post', {

});


//routes 
myApp.post('/', [
    check('name', 'Name is required!').notEmpty(),
    check('email', 'Please enter valid email address!').isEmail(),
    check('phone','').custom(customPhoneValidation),
    check('lunch').custom(customLunchAndTicketValidation)
], function(req,res){
    const errors = validationResult(req);
    console.log(errors);

    if(!errors.isEmpty()) {
       
    }
    else 
    {
       
        // Display Output
        var pageData = {
  
        };

        // Save Form Data into Database
        let myPosts = new Post(pageData);
        myOrder.save().then(function(){
            console.log("New Post Created Successfully!");
        }).catch(function(ex){
            console.log(`Database Error: ${ex.toString()}`);
        });

        // Display Form Output
        res.render('', pageData); 
    }   
});

// Set Different Routes (Pages)
getApp.get('/',function(req,res) {
    res.render('');     // No need to add .ejs extension
});

//validation checker
const {check, validationResult} = require('express-validator');