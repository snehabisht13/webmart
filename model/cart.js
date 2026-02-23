const mongoose = require("mongoose");
const product = require("./product");

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    quantity: {type: Number, required: true},
    priceAtAdd: Number 
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    items: [cartItemSchema],
    totalQuantity: Number,
    totalPrice: Number
});

module.exports = new mongoose.model("Cart", cartSchema);