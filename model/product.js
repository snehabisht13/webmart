const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seller",
        required: true
    },
    category: {
        type: String,
        enum: ["Electronics", "Fashion", "Home" , "Beauty","Books"]
    },
    images: [String]
});
console.log("created");

module.exports = new mongoose.model("Product", productSchema);