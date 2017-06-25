import * as mongoose from 'mongoose';
import { moment } from 'moment-timezone';

const TIMEZONE = 'Europe/Stockholm'; // TODO: This should be on the User model
const DATEFORMAT = 'YYYY-MM-DD';

export interface ISleep {
    fitbit              : {
        id              : string
    },
    dateTime            : string, // ID // TODO: Should specify the format somewhere? For easy parsing with momentjs
    raw                 : { // TODO: Call this fitbit.raw?
        startTime           : string,
        timeInBed           : string,
        minutesAsleep       : string,
        awakeningsCount     : string,
        minutesAwake        : string,
        minutesToFallAsleep : string,
        minutesAfterWakeup  : string,
        efficiency          : string
    }
};

export var SleepSchema: mongoose.Schema = new mongoose.Schema({

    fitbit              : {
        id              : String
    },
    dateTime            : String, // ID // TODO: Should specify the format somewhere? For easy parsing with momentjs
    raw                 : { // TODO: Call this fitbit.raw?
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

// methods ======================
function getNumber(value) : number {
    if (value === "0" || !value)
        return null; // Fitbit spams the logs with no data

    return parseInt(value, 10);
}

// Convenience methods for the calendar export.
SleepSchema.methods.start = function () : moment.Moment {
    /* "dateTime": "2015-10-22", "value": "01:13" */
    var value = this.raw.startTime; // TODO: Use virtual?
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
SleepSchema.methods.end = function () : any {
    var date = this.start().clone().add(this.minutesAsleep, 'minute');
    return date;
};
SleepSchema.methods.summary = function () : string {
    var minAsleep = moment.duration(this.minutesAsleep, 'minutes');
    var awakeCount = this.awakeningsCount === undefined ? 'unknown' : this.awakeningsCount; // 0 is a valid number
    //var awakeText = this.awakeningsCount === undefined ? '' : `${this.awakeningsCount} times awake`; // 0 is a valid number
    var text = `Sleep - ${minAsleep.hours()} h ${minAsleep.minutes()} min - ${this.efficiency} % - ${awakeCount} times awake`;
    return text;
};

/* "dateTime": "2015-10-22", "value": "280" */
/*sleepSchema.methods.minutesAsleep = function () {
    return getNumber(this.raw.minutesAsleep);
};*/
SleepSchema.virtual('minutesAsleep').get(function () : number {
    return getNumber(this.raw.minutesAsleep);
});

/* "dateTime": "2015-10-22", "value": "7" */
/*sleepSchema.methods.awakeningsCounts = function () {
    return getNumber(this.raw.awakeningsCount);
};*/
SleepSchema.virtual('awakeningsCount').get(function () : number {
    return getNumber(this.raw.awakeningsCount);
});

/* "dateTime": "2015-10-22", "value": "95" */
/*sleepSchema.methods.efficiency = function () {
    return getNumber(this.raw.efficiency);
};*/
SleepSchema.virtual('efficiency').get(function () : number {
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

export interface ISleepModel extends ISleep, mongoose.Document {
  start(): moment.Moment;
  end(): any;
  summary(): string;
  minutesAsleep(): number;
  awakeningsCount(): number;
  efficiency(): number;
}

// create the model for users and expose it to our app
export const Sleep = mongoose.model<ISleepModel>('Sleep', SleepSchema);