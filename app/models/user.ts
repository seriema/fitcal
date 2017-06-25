/* eslint key-spacing: ["off"] */

import { Document, Schema, model } from 'mongoose';
import { genSaltSync, hashSync } from 'bcrypt-nodejs';
import { site as siteConfig } from './../../config/site';
import * as shortid from 'shortid';

export interface IUser {
	app: {
		userId       : string;
	};
	facebook         : {
		id           : string;
		token        : string;
		email        : string;
		name         : string;
    };
	fitbit           : {
		id           : string;
		token        : string;
		name         : string;
	};
};

// define the schema for our user model

export var UserSchema: Schema = new Schema({
	app: {
		userId       : { type: String, default: shortid.generate() }
	},
	facebook         : {
		id           : String,
		token        : String,
		email        : String,
		name         : String
	},
	fitbit           : {
		id           : String,
		token        : String,
		name         : String
	}
});

// methods ======================
// generating a hash
UserSchema.methods.generateHash = function(password:string) {
	var salt = genSaltSync(8);
	return hashSync(password, salt);
};

UserSchema.methods.calendarUrl = function () {
	return `${siteConfig.domain}/calendar/${this.app.userId}`;
};


export interface IUserModel extends IUser, Document {
	generateHash(password:string): string;
	calendarUrl(): string;
}

// create the model for users and expose it to our app
export const User = model<IUserModel>('User', UserSchema);
