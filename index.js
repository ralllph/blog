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

const Navigations = mongoose.model('Navigations', {
    pageTitle : String,
    pageId:String
});

getApp.use(session({
    secret: "this ismyrandomsupersecretcode",
    resave:false,
    saveUninitialized:true  //session active till logout
}));

//validation checker
const {check, validationResult} = require('express-validator');

//Navigation bar object for all routes
let globalNavs = [];

// Set Different Routes
getApp.get('/',function(req,res) {
    Navigations.find({}).then((navs) => {
        globalNavs= navs;
        res.render('home', {navs:navs});
        console.log(`Navs Output: ${navs}`);
    }). catch((err) => {
        console.log(`Db Error: ${err}`);
    })
});

getApp.get('/login',function(req,res) {
    res.render('login', {navs:globalNavs}); 
});

getApp.get('/viewPage/:id',function(req,res) {
   
    if(req.session.userLoggedIn){
        let id = req.params.id;
        //get data based on id
        Post.findById({_id : id}).then((page) => {
            if(page){
                console.log("Global here",globalNavs);
                res.render('viewpage', {page : page ,navs:globalNavs });
            }else{
                res.send('No Page Found With This Id!');
            }
        }).catch((err) => {
            console.log(`Error tracing data for that Id: ${err}`);
        })
    }else{
        res.redirect('login');
    }
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
            res.render('success', { message: {
                messageTitle: "Admin Login Successful",
                isSuccess: true
            }, navs:globalNavs} );
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
    res.render('success', { message: {
        messageTitle: "Logout Successful",
        isSuccess: true
    }} );
});

getApp.get('/edit/:id',function(req,res) {
    //check session exist
    if(req.session.userLoggedIn){
        let id = req.params.id;
        //get data based on id
        Post.findById({_id : id}).then((page) => {
            if(page){
                res.render('editpage', {page : page,navs:globalNavs});
            }else{
                res.send('No Order Found With This Id!');
            }
        }).catch((err) => {
            console.log(`Error tracing data for that Id: ${err}`);
        })
    }else{
        res.redirect('login');
    }
});

getApp.post('/edit/:id', [
    check('pagetitle', 'Page title is required!').notEmpty(),
    check('desc', 'Description is required!').notEmpty()
], function(req,res){
    const errors = validationResult(req);
    console.log(errors);

    let id = req.params.id;

    if(!errors.isEmpty()) {

        Post.findById({_id : id}).then((page) => {
            if(page){
                res.render('editpage', {page : page, errors : errors.array(),navs:globalNavs});
            }else{
                res.send('No Order Found With This Id!');
            }
        }).catch((err) => {
            console.log(`Error tracing data for that Id: ${err}`);
        })
    }
    else {
        let pageTitle = req.body.pagetitle;
        let desc = req.body.desc;
        let postData = {
            pageTitle: pageTitle,
            desc: desc
        };
    
        if (req.files && req.files.fileImage) {
            let image = req.files.fileImage;
            let imageName = image.name;
            let imagePath = 'public/images/' + imageName;
    
            image.mv(imagePath, (err) => {
                if (err) {
                    console.log(`Error: ${err}`);
                    res.send(err);
                } else {
                    postData.imageName = imageName;
                    postData.imageType = image.mimetype;
                    postData.imageSize = image.size;
    
                    updatePage(postData);
                }
            });
        } else {
            updatePage(postData);
        }
    }
    
    function updatePage(postData) {
        //update Post by id
        Post.findById({_id: id}).then((page) => {
            page.pageTitle = postData.pageTitle;
            page.desc = postData.desc;
            if (postData.imageName) {
                page.imageName = postData.imageName;
                page.imageType = postData.imageType;
                page.imageSize = postData.imageSize;
            }
            page.save().then(function () {
                console.log("Page Updated Successfully!");

             //update nav 
            Navigations.findOne({pageId: id}).then((nav) => {
                nav.pageTitle = postData.pageTitle;
                nav.save().then(function () {
                    globalNavs= nav;
                    console.log("Nav Updated Successfully!");
                }).catch(function (ex) {
                    console.log(`Database Error, Nav not updated: ${ex.toString()}`);
                });
            });
            
            }).catch(function (ex) {
                console.log(`Database Error: ${ex.toString()}`);
                res.render('success', {message : {
                    messageTitle: "FFailed",
                    isSuccess: false,
                    messageTitle: "Post Edit Failed,, Try again later" 
                }});
            });
    
            res.render('success', {message : {
                 messageTitle: "Success",
                isSuccess: true,
                isEdit:true,
                messageTitle: "Post Edited Successfully, View your changes",
                isLinkEdit: `viewPage/${id}`
            }});
            
        });

    }
    
});

getApp.get('/delete/:id', (req, res) => {

    if(req.session.userLoggedIn) {
        // Read Object Id of Database Document
        let id = req.params.id;
        //delete post
        Post.findByIdAndDelete({_id : id}).then((page) => {
            console.log(`page : ${page}`);
            if(page) {
                res.render('success', {message : {
                    messageTitle: "Success",
                   isSuccess: true,
                   messageTitle: "Page Deleted Successfully",
               }});
            }
            else {
                res.render('success', {message : {
                    messageTitle: "Failed",
                    isSuccess: false,
                    messageTitle: "Post Delete Failed,, Try again later" 
                }});
            }
        }).catch((err) => {
            console.log(`Error : ${err}`);
        });

        //delete from navigation
        Navigations.findOneAndDelete({pageId : id}).then((nav) => {
            console.log(`nav deleted : ${nav}`);
        }).catch((err) => {
            console.log(`Error : ${err}`);
        });
    }
    else {
        // Otherwise Redirect User to Login Page
        res.redirect('/login');
    }
});

getApp.get('/success',function(req,res) {
    res.render('success'); 
});

//view pages
getApp.get('/viewPages', (req,res) => {
    if(req.session.userLoggedIn){
        Post.find({}).then((pages) => {
            res.render('viewpages', {pages,navs:globalNavs})
            console.log(`pages Output: ${pages}`);
        }). catch((err) => {
            console.log(`Db Error: ${err}`);
        })
    }else{
        res.redirect('login');
    }   
});


getApp.get('/addPosts',function(req,res) {
    if(req.session.userLoggedIn){
        res.render('addposts',{navs:globalNavs}); 
    }else {
        res.redirect('/login');
    }
});


getApp.post('/addPosts', [
    check('pagetitle', 'Page title is required!').notEmpty(),
    check('desc', 'Description is required!').notEmpty()
], function(req,res){
    const errors = validationResult(req);
    console.log(errors);

    if(!errors.isEmpty()) {
       res.render('addPosts', {errors : errors.array(),navs:globalNavs})
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

                // Save Data Into Navigation and Posts  Database
                let newPost = new Post(postData);
                newPost.save().then(function(){
                    console.log("File Data Saved in Database!");
                });

                let navData={ 
                    pageTitle : pageTitle,
                    pageId: newPost.id
                };

                let newNav = new Navigations(navData);
                newNav.save().then(function(){
                    console.log("File Data Saved in Database!");
                });

    
                // Display Output
               
                res.render('success', {message : {
                    messageTitle: "Success",
                    isSuccess: true,
                    messageTitle: "Post Created Successfully",
               }});
            }
        });
    }   
});

getApp.listen(8080);