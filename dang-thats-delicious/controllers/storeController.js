// exports.myMiddleware = (req, res, next) => {
//   req.name = 'Wes';
//   res.cookie('name', 'FrankisCool', { maxAge: 900000 });
//   next();
// }
const mongoose = require('mongoose');
const Store = mongoose.model('Store');

exports.homePage = (_, res) => {
  res.render('index')
}

exports.addStore = (_, res) => {
  res.render('editStore', { title: 'Add Store' })
}

exports.createStore = async (req, res) => {
  // store
  //   .save()
  //   .then(store => {
  //     res.json(store)
  //   })
  //   .catch(err => {
  //     throw Error(err);
  //   })
  // try {
  //   const store = new Store(req.body);
  //   await store.save();
  //   console.log('it worked!')
  // } catch (err) {
  //   throw new Error(err);
  // }
  const store = new Store(req.body);
  await store.save();
  console.log('it worked!')
  res.redirect('/');
}
