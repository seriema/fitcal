var ical = require('ical-generator');
var q = require('q');
var Day = require('../models/fitbit/day');
var siteConfig = require('./../../config/site');
const TIMEZONE = 'Europe/Stockholm'; // TODO: This should be on the User model

function getSleep(user) {
	var sleepDeferred = q.defer();
	var query = {
		id: user.fitbit.id
	};
	Day.find(query, function (err, sleepData) {
		// if there is an error, stop everything and return that
		// i.e. an error connecting to the database
		if (err)
			return sleepDeferred.reject(err);

		// if the sleep data is not found, abort
		if (!sleepData)
			return sleepDeferred.reject("There doesn't seem to be any sleep data for you.");

		var events = [];
		sleepData.forEach(function (sleepDay) {
			var start = sleepDay.start();
			if (!start)
				return; // TODO: Remove this scenario using a better query? There might not be start time info for this night. Or any info actually.

			events.push({
				start: start.toDate(), // TODO: I'd like the convenience methods start/end to return the correct format, but end uses start internally so I need to have the toDate() call here for now.
				end: sleepDay.end().toDate(),
				summary: sleepDay.summary(),
				description: JSON.stringify(sleepDay)
			});
		});

		sleepDeferred.resolve(events);
	});

	return sleepDeferred.promise;
}

function getRestingHeartRate(user) {
	var hrDeferred = q.defer();
	var query = {
		id: user.fitbit.id
	};
	Day.find(query, function (err, hrData) {
		// if there is an error, stop everything and return that
		// i.e. an error connecting to the database
		if (err)
			return hrDeferred.reject(err);

		// if the sleep data is not found, abort
		if (!hrData)
			return hrDeferred.reject("There doesn't seem to be any sleep data for you.");

		var events = [];
		hrData.forEach(function (hrDay) {
			if (!hrDay.restingHeartRate)
				return; // TODO: Remove this scenario using a better query? There might not be start time info for this night. Or any info actually.

			events.push({
				start: hrDay.day.toDate(), // TODO: I'd like the convenience methods start/end to return the correct format, but end uses start internally so I need to have the toDate() call here for now.
				allDay: true,
				summary: `Resting heart rate ${hrDay.restingHeartRate} bpm`,
				description: JSON.stringify(hrDay)
			});
		});

		hrDeferred.resolve(events);
	});

	return hrDeferred.promise;
}

function exportAll(user, res) {
	// - Setup iCal -
	var cal = ical({
		domain: siteConfig.domain,
		name: siteConfig.name,
		timezone: TIMEZONE,
		ttl: 60 * 60 * 24
	});

	let calPromises = [];
	calPromises = calPromises.concat(getSleep(user));
	calPromises = calPromises.concat(getRestingHeartRate(user));

	q.all(calPromises)
		.then(results => {
			return results.reduce((a, b) => {
				return a.concat(b);
			}, []);
		})
		.then(function (events) {
			events.forEach(event => cal.createEvent(event));
			cal.serve(res); // Let ical-generator create the response
		})
		.catch(function (err) {
			res.render('error.ejs', err);
		});
}

module.exports = {
	generate: exportAll
};
