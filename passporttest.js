var bodyParser   = require('body-parser'),
    cookieParser = require('cookie-parser'),
    express      = require('express'),
    session      = require('express-session'),
    passport     = require('passport');

var app = express();

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
  secret: 'secrit cat',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
