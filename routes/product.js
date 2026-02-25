const express = require('express');
const router = express.Router();
const productController = require('../controllers/product');
const {isLoggedIn} = require('../middleware');

router.get("/index", isLoggedIn, productController.getAllProducts );

router.get("/details/:id", isLoggedIn,productController.getDetails);

module.exports = router;