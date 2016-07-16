var mongoose = require('mongoose');
var moment = require('moment-timezone');
const TIMEZONE = 'Europe/Stockholm'; // TODO: This should be on the User model
const DATEFORMAT = 'YYYY-MM-DD';

var daySchema = mongoose.Schema({
	id                  : String,
	dateTime            : String, // ID // TODO: Should specify the format somewhere? For easy parsing with momentjs
	sleep               : {
		startTime           : String,  // "23:46"
		timeInBed           : String,  // "376"
		minutesAsleep       : String,  // "355"
		awakeningsCount     : String,  // "10"
		minutesAwake        : String,  // "21"
		minutesToFallAsleep : String,  // "0"
		minutesAfterWakeup  : String,  // "0"
		efficiency          : String   // "94"
	},
	activities          : {
		heart               : {
			//customHeartRateZones: ??
			restingHeartRate    : Number,      // 68
			heartRateZones      : [{
				caloriesOut         : Number,  // 740.15264
				max                 : Number,  // 94
				min                 : Number,  // 30
				minutes             : Number,  // 593
				name                : String   // "Fat Burn"
			}]
		},
		calories            : String,  // "3193"
		caloriesBMR         : String,  // "1668"
		steps               : String,  // "13311"
		distance            : String,  // "9.78446"
		floors              : String,  // "13"
		elevation           : String,  // "39"
		minutesSedentary    : String,  // "700"
		minutesLightlyActive: String,  // "287"
		minutesFairlyActive : String,  // "33"
		minutesVeryActive   : String,  // "33"
		activityCalories    : String   // "1697"
	},
	body               : {
		bmi                 : String,  // "23.125537872314453"
		fat                 : String,  // "16.0"
		weight              : String   // "72.45"
	}
});

// methods ======================
function getNumber(value) {
	if (value === "0" || !value)
		return null; // Fitbit spams the logs with no data

	return parseInt(value, 10);
}

// Convenience methods for the calendar export.
daySchema.methods.start = function () {
	/* "dateTime": "2015-10-22", "value": "01:13" */
	var value = this.sleep.startTime; // TODO: Use virtual?
	if (!value)
		return null; // Fitbit spams the logs with no data

	// TODO: Should probably add minutesToFallAsleep?
	var format = DATEFORMAT + '_' + 'hh:mm'; // Assuming Fitbit uses AM/PM, so it's 'hh'. For 24h time use 'HH'.
	var dateString = this.dateTime + '_' + value;
	var date = moment.tz(dateString, format, TIMEZONE);

	// If we fell asleep after midnight we need to adjust time start time for the calendar.
	if (date.format('A') === 'PM')
		date.subtract(1, 'day');

	return date;
};
daySchema.methods.end = function () {
	var date = this.start().clone().add(this.minutesAsleep, 'minute');
	return date;
};
daySchema.methods.summary = function () {
	var minAsleep = moment.duration(this.minutesAsleep, 'minutes');
	var awakeCount = this.awakeningsCount === undefined ? 'unknown' : this.awakeningsCount; // 0 is a valid number
	//var awakeText = this.awakeningsCount === undefined ? '' : `${this.awakeningsCount} times awake`; // 0 is a valid number
	var text = `Sleep - ${minAsleep.hours()} h ${minAsleep.minutes()} min - ${this.efficiency} % - ${awakeCount} times awake`;
	return text;
};

daySchema.virtual('minutesAsleep').get(function () {
	return getNumber(this.sleep.minutesAsleep);
});

daySchema.virtual('awakeningsCount').get(function () {
	return getNumber(this.sleep.awakeningsCount);
});

daySchema.virtual('efficiency').get(function () {
	return getNumber(this.sleep.efficiency);
});

daySchema.virtual('restingHeartRate').get(function () {
	return this.activities.heart.restingHeartRate;
});

daySchema.virtual('day').get(function () {
	let day = moment.tz(this.dateTime, TIMEZONE);
	day.add(1, 'day'); // TODO: This doesn't make sense. Make it make sense.
	return day;
});


/*
 daySchema.virtual('start').get(function () {
 var value = this.sleep.startTime;
 if (!value)
 return null; // Fitbit spams the logs with no data

 var hourMinute = value.split(':');

 var data = new Date(this.sleep.dateTime); // TODO: Get a proper moment dateTime? and save it?
 data.setHours(parseInt(hourMinute[0], 10));
 data.setMinutes(parseInt(hourMinute[1], 10)); // ignoring "minutesToFallAsleep" for now

 var date = moment.tz(this.sleep.dateTime + ' ' + value, TIMEZONE);

 if (date.format('A') === 'PM')
 date.subtract(1, 'day');

 return date;
 });
 daySchema.virtual('end').get(function () {
 return this.start().clone().add(this.minutesAsleep(), 'minute');
 });

 daySchema.virtual('minutesAsleep').get(function () {
 return getNumber(this.sleep.minutesAsleep);
 });

 daySchema.virtual('awakeningsCounts').get(function () {
 return getNumber(this.sleep.awakeningsCount);
 });

 daySchema.virtual('efficiency').get(function () {
 return getNumber(this.sleep.efficiency);
 });
 */


/*
 start: value.start.toDate(),
 end: value.stop.toDate(),
 summary: `Sleep - ${value.duration.hours()} h ${value.duration.minutes()} min - ${value.efficiency} % - ${value.awakeningsCount} times awake`,
 description: JSON.stringify(value)




 time            : {
 start       : String,
 stop        : String,
 duration    : String
 },
 awakeningsCount : Number,
 efficiency      : Number

 */


// create the model for users and expose it to our app
module.exports = mongoose.model('Fitbit.Day', daySchema);
