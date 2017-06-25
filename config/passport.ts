/* eslint max-params: ["off"] */

import { Strategy as FacebookStrategy } from 'passport-facebook';
//import { FitbitOAuth2Strategy as FitbitStrategy } from 'passport-fitbit-oauth2';
let FitbitStrategy = require('passport-fitbit-oauth2'); // No TS typings yet

// load up the user model
import { User } from '../app/models/user';

// load the auth variables
import { auth as configAuth } from './auth';

export function passport(passport) {
	// =========================================================================
	// passport session setup ==================================================
	// =========================================================================
	// required for persistent login sessions
	// passport needs ability to serialize and unserialize users out of session

	// used to serialize the user for the session
	passport.serializeUser(function (user, done) {
		done(null, user.id);
	});

	// used to deserialize the user
	passport.deserializeUser(function (id, done) {
		User.findById(id, function (err, user) {
			done(err, user);
		});
	});

	// =========================================================================
	// FACEBOOK ================================================================
	// =========================================================================
	passport.use(new FacebookStrategy({

		// pull in our app id and secret from our auth.js file
		clientID: configAuth.facebookAuth.clientID,
		clientSecret: configAuth.facebookAuth.clientSecret,
		callbackURL: configAuth.facebookAuth.callbackURL,
		profileFields: ['id', 'displayName', 'email'],
		passReqToCallback: true // allows us to pass in the req from our route (let's us check if a user is logged in or not)
	},

	// facebook will send back the token and profile
	function (req, token, refreshToken, profile, done) {
		// asynchronous
		process.nextTick(function () {
			// check if the user is already logged in
			if (req.user) {
				// user already exists and is logged in, we have to link accounts
				var user = req.user; // pull the user out of the session

				// update the current users facebook credentials
				user.facebook.id = profile.id;
				user.facebook.token = token;
				user.facebook.name = profile.displayName;
				user.facebook.email = profile.emails ? profile.emails[0].value : null;

				// save the user
				user.save(function (err) {
					if (err) {
						throw err;
					}

					return done(null, user);
				});
			} else {
				// find the user in the database based on their facebook id
				User.findOne({'facebook.id': profile.id}, function (err, user) {
					// if there is an error, stop everything and return that
					// ie an error connecting to the database
					if (err) {
						return done(err);
					}

					// if the user is found, then log them in
					if (user) {
						return done(null, user); // user found, return that user
					}
					// if there is no user found with that facebook id, create them
					var newUser = new User();

					// set all of the facebook information in our user model
					newUser.facebook.id = profile.id; // set the users facebook id
					newUser.facebook.token = token; // we will save the token that facebook provides to the user
					newUser.facebook.name = profile.displayName; // look at the passport user profile to see how names are returned
					newUser.facebook.email = profile.emails ? profile.emails[0].value : null; // facebook can return multiple emails so we'll take the first

					// save our user to the database
					newUser.save(function (err) {
						if (err) {
							throw err;
						}

						// if successful, return the new user
						return done(null, newUser);
					});
				});
			}
		});
	}));

	// =========================================================================
	// FITBIT STRATEGY =========================================================
	// =========================================================================

	passport.use(new FitbitStrategy.FitbitOAuth2Strategy({
		clientID: configAuth.fitbitAuth.clientID,
		clientSecret: configAuth.fitbitAuth.clientSecret,
		callbackURL: configAuth.fitbitAuth.callbackURL,
		passReqToCallback: true // allows us to pass in the req from our route (let's us check if a user is logged in or not)
	},
		function (req, token, refreshToken, profile, done) {
			// asynchronous
			process.nextTick(function () {
				// check if the user is already logged in
				if (req.user) {
					// user already exists and is logged in, we have to link accounts
					var user = req.user; // pull the user out of the session

					// update the current users fitbit credentials
					user.fitbit.id = profile.id; // set the users fitbit id
					user.fitbit.token = token; // we will save the token that fitbit provides to the user
					user.fitbit.name = profile.displayName; // look at the passport user profile to see how names are returned

					// save the user
					user.save(function (err) {
						if (err) {
							throw err;
						}

						return done(null, user);
					});
				} else {
					// find the user in the database based on their fitbit id
					User.findOne({'fitbit.id': profile.id}, function (err, user) {
						// if there is an error, stop everything and return that
						// ie an error connecting to the database
						if (err) {
							return done(err);
						}

						// if the user is found, then log them in
						if (user) {
							return done(null, user); // user found, return that user
						}

						// if there is no user found with that fitbit id, create them
						var newUser = new User();

						// set all of the fitbit information in our user model
						newUser.fitbit.id = profile.id; // set the users fitbit id
						newUser.fitbit.token = token; // we will save the token that fitbit provides to the user
						newUser.fitbit.name = profile.displayName; // look at the passport user profile to see how names are returned

						// save our user to the database
						newUser.save(function (err) {
							if (err) {
								throw err;
							}

							// if successful, return the new user
							return done(null, newUser);
						});
					});
				}
			});
		})
	);
};
