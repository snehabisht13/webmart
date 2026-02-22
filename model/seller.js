
const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    shopName: String,
    phone: String,
    address: String,

});

module.exports = new mongoose.model("Seller", sellerSchema);