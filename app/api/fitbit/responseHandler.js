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

let updateToken = function () {

};

let doDance = function (user, res) {
	let client = new FitbitApiClient(user.fitbit.id, user.fitbit.token, user.fitbit.refreshToken);
	// Ping user profile, just to see if the tokens are ok.
	client.get('/profile').then(result => {
		// 	console.log('hi', result);
		// }).catch(err => {
		// 	console.log('uhoh', result);

		const ok = !(result[0] && result[0].success);
		if (ok) {
			return res.redirect('/');
		}

		// switch (err.context.errors[0].errorType) {
		// 'invalid_grant':
		// });

		const error = result[0].errors[0];
		const incomingMessage = result[1];
		if (
			incomingMessage.statusCode === 400 && // Bad Request
			error.errorType === 'invalid_grant' &&
			error.message.includes('Refresh token invalid')
		) {
			console.log('invalid grant');
			return;
		} else if (
			incomingMessage.statusCode === 401 && // Unauthorized
			error.errorType === 'expired_token' &&
			error.message.includes('Access token expired')
		) {
			client.refreshAccesstoken().then(result => {
				const ok = !(result[0] && result[0].success);
				if (ok) {
					updateToken(user, result).then(thing => {
						res.redirect('/', thing);
					});
					return;
				}

				res.render('error.ejs', 'couldnt update');
				console.log('shit', result);
				return;
			});

			console.log('expired grant');
			return;
		} else if (
			incomingMessage.statusCode === 404 && // Not Found
			error.errorType === 'not_found' &&
			error.message.includes('The API you are requesting could not be found')
		) {
			console.log('not found');
			return;
		}

		res.render('error.ejs', 'not really an error but Im debugging');
	});
};

function refreshToken(user) {
	let client = new FitbitApiClient();
	return client.refreshAccesstoken(user.fitbit.token, user.fitbit.refreshToken);
		// .catch(error => {
		// 	// refresh_token - invalid
		// 	if (error.errorTyep === 'invalid_grant')
		// 		return client.getAccessToken()
		// });
}

function _refreshRefreshToken() {

}

function _refreshToken() {
	let client;
	let user;
	let res;
	client.refreshAccesstoken().then(result => {
		const ok = !(result[0] && result[0].success);
		if (ok) {
			updateToken(user, result).then(thing => {
				res.redirect('/', thing);
			});
			return;
		}

		res.render('error.ejs', 'couldnt update');
		console.log('shit', result);
		return;
	});
}

function _selectHandler(result) {
	const ok = result[0] && result[0].success !== false;
	if (ok) {
		return null;
	}

	const error = result[0].errors[0];
	const incomingMessage = result[1];
	if (
		incomingMessage.statusCode === 400 && // Bad Request
		error.errorType === 'invalid_grant' &&
		error.message.includes('Refresh token invalid')
	) {
		return _refreshRefreshToken;
	} else if (
		incomingMessage.statusCode === 401 && // Unauthorized
		error.errorType === 'expired_token' &&
		error.message.includes('Access token expired')
	) {
		return _refreshToken;
	} else if (
		incomingMessage.statusCode === 404 && // Not Found
		error.errorType === 'not_found' &&
		error.message.includes('The API you are requesting could not be found')
	) {
		throw new Error('API endpoint not found', result);
	}

	throw new Error('No handler for this Fitbit response', result);
}

module.exports = {
	doDance,
	refreshToken,
	_selectHandler,
	_refreshRefreshToken,
	_refreshToken
};
