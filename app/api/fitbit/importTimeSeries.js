let q = require('q');
let FitbitApiClient = require('./fitbitClient');
let client = new FitbitApiClient();
let Day = require('../../models/fitbit/day');

const resources = {
	sleep: [ // period: 1d, 7d, 30d, 1w, 1m, 3m, 6m, 1y, or max.
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
		'heart', // period: 1d, 7d, 30d, 1w, 1m.

		// Also accessible through activities/log but I don't have 3 level nesting support atm.
		// period: 1d, 7d, 30d, 1w, 1m, 3m, 6m, 1y, or max.
		'calories',
		'caloriesBMR',
		'steps',
		'distance',
		'floors',
		'elevation',
		'minutesSedentary',
		'minutesLightlyActive',
		'minutesFairlyActive',
		'minutesVeryActive',
		'activityCalories'
	],
	body: [ // period: 1d, 7d, 30d, 1w, 1m, 3m, 6m, 1y, or max.
		'bmi',
		'fat',
		'weight'
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
function handleFitbitResponse(result, scope, category) {
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
}

function callFitbit(token, scope, category) {
	const path = `/${scope}/${category}/date/${timeSpan.baseDate}/${timeSpan.period}.json`;
	return client.get(path, token);
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
	// Go through all scopes and categories, and flatten the promises.
	const scopes = Object.keys(resources);
	let fitbitPromises = scopes.map(scope => {
		return resources[scope].map(category => {
			return callFitbit(user.fitbit.token, scope, category).then(result => {
				return handleFitbitResponse(result, scope, category);
			});
		});
	}).reduce((a, b) => { // flatten
		return a.concat(b);
	}, []);

	q.all(fitbitPromises)
		.then(joinTimeSeries)
		.then(saveTimeSeries.bind(null, user.fitbit.id))
		.then(function () {
			res.send(`Import complete of ${fitbitPromises.length} categories in ${scopes.length} scopes, from ${timeSpan.baseDate} and going back ${timeSpan.period}.`);
		})
		.fail(function (error) {
			res.render('error.ejs', {error});
		});
}

module.exports = importTimeSeries;
