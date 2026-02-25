const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/seller');
const {isLoggedIn} = require('../middleware');


router.get("/profile/:id", isLoggedIn,sellerController.getSellerProfile);

router.post("/profile/update/:id",isLoggedIn, sellerController.updateSellerProfile);

router.get("/add_product", isLoggedIn,sellerController.getAddProducts );

router.post("/add_product/:id", isLoggedIn,sellerController.postAddproduct);

router.get("/my_products/:id", isLoggedIn, sellerController.getAllMyProducts);

router.get("/myOrders/:id",isLoggedIn, sellerController.myOrders);

module.exports = router;