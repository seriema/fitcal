import * as express from 'express';
import * as mongoose from "mongoose";
import * as passport from "passport";
let flash = require("connect-flash"); // No TS typings yet

import * as morgan from "morgan";
import * as cookieParser from "cookie-parser";
import * as bodyParser from "body-parser";
import * as session from "express-session";

import { database as configDB } from "./config/database";
import { passport as configPassport } from './config/passport';

let app = express();
let port = process.env.PORT || 8080;

// configuration ===============================================================
configPassport(passport); // pass passport for configuration
mongoose.connect(configDB.url); // connect to our database

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({
	secret: process.env.LIFECAL_PASSPORT_SESSION_SECRET,
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
