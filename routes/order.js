const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order');
const {isLoggedIn} = require('../middleware');

router.get("/checkout", isLoggedIn, orderController.getCheckout);

router.post("/checkout" , isLoggedIn, orderController.postCheckout);

router.get("/showOrders", isLoggedIn, orderController.showOrders);

router.get("/:id" , isLoggedIn, orderController.getAddToCart);

router.post("/:id", isLoggedIn, orderController.postAddToCart);

router.post("/decrease/:id" , isLoggedIn, orderController.decreaseItem);

router.post("/increase/:id", isLoggedIn, orderController.increaseItem);

router.post("/remove/:id", isLoggedIn, orderController.removeItem);



module.exports = router;