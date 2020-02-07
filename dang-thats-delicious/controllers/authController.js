const crypto = require('crypto')
const mongoose = require('mongoose');
const passport = require('passport');
const promisify = require('es6-promisify');
const User = mongoose.model('User');
const mail = require('../handlers/mailHandler');


exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'You are logged in!'
})

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out!');
  res.redirect('/')
}

exports.forgot = async (req, res) => {
  // 1. See if user with that email exists
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    req.flash('success', 'A password reset has been e-mailed to you');
    return res.redirect('/login')
  }
  // 2. Set reset token and expiry on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
  await user.save();
  // 3. Send them an email with the token
  const resetUrl = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  mail.send({
    user,
    subject: 'Password Reset Link',
    resetUrl,
    filename: 'password-reset'
  })
  req.flash('success', `A password reset has been e-mailed to you.`);
  // 4. Redirect to Login Page
  res.redirect('/login');
}


exports.reset = async (req, res) => {
  const user = await User.findOne({
    // 1. Does Someone Have This Token?
    resetPasswordToken: req.params.token,
    // 2. Is the token expired?
    resetPasswordExpires: { $gt: Date.now() }
  })
  // If there is no user and/or their token is expired
  if (!user) {
    req.flash('error', 'Password reset token invalid or expired')
    return res.redirect('/login')
  }
  // If everything is valid
  res.render('users/reset', { title: 'Reset Your Password' })
}

exports.update = async (req, res) => {
  const user = await User.findOne({
    // 1. Does Someone Have This Token?
    resetPasswordToken: req.params.token,
    // 2. Is the token expired?
    resetPasswordExpires: { $gt: Date.now() }
  })
  // If there is no user and/or their token is expired
  if (!user) {
    req.flash('error', 'Password reset token invalid or expired')
    return res.redirect('/login')
  }
  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);
  user.resetPasswordExpires = undefined;
  user.resetPasswordToken = undefined;
  const updatedUser = await user.save();
  await req.login(updatedUser);
  req.flash('success', 'Your password has been reset!');
  res.redirect('/');
}

//
// Middleware
//

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error', 'You must be logged in!');
  res.redirect('/login');
}

exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['confirm-password']) {
    return next();
  }
  req.flash('error', 'Passwords do not match!');
  res.redirect('back');
}
