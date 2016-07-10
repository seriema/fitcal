import mongoose = require('mongoose');
import bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
let userSchema : mongoose.Schema = new mongoose.Schema({

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
userSchema.methods.generateHash = function(password:string) {
    var salt = bcrypt.genSaltSync(8);
    return bcrypt.hashSync(password, salt);
};

// checking if password is valid
userSchema.methods.validPassword = function(password:string) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
let x = mongoose.model('User', userSchema);
export { x };