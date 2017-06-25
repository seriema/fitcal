import * as express from 'express';
var app = express();

import * as mongoose from "mongoose";
import * as passport from "passport";
import { flash } from "connect-flash";
var port = process.env.PORT || 8080;

import { morgan } from "morgan";
import { cookieParser } from "cookie-parser";
import { bodyParser } from "body-parser";
import { session } from "express-session";

import { database as configDB } from "./config/database";
import { passport as configPassport } from './config/passport';
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
