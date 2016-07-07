var FitbitApiClient = require('./oath2');
var client = new FitbitApiClient();
var moment = require('moment-timezone');
const TIMEZONE = 'Europe/Stockholm';

// --- Activity summary ---
/* activity ID's:
 90013 Walk
 15000 Sport
 1071 Outdoor Bike
 90009 Run
 90024 Swimming
 001 Aerobic Workout
 2050 Weights
 */
/* This got me some activites: https://api.fitbit.com/1/user/-/activities/list.json?beforeDate=2016-06-02&sort=desc&limit=20&offset=0 */
function calcActivites(originalData) {
    var activityData = {};

    originalData.activities.forEach(function (activity) {
        var startTime = moment.tz(activity.startTime, TIMEZONE);
        var endTime = startTime.clone().add(activity.duration, 'millisecond');
        var date = startTime.format('YYYY-MM-DD');

        activityData[date] = {
            activityName: activity.activityName,
            averageHeartRate: activity.averageHeartRate,
            calories: activity.calories,
            steps: activity.steps,
            duration: moment.duration(activity.activeDuration, 'millisecond'),
            start: startTime,
            stop: endTime,
            original: activity // Save original data for debugging purposes
        };
    });

    return activityData;
}
function apiActivity(token, callback) {
    // This is a new Beta API so it's quirky:
    // https://dev.fitbit.com/docs/activity/#get-activity-logs-list
    // https://community.fitbit.com/t5/Web-API/Potentially-breaking-change-to-Get-Activities-endpoint/m-p/736342#U736342
    // https://community.fitbit.com/t5/Web-API/Breaking-change-to-Get-Activity-Logs-List/m-p/1277033#M5120
    const today = moment().tz(TIMEZONE).format('YYYY-MM-DD');
    const limit = 20; // Max allowed
    //client.get(`/activities/list.json?beforeDate=${today}&sort=desc&limit=${limit}&offset=0`, token).then(function (results) {
    var path = '/activities/list.json?beforeDate='+today+'&sort=desc&limit='+limit+'&offset=0';
    client.get(path, token).then(function (results) {
        var activityData = calcActivites(results[0]);
        callback(activityData);
    });

}

// --- Sleep summary ---
function calcSleepTimes(allStartTimes, allMinutesAsleep, allAwakeningsCounts, allEfficiencies) {
    var sleepData = {}; // object key is the start date (i.e. "2016-04-23")

    // timeInBed = minutesToFallAsleep + minutesAsleep + minutesAwake + minutesAfterWakeup

    allStartTimes.forEach(function (time) {
        if (!time.value)
            return; // Fitbit spams the logs with no data

        var hourMinute = time.value.split(':');

        var data = new Date(time.dateTime);
        data.setHours(parseInt(hourMinute[0], 10));
        data.setMinutes(parseInt(hourMinute[1], 10)); // ignoring "minutesToFallAsleep" for now

        var date = moment.tz(time.dateTime + ' ' + time.value, TIMEZONE);

        if (date.format('A') === 'PM')
            date.subtract(1, 'day');

        sleepData[time.dateTime] = {
            start: date, // Save the Moment.js object (it will be converted to a native Date later)
            original: { // Save original data for debugging purposes
                startTime: time
            }
        };
    });
                                  
    allMinutesAsleep.forEach(function (time) {
        if (time.value === "0" || !time.value)
            return; // Fitbit spams the logs with no data

        var data = sleepData[time.dateTime];
        if (!data)
            return; // For some reason this date doesn't exist?

        var minutesAsleep = parseInt(time.value, 10);
        var date = data.start.clone().add(minutesAsleep, 'minute');

        // Add new info to data object.
        data.stop = date;
        data.duration = moment.duration(minutesAsleep, 'minutes');
        data.original.minutesAsleep = time;
    });

    allAwakeningsCounts.forEach(function (time) {
        if (time.value === "0" || !time.value)
            return; // Fitbit spams the logs with no data

        var data = sleepData[time.dateTime];
        if (!data) {
            data.awakeningsCount = 0;
            return; // For some reason this date doesn't exist?
        }

        data.awakeningsCount = parseInt(time.value, 10) || 0; // Sometimes
        data.original.awakeningsCount = time;
    });

    allEfficiencies.forEach(function (time) {
        if (time.value === "0" || !time.value)
            return; // Fitbit spams the logs with no data

        var data = sleepData[time.dateTime];
        if (!data) {
            return; // For some reason this date doesn't exist?
        }

        data.efficiency = parseInt(time.value, 10);
        data.original.efficiency = time;
    });

    return sleepData;
}
function apiSleep(token, callback) {
    client.get("/sleep/startTime/date/today/max.json", token).then(function (results) {
        var allStartTimes = results[0]["sleep-startTime"];

        client.get("/sleep/minutesAsleep/date/today/max.json", token).then(function (results) {
            var allMinutesAsleep = results[0]["sleep-minutesAsleep"];

            client.get("/sleep/awakeningsCount/date/today/max.json", token).then(function (results) {
                var allAwakeningsCounts = results[0]["sleep-awakeningsCount"];

                client.get("/sleep/efficiency/date/today/max.json", token).then(function (results) {
                    var allEfficiencies = results[0]["sleep-efficiency"];

                    var sleepData = calcSleepTimes(allStartTimes, allMinutesAsleep, allAwakeningsCounts, allEfficiencies);
                    callback(sleepData);
                });
            });
        });
    });
}

// --- Heart summary ---
function calcHeartRestingRates(allHearts) {
    var heartData = {};

    allHearts.forEach(function (heart) {
        if (!heart.value || !heart.value.restingHeartRate)
            return;

        var date = moment.tz(heart.dateTime, TIMEZONE);

        heartData[heart.dateTime] = {
            start: date,
            restingHeartRate: heart.value.restingHeartRate,
            original: heart
        };
    });

    return heartData;
}
function apiHeart(token, callback) {
    // Note: only gets 1 month
    client.get("/activities/heart/date/today/1m.json", token).then(function (results) {
        var allHearts = results[0]["activities-heart"];
        var heartData = calcHeartRestingRates(allHearts);

        callback(heartData);
    });
}

module.exports = {
    activity: apiActivity,
    sleep: apiSleep,
    heart: apiHeart,
    client: client
};

/*
// --- iCal ---
app.get("/calendar/ical", function (req, res) {
    console.log("ical request START", moment().format());

    // Get sleep start times
    apiSleep(function (sleepData) {
        console.log("1/3: got sleep start data");

        apiHeart(function (heartData) {
            console.log("2/3: got heart rate data");

            apiActivity(function (activityData) {
                console.log("3/3: got activity data");


                // - Setup iCal -
                var cal = ical({
                    domain: 'fitbit2016-rubinsson.c9users.io',
                    name: 'Fitbit calendar',
                    timezone: TIMEZONE,
                    ttl: 60 // * 60 * 24
                });

                // -- Sleep events
                Object.keys(sleepData).forEach(function (key) {
                    var value = sleepData[key];

                    cal.createEvent({
                        start: value.start.toDate(),
                        end: value.stop.toDate(),
                        summary: `Sleep - ${value.duration.hours()} h ${value.duration.minutes()} min - ${value.efficiency} % - ${value.awakeningsCount} times awake`,
                        description: JSON.stringify(value)
                    });
                });

                // -- Heart rate events
                Object.keys(heartData).forEach(function (key) {
                    var value = heartData[key];

                    cal.createEvent({
                        start: value.start.toString(),
                        allDay: true,
                        summary: `Resting heart rate ${value.restingHeartRate} bpm`,
                        description: JSON.stringify(value)
                    });
                });

                // -- Activity events
                Object.keys(activityData).forEach(function (key) {
                    var value = activityData[key];

                    cal.createEvent({
                        start: value.start.toDate(),
                        end: value.stop.toDate(),
                        summary: `${value.activityName} - ${value.duration.asMinutes().toFixed()} min - ${value.steps} steps - ${value.averageHeartRate} bpm - ${value.calories} kcal`,
                        description: JSON.stringify(value)
                    });
                });

                // -- Response
                console.log("ical request STOP");
                cal.serve(res);
            });
        });
    });
});

// Fitbit API
/// Activity
app.get("/activities/list", function (req, res) {
    const today = moment().tz(TIMEZONE).format('YYYY-MM-DD');
    const limit = 20; // Max allowed
    client.get(`/activities/list.json?beforeDate=${today}&sort=desc&limit=${limit}&offset=0`, token).then(function (results) { res.send(results[0]); });
});
/// Sleep
app.get("/sleep/startTime", function (req, res) {
    client.get("/sleep/startTime/date/today/max.json", token).then(function (results) { res.send(results[0]); });
});
app.get("/sleep/timeInBed", function (req, res) {
    client.get("/sleep/timeInBed/date/today/max.json", token).then(function (results) { res.send(results[0]); });
});
app.get("/sleep/minutesAsleep", function (req, res) {
    client.get("/sleep/minutesAsleep/date/today/max.json", token).then(function (results) { res.send(results[0]); });
});
app.get("/sleep/timeInBed", function (req, res) {
    client.get("/sleep/timeInBed/date/today/max.json", token).then(function (results) { res.send(results[0]); });
});
app.get("/sleep/awakeningsCount", function (req, res) {
    client.get("/sleep/awakeningsCount/date/today/max.json", token).then(function (results) { res.send(results[0]); });
});
app.get("/sleep/minutesAwake", function (req, res) {
    client.get("/sleep/minutesAwake/date/today/max.json", token).then(function (results) { res.send(results[0]); });
});
app.get("/sleep/minutesToFallAsleep", function (req, res) {
    client.get("/sleep/minutesToFallAsleep/date/today/max.json", token).then(function (results) { res.send(results[0]); });
});
app.get("/sleep/minutesAfterWakeup", function (req, res) {
    client.get("/sleep/minutesAfterWakeup/date/today/max.json", token).then(function (results) { res.send(results[0]); });
});
app.get("/sleep/efficiency", function (req, res) {
    client.get("/sleep/efficiency/date/today/max.json", token).then(function (results) { res.send(results[0]); });
});
/// Activitites
/// Heart rate
app.get("/activities/heart", function (req, res) {
    client.get("/activities/heart/date/today/1m.json", token).then(function (results) { res.send(results[0]); });
});
*/