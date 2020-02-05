// exports.myMiddleware = (req, res, next) => {
//   req.name = 'Wes';
//   res.cookie('name', 'FrankisCool', { maxAge: 900000 });
//   next();
// }
const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(_, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: `Please upload a valid image file!` }, false);
    }
  }
}
const jimp = require('jimp');
const uuid = require('uuid');

exports.homePage = (_, res) => {
  res.render('index')
}

exports.addStore = (_, res) => {
  res.render('editStore', { title: 'Add Store' })
}
exports.editStore = async (req, res) => {
  // 1. Find the store
  const store = await Store.findOne({ _id: req.params.id });
  // 2. confirm they own the store
  // * TODO
  // 3. Render edit form
  res.render('editStore', { title: `Edit ${store.name}`, store })
}

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // check for file
  if (!req.file) {
    return next();
  }
  const extension = req.file.mimetype.split("/")[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // Now we resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  // After resizing, keep going
  next();
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
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully Created ${store.name}! Care to leave a review?`);
  res.redirect(`/store/${store.slug}`);
}
exports.updateStore = async (req, res) => {
  // 0. Set location data to be a point
  req.body.location.type = 'Point';
  // 1. Find and Update The Store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // Return the updated store instead of the old
    runValidators: true
  }).exec();
  req.flash('success', `Successfully Updated ${store.name}! <a href="/stores/${store.slug}">View Store →</a>`);
  res.redirect(`/stores/${store._id}/edit`);
}

exports.getStores = async (req, res) => {
  // 1. Query the DB for a list of all stores
  const stores = await Store.find();
  res.render('stores', { title: 'Stores', stores });
}


exports.getStoreBySlug = async (req, res, next) => {
  // 1. Query the DB for the store
  const store = await Store.findOne({ slug: req.params.slug });
  if (!store) {
    return next();
  } else {
    res.render('store', { title: store.name, store });
  }
}
