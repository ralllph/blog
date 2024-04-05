// //get dependencies
const express = require('express');
const path = require('path');
const upload = require('express-fileupload');
let getApp = express();
const session = require('express-session');

//set directories
getApp.set('views', path.join(__dirname,'views'));
getApp.use(express.static(__dirname + '/public'));
getApp.set('view engine', 'ejs');

//use dependencies
getApp.use(express.urlencoded({extended:true}));
getApp.use(upload());



// Setup Database Connection
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/blog', {
    UseNewUrlParser : true,
    UseUnifiedTopology : true
});

// Setup Database Model
const Post = mongoose.model('post', {
    name : String,
    pageTitle : String,
    desc : String,
    imageName : String,
    imageType : String,
    imageSize : Number
});

const Admin = mongoose.model('Admin', {
    username : String,
    password : String,
});

getApp.use(session({
    secret: "this ismyrandomsupersecretcode",
    resave:false,
    saveUninitialized:true  //session active till logout
}));

//validation checker
const {check, validationResult} = require('express-validator');


// Set Different Routes
getApp.get('/',function(req,res) {
    res.render('home'); 
});

getApp.get('/login',function(req,res) {
    res.render('login'); 
});

//login post method
getApp.post('/login', (req,res) =>{

    let user = req.body.username;
    let pass =  req.body.password;

    Admin.findOne({username: user, password:pass}).then((admin)=>{
        console.log(`Admin: ${admin}`);
        if(admin){
            //create session for user 
            req.session.username = admin.username;
            req.session.userLoggedIn = true;
            res.redirect('viewPages');
        }
        else{
            //incorrect login
            res.render('login', {error: "Sorry Login Failed"});
        }
    }).catch((err) => {

    })
})

//logout
getApp.get('/logout', (req,res)=>{
    req.session.username = '';
    req.session.userLoggedIn = false;
    res.render('success',{message: "Logout successful"} )
});

getApp.get('/edit',function(req,res) {
    //check session exist
    if(req.session.userLoggedIn){
        res.render('editpage'); 
    }else{
        res.redirect('login');
    }
});

getApp.get('/success',function(req,res) {
    res.render('success'); 
});

//view pages
getApp.get('/viewPages', (req,res) => {
    if(req.session.userLoggedIn){
        Post.find({}).then((pages) => {
            res.render('viewpages', {pages})
            console.log(`pages Output: ${pages}`);
        }). catch((err) => {
            console.log(`Db Error: ${err}`);
        })
    }else{
        res.redirect('login');
    }   
});


getApp.get('/addPosts',function(req,res) {
    res.render('addposts'); 
});


getApp.post('/addPosts', [
    check('pagetitle', 'Page title is required!').notEmpty(),
    check('desc', 'Description is required!').notEmpty()
], function(req,res){
    const errors = validationResult(req);
    console.log(errors);

    if(!errors.isEmpty()) {
       res.render('addPosts', {errors : errors.array()})
    }
    else 
    {
        let pageTitle = req.body.pagetitle;
        let desc = req.body.desc;
        let image = req.files.fileImage;
        let imageName = image.name;
        let imagePath = 'public/images/' + imageName;
        image.mv(imagePath, (err) => {
            if(err) {
                console.log(`Error: ${err}`);
                res.send(err);
            }
            else {
            
                let postData = {
                    pageTitle : pageTitle,
                    desc : desc,
                    imageName : imageName,
                    imageType : image.mimetype,
                    imageSize : image.size
                }
    
                // Save Data Into Database
                let newPost = new Post(postData);
                newPost.save().then(function(){
                    console.log("File Data Saved in Database!");
                });
    
                // Display Output
                res.send(postData);
                console.log(postData);
            }
        });
    }   
});

getApp.listen(8080);