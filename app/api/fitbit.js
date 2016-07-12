var q = require('q');
var FitbitApiClient = require("./fitbitClient");
var client = new FitbitApiClient();
var Day = require('../models/fitbit/day');


const resources = {
	sleep: [
		'startTime',
		'timeInBed',
		'minutesAsleep',
		'awakeningsCount',
		'minutesAwake',
		'minutesToFallAsleep',
		'minutesAfterWakeup',
		'efficiency'
	],
	activities: [
		'heart'
	]
};

const timeSpan = {
	baseDate: 'today',
	period: '7d'
};

function saveDay(userFitbitId, day, data) {
	let categoryDeferred = q.defer();
	const query = {
		id: userFitbitId,
		dateTime: day
	};

	Day.findOne(query, function (err, dataPoint) {

		// if there is an error, stop everything and return that
		// i.e. an error connecting to the database
		if (err)
			return categoryDeferred.reject(err);

		// if the sleep data is not found, create one
		if (!dataPoint) {
			dataPoint = new Day();
			dataPoint.id = userFitbitId;
			dataPoint.dateTime = day;
		}

		// add the data we went through all this trouble to get
		Object.keys(data).forEach(scope => {
			dataPoint[scope] = data[scope];
		});

		// save the sleep data to the database
		dataPoint.save(function (err) {
			if (err)
				return categoryDeferred.reject(err);

			categoryDeferred.resolve();
		});
	});

	return categoryDeferred.promise;
}

function saveTimeSeries(userFitbitId, userData) {
	return Object.keys(userData).map(date => {
		return saveDay(userFitbitId, date, userData[date]);
	});
}

// TODO: handle various Fitbit return results, like token expired, etc.
function callFitbit(token, scope, category) {
	var path = `/${scope}/${category}/date/${timeSpan.baseDate}/${timeSpan.period}.json`;
	return client.get(path, token).then(function (result) {
		result = result[0];
		if (result.success === false) {
			let error = result.errors[0];
			if (error.errorType === 'expired_token') {
				throw error; // TODO: Renew the token or something.
			} else {
				throw error; // What other errors can I get?
			}
		}

		let data = result[`${scope}-${category}`];

		return {
			scope,
			category,
			data
		};
	});
}

function joinTimeSeries(timeSeries) {
	let dateObjects = {};

	timeSeries.forEach(time => {
		time.data.forEach(day => {
			if (!dateObjects[day.dateTime]) {
				dateObjects[day.dateTime] = {};
				dateObjects[day.dateTime][time.scope] = {};
			} else if (!dateObjects[day.dateTime][time.scope]) {
				dateObjects[day.dateTime][time.scope] = {};
			}

			dateObjects[day.dateTime][time.scope][time.category] = day.value;
		});
	});

	return dateObjects;
}

function importTimeSeries(user, res) {
	let scope = 'activities';
	let fitbitPromises = resources[scope].map(callFitbit.bind(null, user.fitbit.token, scope));
	scope = 'sleep';
	fitbitPromises = fitbitPromises.concat(resources[scope].map(callFitbit.bind(null, user.fitbit.token, scope)));

	q.all(fitbitPromises)
		.then(joinTimeSeries)
		.then(saveTimeSeries.bind(null, user.fitbit.id))
		.then(function () {
			res.send(`Import complete of ${resources.sleep.length} sleep categories from ${timeSpan.baseDate} and going back ${timeSpan.period}.`);
		})
		.fail(function (error) {
			res.render('error.ejs', {error});
		});
}

module.exports = {
	importTimeSeries
};
