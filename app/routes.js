//var http = require('http');
var q = require('q');
var Sleep = require('../app/models/fitbit/sleep');

module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        res.render('index.ejs'); // load the index.ejs file
    });


    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

  // locally --------------------------------

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));


    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

  // facebook -------------------------------

    // =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    app.get('/auth/facebook', passport.authenticate('facebook', {  scope : ['email'] }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect : '/profile',
            failureRedirect : '/'
        }),

        // Only added the error handling because of: https://github.com/jaredhanson/passport-facebook/issues/93
        // on succes
        function(req,res) {
            res.status(200);
            res.route('/profile');
        },

        // on error; likely to be something FacebookTokenError token invalid or already used token,
        // these errors occur when the user logs in twice with the same token
        function(err,req,res,next) {
            // You could put your own behavior in here, fx: you could force auth again...
            // res.redirect('/auth/facebook/');
            if(err) {
                res.status(400);
                res.render('error', {message: err.message});
            }
        }
    );

  // fitbit -------------------------------

    // =====================================
    // FITBIT ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    app.get('/auth/fitbit', passport.authenticate('fitbit', {  scope : ['activity', 'heartrate', 'profile', 'sleep', 'weight'] }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/fitbit/callback',
        passport.authenticate('fitbit', {
            successRedirect : '/profile',
            failureRedirect : '/'
        })
    );

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

  // locally --------------------------------
    app.get('/connect/local', function(req, res) {
        res.render('connect-local.ejs', { message: req.flash('loginMessage') });
    });
    app.post('/connect/local', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

  // facebook -------------------------------
    // send to facebook to do the authentication
    app.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));

    // handle the callback after facebook has authorized the user
    app.get('/connect/facebook/callback',
        passport.authorize('facebook', {
            successRedirect : '/profile',
            failureRedirect : '/'
        })
    );

  // fitbit -------------------------------
    // send to fitbit to do the authentication
    app.get('/connect/fitbit', passport.authorize('fitbit', {  scope : ['activity', 'heartrate', 'profile', 'sleep', 'weight'] }));

    // handle the callback after fitbit has authorized the user
    app.get('/connect/fitbit/callback',
        passport.authorize('fitbit', {
            successRedirect : '/profile',
            failureRedirect : '/'
        })
    );


// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

  // local -----------------------------------
    app.get('/unlink/local', function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

  // facebook -------------------------------
    app.get('/unlink/facebook', function(req, res) {
        var user            = req.user;
        user.facebook.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

  // fitbit -------------------------------
    app.get('/unlink/fitbit', function(req, res) {
        var user            = req.user;
        user.fitbit.token   = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });



/// TEST ZONE
    /*
    function fitbit_get(path, accessToken, userId, callback) {
        var fixedPath = '/1/user/' + (userId || '-') + path;
        options = {
            host: "https://api.fitbit.com",
            path: fixedPath,
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + accessToken
            },
            json: true
        };

        var req = http.request(options, function (res) {
            console.log('STATUS: ${res.statusCode}');
            console.log('HEADERS: ${JSON.stringify(res.headers)}');
            res.setEncoding('utf8');
            var body = '';
            // Continuously update stream with data
            res.on('data', function (chunk) {
                body += d;
                console.log('BODY:', chunk);
            });
            res.on('end', function ()  {
                console.log('No more data in response.');
                callback(JSON.parse(body));
            });
        });

        req.on('error', function (e) {
            console.log('problem with request:', e.message);
        });
    }
    */

    var fitbitApi = require('./../fitbit');
/// Mongoose test
    app.get("/mongoose/test", function (req, res) {
        var user  = req.user;
        if (!user || !user.fitbit) {
            return res.redirect('/error');
        }

        var resources = Object.freeze({
            sleep: [
                'startTime',
                'timeInBed',
                'minutesAsleep',
                'awakeningsCount',
                'minutesAwake',
                'minutesToFallAsleep',
                'minutesAfterWakeup',
                'efficiency'
            ]
        });

        var timeSpan = {
            baseDate: 'today',
            period: '7d'
        };

        function updateCategory(categoryData) {
            function updateCategoryDate(category, dateData) {
                var categoryDeferred = q.defer();
                var query = {
                    'fitbit.id': user.fitbit.id,
                    dateTime: dateData.dateTime
                };
                /* UPDATE version, doesn't seem to work. It overwrites.
                 var queryOptions = {
                 upsert: true // create if it doesn't exist
                 };

                 var docUpdate = { raw: {} };
                 docUpdate.raw[categoryData.category] = data.value;

                 Sleep.update(query, docUpdate, queryOptions, function (err) {
                 if (err)
                 return categoryDeferred.reject(err);

                 categoryDeferred.resolve();
                 });
                 */

                Sleep.findOne(query, function (err, sleep) {

                    // if there is an error, stop everything and return that
                    // i.e. an error connecting to the database
                    if (err)
                        return deferred.reject(err);

                    // if the sleep data is not found, create one
                    if (!sleep) {
                        sleep = new Sleep();
                        sleep.fitbit.id = user.fitbit.id;
                        sleep.dateTime = dateData.dateTime;
                    }

                    // add the data we went through all this trouble to get
                    sleep.raw[category] = dateData.value;

                    // save the sleep data to the database
                    sleep.save(function (err) {
                        if (err)
                            return categoryDeferred.reject(err);

                        categoryDeferred.resolve();
                    });
                });

                return categoryDeferred.promise;
            }

            var categoryPromises = categoryData.data.map(updateCategoryDate.bind(null, categoryData.category));
            return q.all(categoryPromises);
        }

        var fitbitPromises = resources.sleep.map(function (category) {
            var path = `/sleep/${category}/date/${timeSpan.baseDate}/${timeSpan.period}.json`;
            return fitbitApi.client.get(path, user.fitbit.token).then(function (result) {
                var data = result[0];
                if (data.success === false) {
                    let error = data.errors[0];
                    if (error.errorType === 'expired_token') {
                        throw error; // TODO: Renew the token or something.
                    } else {
                        throw error; // What other errors can I get?
                    }
                }

                return {
                    category: category,
                    data: data[`sleep-${category}`]
                };
            });
        });
        q.all(fitbitPromises)
            .then(function (categoryResults) {
//                return q.all(categoryResults.map(updateCategory));
                // We do this in a sequence to avoid race conditions when updating the database,
                // where it could result in multiple mongoose documents.
                var funcs = categoryResults.map(function (categoryResult) {
                    return updateCategory.bind(null, categoryResult);
                });
                var result = q(0);
                funcs.forEach(function (f) {
                    result = result.then(f);
                });
                return result;
            })
            .then(function () {
                res.send(`Import complete of ${resources.sleep.length} sleep categories from ${timeSpan.baseDate} and going back ${timeSpan.period}.`);
            })
            .fail(function (error) {
                res.render('error.ejs', {error});
            });
    });

/// Precalculated
    app.get("/calendar/activity", function (req, res) {
        if (!req.user || !req.user.fitbit) {
            return res.redirect('/error');
        }
        fitbitApi.activity(req.user.fitbit.token, res.send.bind(res));
    });
    app.get("/calendar/sleep", function (req, res) {
        if (!req.user || !req.user.fitbit) {
            return res.redirect('/error');
        }
        fitbitApi.sleep(req.user.fitbit.token, res.send.bind(res));
    });
    app.get("/calendar/heart", function (req, res) {
        if (!req.user || !req.user.fitbit) {
            return res.redirect('/error');
        }
        fitbitApi.heart(req.user.fitbit.token, res.send.bind(res));
    });

    // Fitbit API
/// Activity
    app.get("/activities/list", function (req, res) {
        const today = moment().tz(TIMEZONE).format('YYYY-MM-DD');
        const limit = 20; // Max allowed
        var token = req.user.fitbit.token;
        fitbitApi.client.get(`/activities/list.json?beforeDate=${today}&sort=desc&limit=${limit}&offset=0`, token).then(function (results) { res.send(results[0]); });
    });
/// Sleep
    app.get("/sleep/startTime", function (req, res) {
        var token = req.user.fitbit.token;
        fitbitApi.client.get("/sleep/startTime/date/today/7d.json", token).then(function (results) { res.send(results[0]); });
    });
    app.get("/sleep/timeInBed", function (req, res) {
        var token = req.user.fitbit.token;
        fitbitApi.client.get("/sleep/timeInBed/date/today/max.json", token).then(function (results) { res.send(results[0]); });
    });
    app.get("/sleep/minutesAsleep", function (req, res) {
        var token = req.user.fitbit.token;
        fitbitApi.client.get("/sleep/minutesAsleep/date/today/max.json", token).then(function (results) { res.send(results[0]); });
    });
    app.get("/sleep/timeInBed", function (req, res) {
        var token = req.user.fitbit.token;
        fitbitApi.client.get("/sleep/timeInBed/date/today/max.json", token).then(function (results) { res.send(results[0]); });
    });
    app.get("/sleep/awakeningsCount", function (req, res) {
        var token = req.user.fitbit.token;
        fitbitApi.client.get("/sleep/awakeningsCount/date/today/max.json", token).then(function (results) { res.send(results[0]); });
    });
    app.get("/sleep/minutesAwake", function (req, res) {
        var token = req.user.fitbit.token;
        fitbitApi.client.get("/sleep/minutesAwake/date/today/max.json", token).then(function (results) { res.send(results[0]); });
    });
    app.get("/sleep/minutesToFallAsleep", function (req, res) {
        var token = req.user.fitbit.token;
        fitbitApi.client.get("/sleep/minutesToFallAsleep/date/today/max.json", token).then(function (results) { res.send(results[0]); });
    });
    app.get("/sleep/minutesAfterWakeup", function (req, res) {
        var token = req.user.fitbit.token;
        fitbitApi.client.get("/sleep/minutesAfterWakeup/date/today/max.json", token).then(function (results) { res.send(results[0]); });
    });
    app.get("/sleep/efficiency", function (req, res) {
        var token = req.user.fitbit.token;
        fitbitApi.client.get("/sleep/efficiency/date/today/max.json", token).then(function (results) { res.send(results[0]); });
    });
/// Activitites
/// Heart rate
    app.get("/activities/heart", function (req, res) {
        var token = req.user.fitbit.token;
        fitbitApi.client.get("/activities/heart/date/today/1m.json", token).then(function (results) { res.send(results[0]); });
    });
/*
    app.get('/fitbit/datadump', function (req, res) {
        if (!req.user || !req.user.fitbit) {
            return res.redirect('/error');
        }
        var user = req.user.fitbit;

        const today = moment().tz(TIMEZONE).format('YYYY-MM-DD');
        const limit = 20; // Max allowed
        //var path = `/activities/list.json?beforeDate=${today}&sort=desc&limit=${limit}&offset=0`;
        var path = '/activities/list.json?beforeDate='+today+'&sort=desc&limit='+limit+'&offset=0';
        client.get(path, user.token).then(function (results) {
            console.log(results);
            res.redirect('/yay');
        });
    })
*/
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
