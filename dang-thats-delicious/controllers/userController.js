const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

//
// Page Controllers
//

exports.account = (req, res) => {
  res.render('users/account', { title: 'My Account' });
}

exports.loginForm = (_, res) => {
  res.render('users/login', { title: 'Login' });
}
exports.registerForm = (_, res) => {
  res.render('users/register', { title: 'Register' });
}

//
// Middlewares
//

exports.validateRegister = (req, res, next) => {
  // This comes from Express Validator that lives in our app.js
  req.sanitizeBody('name');
  req.checkBody('name', 'You must supply a name!').notEmpty();
  req.checkBody('email', 'That Email is not valid!').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  });
  req.checkBody('password', 'Password Cannot Be Blank!').notEmpty();
  req.checkBody('confirm-password', 'Confirmed Password Cannot Be Blank!').notEmpty();
  req.checkBody('confirm-password', 'Oops! Your passwords do not match!').equals(req.body.password);
  const errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('users/register', { title: 'Register', body: req.body, flashes: req.flash() });
    return;
  }
  next();
}

exports.register = async (req, res, next) => {
  const user = new User({
    email: req.body.email,
    name: req.body.name
  });
  const registerWithPromise = promisify(User.register, User);
  await registerWithPromise(user, req.body.password);
  next();


  // User.register(user, req.body.password, function (err, user) {

  // });
}

exports.updateAccount = async (req, res, next) => {
  const updates = {
    name: req.body.name,
    email: req.body.email
  }

  const user = await User.findOneAndUpdate(
    // Query
    {
      _id: req.user._id
    },
    // Update
    {
      $set: updates
    },
    // Options
    {
      new: true,
      runValidators: true,
      context: 'query'
    }
  )
  req.flash('success', 'Profile Updated!');
  res.redirect('back');
}
