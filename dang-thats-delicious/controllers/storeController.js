// exports.myMiddleware = (req, res, next) => {
//   req.name = 'Wes';
//   res.cookie('name', 'FrankisCool', { maxAge: 900000 });
//   next();
// }
const mongoose = require("mongoose");
const Store = mongoose.model("Store");
const User = mongoose.model("User");
const multer = require("multer");
const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(_, file, next) {
    const isPhoto = file.mimetype.startsWith("image/");
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: `Please upload a valid image file!` }, false);
    }
  }
};
const jimp = require("jimp");
const uuid = require("uuid");

exports.homePage = (_, res) => {
  res.render("index");
};

exports.addStore = (_, res) => {
  res.render("editStore", { title: "Add Store" });
};
exports.editStore = async (req, res) => {
  // 1. Find the store
  const store = await Store.findOne({ _id: req.params.id });
  // 2. confirm they own the store
  // confirmOwner(store, req, res);
  if (!store.author.equals(req.user._id)) {
    req.flash("error", "You must own a store to edit it!");
    return res.redirect("/stores");
  }
  // 3. Render edit form
  res.render("editStore", { title: `Edit ${store.name}`, store });
};

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
  req.body.author = req.user._id;
  const store = await new Store(req.body).save();
  req.flash(
    "success",
    `Successfully Created ${store.name}! Care to leave a review?`
  );
  res.redirect(`/store/${store.slug}`);
};

exports.updateStore = async (req, res) => {
  // 0. Set location data to be a point
  req.body.location.type = "Point";
  // 1. Find and Update The Store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // Return the updated store instead of the old
    runValidators: true
  }).exec();
  req.flash(
    "success",
    `Successfully Updated ${store.name}! <a href="/stores/${store.slug}">View Store →</a>`
  );
  res.redirect(`/stores/${store._id}/edit`);
};

exports.getStores = async (req, res) => {
  const page = req.params.page || 1;
  const limit = 4;
  const skip = page * limit - limit;
  // 1. Query the DB for a list of all stores
  const storesPromise = Store.find()
    .skip(skip)
    .limit(limit)
    .sort({ created: "desc" });
  const countPromise = Store.count();
  const [stores, count] = await Promise.all([storesPromise, countPromise]);
  const pages = Math.ceil(count / limit);

  if (!stores.length && skip) {
    req.flash(
      "info",
      `Hey! You asked for page ${page}. But that page doesn't exist! So now you're on page ${pages}`
    );
    res.redirect(`/stores/page/${pages}`);
    return;
  }

  res.render("stores", { title: "Stores", stores, count, page, pages });
};

exports.getStoreBySlug = async (req, res, next) => {
  // 1. Query the DB for the store
  const store = await Store.findOne({ slug: req.params.slug }).populate(
    "author reviews"
  );
  if (!store) {
    return next();
  } else {
    res.render("store", { title: store.name, store });
  }
};

exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true };
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
  // res.json(result)
  // res.json(tags);
  // res.send('it works!');
  res.render("tags", { title: tag || "Tags", tags, tag, stores });
};

exports.mapPage = async (req, res) => {
  res.render("map", {
    title: "Map"
  });
};

exports.getHearts = async (req, res) => {
  const stores = await Store.find({
    _id: { $in: req.user.hearts }
  });
  res.render("stores", { title: "Hearted Stores", stores });
};

exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores();
  res.render("topStores", { title: "Top Stores", stores });
};

//
// API Controller Routes
//

exports.searchStores = async (req, res) => {
  const stores = await Store.find(
    {
      $text: {
        $search: req.query.q
      }
    },
    { score: { $meta: "textScore" } }
  )
    .sort({
      score: { $meta: "textScore" }
    })
    .limit(5);
  res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const query = {
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates
        },
        $maxDistance: 10000 // Meters
      }
    }
  };
  const stores = await Store.find(query)
    .select("location name slug description photo")
    .limit(10);
  res.json(stores);
};

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());
  const operator = hearts.includes(req.params.id) ? "$pull" : "$addToSet";
  const user = await User.findByIdAndUpdate(
    // Find user by id
    req.user._id,
    // Perform update operation
    { [operator]: { hearts: req.params.id } },
    { new: true }
  );
  res.json(user);
};

//
// Middlewares
//

exports.upload = multer(multerOptions).single("photo");

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
};

//
// Helpers
//
