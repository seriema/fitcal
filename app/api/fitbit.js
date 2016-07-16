var q = require('q');
var FitbitApiClient = require("./fitbitClient");
var client = new FitbitApiClient();
var Sleep = require('../models/fitbit/sleep');


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
	]
};

const timeSpan = {
	baseDate: 'today',
	period: '7d'
};

function saveSleepDate(userFitbitId, date, data) {
	let categoryDeferred = q.defer();
	const query = {
		'fitbit.id': userFitbitId,
		dateTime: date
	};

	Sleep.findOne(query, function (err, sleep) {

		// if there is an error, stop everything and return that
		// i.e. an error connecting to the database
		if (err)
			return categoryDeferred.reject(err);

		// if the sleep data is not found, create one
		if (!sleep) {
			sleep = new Sleep();
			sleep.fitbit.id = userFitbitId;
			sleep.dateTime = date;
		}

		// add the data we went through all this trouble to get
		Object.keys(data).forEach(category => {
			sleep.raw[category] = data[category];
		});

		// save the sleep data to the database
		sleep.save(function (err) {
			if (err)
				return categoryDeferred.reject(err);

			categoryDeferred.resolve();
		});
	});

	return categoryDeferred.promise;
}

function saveTimeSeries(userFitbitId, userData) {
	return Object.keys(userData).map(date => {
		return saveSleepDate(userFitbitId, date, userData[date])
	});
}

// TODO: handle various Fitbit return results, like token expired, etc.
function callFitbit(token, category) {
	const scope = 'sleep';
	var path = `/${scope}/${category}/date/${timeSpan.baseDate}/${timeSpan.period}.json`;
	return client.get(path, token).then(function (result) {
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
			scope,
			category,
			data: data[`sleep-${category}`]
		};
	});
}

function joinTimeSeries(timeSeries) {
	let dateObjects = {};

	timeSeries.forEach( time => {
		time.data.forEach( day => {
			if (!dateObjects[day.dateTime]) {
				dateObjects[day.dateTime] = {};
			}

			dateObjects[day.dateTime][time.category] = day.value;
		});
	});

	return dateObjects;
}

function importSleep(user, res) {
	function updateCategory(categoryData) {
		function updateCategoryDate(category, dateData) {
			var query = {
				'fitbit.id': user.fitbit.id,
				dateTime: dateData.dateTime
			};
			return saveSleepDate(query, user, dateData, category);
		}

		var categoryPromises = categoryData.data.map(updateCategoryDate.bind(null, categoryData.category));
		return q.all(categoryPromises);
	}

	var fitbitPromises = resources.sleep.map(callFitbit.bind(null, user.fitbit.token));

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
	importSleep
};
