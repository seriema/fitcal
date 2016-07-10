import express = require('express');
var app = express();

import mongoose = require("mongoose");
import passport = require("passport");
import flash = require("connect-flash");
var port = process.env.PORT || 8080;

import morgan = require("morgan");
import cookieParser = require("cookie-parser");
import bodyParser = require("body-parser");
import session = require("express-session");

import configDB = require("./config/database");
import configPassport = require('./config/passport');
configPassport(passport); // pass passport for configuration


// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
    app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({
  secret: 'hellodoggydoggydoggy', // session secret
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);
