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

//validation checker
const {check, validationResult} = require('express-validator');