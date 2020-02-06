const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const { catchErrors } = require('../handlers/errorHandlers')


router.get('/', catchErrors(storeController.getStores));

router.get('/stores', catchErrors(storeController.getStores));
router.get(`/stores/:id/edit`, catchErrors(storeController.editStore))
router.get(`/store/:slug`, catchErrors(storeController.getStoreBySlug));

router.get('/add', storeController.addStore);
router.post('/add',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.createStore)
);

router.post('/add/:id',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.updateStore)
);

router.get('/tags', storeController.getStoresByTag);
router.get('/tags/:tag', storeController.getStoresByTag);

router.get('/login', userController.loginForm);

router.get('/register', userController.registerForm)

router.post('/register',
  // 1. Validate the registration data
  userController.validateRegister,
  // 2. register the user
  catchErrors(userController.register),
  // 3. we need to log them in
  authController.login
)






module.exports = router;

// router.get('/', storeController.myMiddleware, storeController.homePage);
/*
// We get the __req__ (request) which is full information about the request coming in
// We use the __res__ (response) to tell it what to send back
router.get('/', (req, res) => {
  console.log('hey!');
  const frank = { name: 'Frank' }
  // Only send one response
  // res.send('Hey! It works!');
  res.json(frank)
});

router.get('/reverse/:name', (req, res) => {
  const name = req.params.name;
  const reverseName = [...name].reverse().join('');
  res.send(reverseName)
});
*/

// router.get('/', (req, res) => {
//   res.render('hello', {
//     name: 'Frank',
//     dog: req.query.dog,
//     title: 'Home'
//   })
// })
