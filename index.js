// //get dependencies
const express = require('express');
const path = require('path');
let getApp = express();

//set directories
getApp.set('views', path.join(__dirname,'views'));
getApp.use(express.static(__dirname + '/public'));
getApp.set('view engine', 'ejs');

//use body parser
getApp.use(express.urlencoded({extended:true}));

// Set Different Routes
getApp.get('/',function(req,res) {
    res.render('home'); 
});

getApp.get('/login',function(req,res) {
    res.render('login'); 
});

getApp.get('/addPosts',function(req,res) {
    res.render('addposts'); 
});

// Setup Database Connection
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/blog', {
    UseNewUrlParser : true,
    UseUnifiedTopology : true
});

// Setup Database Model
const Post = mongoose.model('post', {

});

//validation checker
const {check, validationResult} = require('express-validator');

//routes 
getApp.post('/', [
    check('name', 'Name is required!').notEmpty(),
    check('email', 'Please enter valid email address!').isEmail(),
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

getApp.listen(8080);