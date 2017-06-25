// Taken from https://github.com/lukasolson/fitbit-node
// The idea is to rewrite it to something simpler and more standard.

import * as OAuth2 from 'simple-oauth2';
import * as Q from 'q';
import { Request } from 'request';
import { auth as configAuth } from './../../config/auth';

function FitbitApiClient() {
    this.oauth2 = OAuth2({
        client: {
            id        : configAuth.fitbitAuth.clientID,
            secret    : configAuth.fitbitAuth.clientSecret
        },
        auth: {
            tokenHost: 'https://api.fitbit.com/',
            authorizePath: 'oauth2/authorize',
            tokenPath: 'oauth2/token',            
        },
        options: {
            useBasicAuthorizationHeader: true
        }
    });
}

FitbitApiClient.prototype = {
    getAuthorizeUrl: function (scope, redirectUrl) {
        return this.oauth2.authCode.authorizeURL({
            scope: scope,
            redirect_uri: redirectUrl
        }).replace('api', 'www');
    },

    getAccessToken: function (code, redirectUrl) {
        var deferred = Q.defer();

        this.oauth2.authCode.getToken({
            code: code,
            redirect_uri: redirectUrl
        }, function (error, result) {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve(result);
            }
        });

        return deferred.promise;
    },

    refreshAccesstoken: function (accessToken, refreshToken) {
        var deferred = Q.defer();

        var token = this.oauth2.accessToken.create({
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: -1
        });

        token.refresh(function (error, result) {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve(result.token);
            }
        });

        return deferred.promise;
    },

    get: function (path, accessToken, userId) {
        var deferred = Q.defer();

        Request({
            url: getUrl(path, userId),
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + accessToken
            },
            json: true
        }, function(error, response, body) {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve([
                    body,
                    response
                ]);
            }
        });

        return deferred.promise;
    },

    post: function (path, accessToken, data, userId) {
        var deferred = Q.defer();

        Request({
            url: getUrl(path, userId),
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + accessToken
            },
            json: true,
            body: data
        }, function(error, response, body) {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve([
                    body,
                    response
                ]);
            }
        });

        return deferred.promise;
    },

    put: function (path, accessToken, data, userId) {
        var deferred = Q.defer();

        Request({
            url: getUrl(path, userId),
            method: 'PUT',
            headers: {
                Authorization: 'Bearer ' + accessToken
            },
            json: true,
            body: data
        }, function(error, response, body) {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve([
                    body,
                    response
                ]);
            }
        });

        return deferred.promise;
    },

    delete: function (path, accessToken, userId) {
        var deferred = Q.defer();

        Request({
            url: getUrl(path, userId),
            method: 'DELETE',
            headers: {
                Authorization: 'Bearer ' + accessToken
            },
            json: true
        }, function(error, response, body) {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve([
                    body,
                    response
                ]);
            }
        });

        return deferred.promise;
    }
};

function getUrl(path, userId) {
    return 'https://api.fitbit.com/1/user/' + (userId || '-') + path;
}

export { FitbitApiClient };