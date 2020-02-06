const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
  email: {
    lowercase: true,
    required: 'Please enter your email address!',
    trim: true,
    type: String,
    unique: true,
    validate: [
      validator.isEmail, 'Invalid Email Address'
    ]
  },
  name: {
    required: 'Please supply a name',
    trim: true,
    type: String,
  }
})

userSchema.virtual('gravatar').get(function () {
  const hash = md5(this.email);
  return `https://gravatar.com/avatar/${hash}?s=200`;
})

// Pass off Authentication to Passport http://www.passportjs.org/
userSchema.plugin(passportLocalMongoose, {
  usernameField: 'email'
});
userSchema.plugin(mongodbErrorHandler)


module.exports = mongoose.model('User', userSchema);
