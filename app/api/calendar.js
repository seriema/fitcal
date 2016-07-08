var ical = require('ical-generator');
var q = require('q');
var Sleep = require('../models/fitbit/sleep');
var siteConfig = require('./../../config/site');
const TIMEZONE = 'Europe/Stockholm'; // TODO: This should be on the User model

function getSleep(user) {
    var sleepDeferred = q.defer();
    var query = {
        'fitbit.id': user.fitbit.id
    };
    Sleep.find(query, function (err, sleepData) {
        // if there is an error, stop everything and return that
        // i.e. an error connecting to the database
        if (err)
            return sleepDeferred.reject(err);

        // if the sleep data is not found, abort
        if (!sleepData)
            return sleepDeferred.reject("There doesn't seem to be any sleep data for you.");

        var events = [];
        sleepData.forEach(function (sleep) {
            var start = sleep.start();
            if (!start)
                return; // TODO: Remove this scenario using a better query? There might not be start time info for this night. Or any info actually.

            events.push({
                start: start.toDate(), // TODO: I'd like the convenience methods start/end to return the correct format, but end uses start internally so I need to have the toDate() call here for now.
                end: sleep.end().toDate(),
                summary: sleep.summary(),
                description: JSON.stringify(sleep)
            });
        });

        sleepDeferred.resolve(events);
    });

    return sleepDeferred.promise;
}

function exportSleep(user, res) {
    // - Setup iCal -
    var cal = ical({
        domain: siteConfig.domain,
        name: siteConfig.name,
        timezone: TIMEZONE,
        ttl: 60 * 60 * 24
    });

    getSleep(user)
        .then(function (events) {
            events.forEach(cal.createEvent.bind(cal));
            cal.serve(res); // Let ical-generator create the response
        })
        .catch(function (err) {
            res.render('error.ejs', err);
        });
}

module.exports = {
    generate: exportSleep
};