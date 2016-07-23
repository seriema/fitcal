import test from 'ava';
let dayModel = require('./../../../app/models/fitbit/day');

let dayData;

test.beforeEach(t => {
	dayData = {
		dateTime: "2016-07-19",
		sleep: {
			startTime: "23:46"
		}
	};
});

test('calculate start time', t => {
	const res = dayModel;
});

test('bar', async t => {
	const bar = Promise.resolve('bar');

	t.is(await bar, 'bar');
});
