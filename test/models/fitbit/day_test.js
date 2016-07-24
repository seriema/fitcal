let model = require('./../../../app/models/fitbit/day');
let expect = require('chai').expect;
let moment = require('moment');

let methods = model.schema.methods;


describe('#start', function() {
	describe('with missing dateTime', function() {
		let sleepData;

		beforeEach(() => {
			sleepData = {
				dateTime: '2016-07-19',
				sleep: {
					startTime: undefined
				}
			}
		});

		it('should be null', () => {
			let result = methods.start.call(sleepData);

			expect(result).to.be.null;
		});
	});

	describe('with normal data', function() {
		let sleepData;

		beforeEach(() => {
			sleepData = {
				dateTime: '2016-07-19',
				sleep: {
					startTime: '23:46'
				}
			}
		});

		it('should be a moment object', () => {
			let result = methods.start.call(sleepData);

			expect(result).to.be.an.instanceof(moment);
		});

		it('should have the correct year', () => {
			let result = methods.start.call(sleepData);
			expect(result.get('year')).to.equal(2016);
		});

		it('should have the correct month', () => {
			let result = methods.start.call(sleepData);
			expect(result.get('month')).to.equal(6); // zero based
		});

		it('should have the correct date being the day before', () => {
			let result = methods.start.call(sleepData);
			expect(result.get('date')).to.equal(18); // one less, because you go to bed the night before? Or is it the silly timezone stuff -2h?
		});

		it('should have the correct hour', () => {
			let result = methods.start.call(sleepData);
			expect(result.get('hour')).to.equal(23);
		});

		it('should have the correct minute', () => {
			let result = methods.start.call(sleepData);
			expect(result.get('minute')).to.equal(46);
		});

	});
});

describe('#end', function() {
	describe('with normal data', function() {
		let sleepData;

		beforeEach(() => {
			sleepData = {
				dateTime: '2016-07-19',
				sleep: {
					startTime: '23:46',
					minutesAsleep: '355'
				}
			}
		});

		it('should be a moment object', () => {
			let result = methods.end.call(sleepData);

			expect(result).to.be.an.instanceof(moment);
		});

		it('should have the correct year', () => {
			let result = methods.end.call(sleepData);
			expect(result.get('year')).to.equal(2016);
		});

		it('should have the correct month', () => {
			let result = methods.end.call(sleepData);
			expect(result.get('month')).to.equal(6); // zero based
		});

		it('should have the correct date being the day after "start"', () => {
			let result = methods.end.call(sleepData);
			expect(result.get('date')).to.equal(19);
		});

		it('should have the correct hour', () => {
			let result = methods.end.call(sleepData);
			expect(result.get('hour')).to.equal(5);
		});

		it('should have the correct minute', () => {
			let result = methods.end.call(sleepData);
			expect(result.get('minute')).to.equal(41);
		});

	});
});

describe('#summary', function() {
	describe('with missing awakeningsCount', function() {
		let sleepData;

		beforeEach(() => {
			sleepData = {
				dateTime: '2016-07-19',
				sleep: {
					startTime: '23:46',
					awakeningsCount: undefined,
					minutesAsleep: '355',
					efficiency: '94'
				}
			}
		});

		it('should have the correct format', () => {
			let result = methods.summary.call(sleepData);
			expect(result).to.equal('Sleep - 5 h 55 min - 94 % - unknown times awake');
		});
	});

	describe('with normal data', function() {
		let sleepData;

		beforeEach(() => {
			sleepData = {
				dateTime: '2016-07-19',
				sleep: {
					startTime: '23:46',
					awakeningsCount: '10',
					minutesAsleep: '355',
					efficiency: '94'
				}
			}
		});

		it('should have the correct format', () => {
			let result = methods.summary.call(sleepData);
			expect(result).to.equal('Sleep - 5 h 55 min - 94 % - 10 times awake');
		});
	});
});
