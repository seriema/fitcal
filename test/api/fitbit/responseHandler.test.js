let expect = require('chai').expect;
let responseHandler = require('./../../../app/api/fitbit/responseHandler');

describe('responseHandler', () => {
	let fitbitResponse;

	describe('#_selectHandler', () => {
		describe('when response is ok', () => {
			beforeEach(() => {
				fitbitResponse = [{
					success: undefined // Fitbit returns a "success" false when there's an error, but no such property for no error...
				}]; // TODO: Does hit have a statusCode 200?
			});

			it('should return null', () => {
				let result = responseHandler._selectHandler(fitbitResponse);

				expect(result).to.be.null;
			});
		});

		describe('when getting "Refresh token invalid"', () => {
			beforeEach(() => {
				fitbitResponse = [{
					success: false,
					errors: [{
						errorType: 'invalid_grant',
						message: 'Refresh token invalid'
					}]
				}, {
					statusCode: 400
				}];
			});

			it('should return _refreshRefreshToken', () => {
				let result = responseHandler._selectHandler(fitbitResponse);

				expect(result).to.equal(responseHandler._refreshRefreshToken);
			});
		});

		describe('when getting "Access token expired"', () => {
			beforeEach(() => {
				fitbitResponse = [{
					success: false,
					errors: [{
						errorType: 'expired_token',
						message: 'Access token expired'
					}]
				}, {
					statusCode: 401
				}];
			});

			it('should return _refreshToken', () => {
				let result = responseHandler._selectHandler(fitbitResponse);

				expect(result).to.equal(responseHandler._refreshToken);
			});
		});

		describe('when getting "The API you are requesting could not be found"', () => {
			beforeEach(() => {
				fitbitResponse = [{
					success: false,
					errors: [{
						errorType: 'not_found',
						message: 'The API you are requesting could not be found'
					}]
				}, {
					statusCode: 404
				}];
			});

			it('should throw exception', () => {
				expect(responseHandler._selectHandler.bind(null, fitbitResponse)).to.throw(/API endpoint not found/);
			});
		});

		describe('when handling an unknown error', () => {
			beforeEach(() => {
				fitbitResponse = [{
					success: false,
					errors: [{
						errorType: 'some_new_unexpected_error',
						message: 'Lorum ipsum'
					}]
				}, {
					statusCode: 500 // Who knows what it could be, but the property exists.
				}];
			});

			it('should throw exception', () => {
				expect(responseHandler._selectHandler.bind(null, fitbitResponse)).to.throw(/No handler for this Fitbit response/);
			});
		});
	});
});
