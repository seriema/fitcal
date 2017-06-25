export class AuthConfiguration {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
}

const facebookAuth : AuthConfiguration = {
    clientID      : process.env.LIFECAL_FACEBOOK_CLIENT_ID,
    clientSecret  : process.env.LIFECAL_FACEBOOK_CLIENT_SECRET,
    callbackURL   : process.env.LIFECAL_FACEBOOK_CALLBACK_URL
};

const fitbitAuth : AuthConfiguration = {
    clientID      : process.env.LIFECAL_FITBIT_CLIENT_ID,
    clientSecret  : process.env.LIFECAL_FITBIT_CLIENT_SECRET,
    callbackURL   : process.env.LIFECAL_FITBIT_CALLBACK_URL
};

export const auth = {
    facebookAuth,
    fitbitAuth
};