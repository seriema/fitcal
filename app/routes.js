export function routes(app, passport) {
	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', function (req, res) {
		res.render('index.ejs'); // load the index.ejs file
	});

	// =====================================
	// PROFILE SECTION =====================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile', isLoggedIn, function (req, res) {
		res.render('profile.ejs', {
			user: req.user // get the user out of session and pass to template
		});
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function (req, res) {
		req.logout();
		res.redirect('/');
	});

	// =====================================
	// DATA IMPORT SECTION =================
	// =====================================
	app.get('/import/fitbit', function (req, res) {
		// TODO
	});

	// =====================================
	// CALENDAR EXPORT SECTION =============
	// =====================================
	app.get('/calendar/:userId', function (req, res) {
		// TODO
	});

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

  // facebook -------------------------------

	// =====================================
	// FACEBOOK ROUTES =====================
	// =====================================
	// route for facebook authentication and login
	app.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email']}));

	// handle the callback after facebook has authenticated the user
	app.get('/auth/facebook/callback',
		passport.authenticate('facebook', {
			successRedirect: '/profile',
			failureRedirect: '/'
		}),

		// Only added the error handling because of: https://github.com/jaredhanson/passport-facebook/issues/93
		// on succes
		function (req, res) {
			res.status(200);
			res.route('/profile');
		},

		// on error; likely to be something FacebookTokenError token invalid or already used token,
		// these errors occur when the user logs in twice with the same token
		function (err, req, res) {
			// You could put your own behavior in here, fx: you could force auth again...
			// res.redirect('/auth/facebook/');
			if (err) {
				res.status(400);
				res.render('error.ejs', err);
			}
		}
	);

  // fitbit -------------------------------

	// =====================================
	// FITBIT ROUTES =====================
	// =====================================
	// route for facebook authentication and login
	app.get('/auth/fitbit', passport.authenticate('fitbit', {scope: ['activity', 'heartrate', 'profile', 'sleep', 'weight']}));

	// handle the callback after facebook has authenticated the user
	app.get('/auth/fitbit/callback',
		passport.authenticate('fitbit', {
			successRedirect: '/profile',
			failureRedirect: '/'
		})
	);

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

  // facebook -------------------------------
	// send to facebook to do the authentication
	app.get('/connect/facebook', passport.authorize('facebook', {scope: 'email'}));

	// handle the callback after facebook has authorized the user
	app.get('/connect/facebook/callback',
		passport.authorize('facebook', {
			successRedirect: '/profile',
			failureRedirect: '/'
		})
	);

  // fitbit -------------------------------
	// send to fitbit to do the authentication
	app.get('/connect/fitbit', passport.authorize('fitbit', {scope: ['activity', 'heartrate', 'profile', 'sleep', 'weight']}));

	// handle the callback after fitbit has authorized the user
	app.get('/connect/fitbit/callback',
		passport.authorize('fitbit', {
			successRedirect: '/profile',
			failureRedirect: '/'
		})
	);

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// user account will stay active in case they want to reconnect in the future

  // facebook -------------------------------
	app.get('/unlink/facebook', function (req, res) {
		var user = req.user;
		user.facebook.token = undefined;
		user.save(function (err) {
			if (err) {
				res.status(400);
				res.render('error.ejs', err);
			} else {
				res.redirect('/profile');
			}
		});
	});

  // fitbit -------------------------------
	app.get('/unlink/fitbit', function (req, res) {
		var user = req.user;
		user.fitbit.token = undefined;
		user.save(function (err) {
			if (err) {
				res.status(400);
				res.render('error.ejs', err);
			} else {
				res.redirect('/profile');
			}
		});
	});
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated()) {
		return next();
	}

	// if they aren't redirect them to the home page
	res.redirect('/');
}
