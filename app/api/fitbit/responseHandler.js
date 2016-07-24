let FitbitApiClient = require('./fitbitClient');

// function firstAttempt(call) {
// 	let deferred = q.defer();
//
// 	call().then(result => {
// 		result = result[0];
// 		if (result.success === false) {
// 			let error = result.errors[0];
// 			deferred.reject(error);
// 		} else {
// 			deferred.resolve(result);
// 		}
// 	});
//
// 	return deferred.promise;
// }
// function firstAttempt(call) {
// 	let deferred = q.defer();
//
// 	call().then(result => {
// 		result = result[0];
// 		if (result.success === false) {
// 			let error = result.errors[0];
// 			return handleFitbitResponse(call, error)
// 		} else {
// 			deferred.resolve(result);
// 		}
// 	});
//
// 	return deferred.promise;
// }

/*
 Response Headers
 Fitbit API responses include headers that provide you with your rate limit status.

 Fitbit-Rate-Limit-Limit: The quota number of calls.
 Fitbit-Rate-Limit-Remaining: The number of calls remaining before hitting the rate limit.
 Fitbit-Rate-Limit-Reset: The number of seconds until the rate limit resets.

*/

// function handleFitbitResponse(call, error) {
// 	let deferred = q.defer();
//
// 	if (error.errorType === 'expired_token') {
//
// 	} else {
// 		throw error; // What other errors can I get?
// 	}
//
// 	return deferred.promise;
// }

// module.exports = {
// 	firstAttempt: firstAttempt,
// 	handleFitbitResponse: handleFitbitResponse
// };

function refreshToken(user) {
	let client = new FitbitApiClient();
	return client.refreshAccesstoken(user.fitbit.token, user.fitbit.refreshToken);
		// .catch(error => {
		// 	// refresh_token - invalid
		// 	if (error.errorTyep === 'invalid_grant')
		// 		return client.getAccessToken()
		// });
}

module.exports = refreshToken;
