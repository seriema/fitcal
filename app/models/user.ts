import { Document, Schema, model } from 'mongoose';
import { compareSync, genSaltSync, hashSync } from 'bcrypt-nodejs';

export interface IUser {
    local            : {
        email        : string,
        password     : string,
    },
    facebook         : {
        id           : string,
        token        : string,
        email        : string,
        name         : string
    },
    fitbit           : {
        id           : string,
        token        : string,
        name         : string
    }
};

// define the schema for our user model

export var UserSchema: Schema = new Schema({
    local            : {
        email        : String,
        password     : String,
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

// checking if password is valid
UserSchema.methods.validPassword = function(password:string) {
    return compareSync(password, this.local.password);
};


export interface IUserModel extends IUser, Document {
  generateHash(password:string): string;
  validPassword(password:string): boolean;
}

// create the model for users and expose it to our app
export const User = model<IUserModel>('User', UserSchema);
