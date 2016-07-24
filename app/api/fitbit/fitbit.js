let importTimeSeries = require('./importTimeSeries');
let responseHandler = require('./responseHandler');

// temp:
let FitbitApiClient = require('./fitbitClient');

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

module.exports = {
	importTimeSeries,
	responseHandler,
	doDance
};
