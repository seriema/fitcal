// expose our config directly to our application using module.exports
module.exports = {

	'facebookAuth' : {
		'clientID'      : process.env.LIFECAL_FACEBOOK_CLIENT_ID,
		'clientSecret'  : process.env.LIFECAL_FACEBOOK_CLIENT_SECRET,
		'callbackURL'   : process.env.LIFECAL_FACEBOOK_CALLBACK_URL
	},

	'fitbitAuth' : {
		'clientID'      : process.env.LIFECAL_FITBIT_CLIENT_ID,
		'clientSecret'  : process.env.LIFECAL_FITBIT_CLIENT_SECRET,
		'callbackURL'   : process.env.LIFECAL_FITBIT_CALLBACK_URL
	}

};
