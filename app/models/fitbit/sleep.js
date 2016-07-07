var mongoose = require('mongoose');
var moment = require('moment-timezone');
const TIMEZONE = 'Europe/Stockholm';

var sleepSchema = mongoose.Schema({

    fitbit              : {
        id              : String
    },
    dateTime            : String, // ID
    raw                 : {
        startTime           : String,
        timeInBed           : String,
        minutesAsleep       : String,
        awakeningsCount     : String,
        minutesAwake        : String,
        minutesToFallAsleep : String,
        minutesAfterWakeup  : String,
        efficiency          : String
    }
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Sleep', sleepSchema);

// methods ======================
function getNumber(value) {
    if (value === "0" || !value)
        return null; // Fitbit spams the logs with no data

    return parseInt(value, 10);
}


/* "dateTime": "2015-10-22", "value": "01:13" */
sleepSchema.methods.start = function () {
    var value = this.raw.startTime;
    if (!value)
        return null; // Fitbit spams the logs with no data

    var hourMinute = value.split(':');

    var data = new Date(this.raw.dateTime); // TODO: Get a proper moment dateTime? and save it?
    data.setHours(parseInt(hourMinute[0], 10));
    data.setMinutes(parseInt(hourMinute[1], 10)); // ignoring "minutesToFallAsleep" for now

    var date = moment.tz(this.raw.dateTime + ' ' + value, TIMEZONE);

    if (date.format('A') === 'PM')
        date.subtract(1, 'day');

    return date;
};
sleepSchema.methods.end = function () {
    return this.start().clone().add(this.minutesAsleep(), 'minute');
};

/* "dateTime": "2015-10-22", "value": "280" */
/*sleepSchema.methods.minutesAsleep = function () {
    return getNumber(this.raw.minutesAsleep);
};*/
sleepSchema.virtual('minutesAsleep').get(function () {
    return getNumber(this.raw.minutesAsleep);
});

/* "dateTime": "2015-10-22", "value": "7" */
/*sleepSchema.methods.awakeningsCounts = function () {
    return getNumber(this.raw.awakeningsCount);
};*/
sleepSchema.virtual('awakeningsCounts').get(function () {
    return getNumber(this.raw.awakeningsCount);
});

/* "dateTime": "2015-10-22", "value": "95" */
/*sleepSchema.methods.efficiency = function () {
    return getNumber(this.raw.efficiency);
};*/
sleepSchema.virtual('efficiency').get(function () {
    return getNumber(this.raw.efficiency);
});


/*
 sleepSchema.virtual('start').get(function () {
 var value = this.raw.startTime;
 if (!value)
 return null; // Fitbit spams the logs with no data

 var hourMinute = value.split(':');

 var data = new Date(this.raw.dateTime); // TODO: Get a proper moment dateTime? and save it?
 data.setHours(parseInt(hourMinute[0], 10));
 data.setMinutes(parseInt(hourMinute[1], 10)); // ignoring "minutesToFallAsleep" for now

 var date = moment.tz(this.raw.dateTime + ' ' + value, TIMEZONE);

 if (date.format('A') === 'PM')
 date.subtract(1, 'day');

 return date;
 });
 sleepSchema.virtual('end').get(function () {
 return this.start().clone().add(this.minutesAsleep(), 'minute');
 });

sleepSchema.virtual('minutesAsleep').get(function () {
    return getNumber(this.raw.minutesAsleep);
});

sleepSchema.virtual('awakeningsCounts').get(function () {
    return getNumber(this.raw.awakeningsCount);
});

sleepSchema.virtual('efficiency').get(function () {
    return getNumber(this.raw.efficiency);
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