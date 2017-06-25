/* eslint key-spacing: ["off"] */

var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var shortid = require('shortid');
var siteConfig = require('./../../config/site');

// define the schema for our user model
var userSchema = new mongoose.Schema({

	app: {
		userId       : { type: String, default: shortid.generate() }
	},
	facebook         : {
		id           : String,
		token        : String,
		email        : String,
		name         : String
	},
	fitbit           : {
		id           : String,
		token        : String,
		name         : String
	}

});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function (password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.calendarUrl = function () {
	return `${siteConfig.domain}/calendar/${this.app.userId}`;
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
