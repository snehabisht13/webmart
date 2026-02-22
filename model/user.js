const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    role: {
        type: String,
        enum: ["customer" , "seller"],
        default: "customer"
    }
});
module.exports = new mongoose.model("User", userSchema);