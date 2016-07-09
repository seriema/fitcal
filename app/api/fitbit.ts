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

function importSleep(user, res) {
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
                    return categoryDeferred.reject(err);

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
        return client.get(path, user.fitbit.token).then(function (result) {
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
}

module.exports = {
    importSleep
};