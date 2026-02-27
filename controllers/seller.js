const Seller = require('../model/seller');
const Product = require('../model/product');
const Order = require('../model/order');
const mongoose = require('mongoose');

module.exports.getSellerProfile = async(req,res)=>{
    const sellerId = req.params.id;
    const seller = await Seller.findOne({user: sellerId}).populate("user");
    console.log(seller);

    res.render("sellers/profile" , {seller});
};

module.exports.updateSellerProfile =  async (req, res) => {
    try {
        const ownerId = req.params.id;

        const seller = await Seller.findOne({ user: ownerId });
        console.log(seller);

        if (seller) {
            // UPDATE EXISTING SELLER
            seller.shopName = req.body.shopName;
            seller.phone = req.body.phone;
            seller.address = req.body.address;

            await seller.save();
            
        } else {
            // CREATE NEW SELLER
            await Seller.create({
                user: ownerId,
                shopName: req.body.shopName,
                phone: req.body.phone,
                address: req.body.address 
            });
        }
        req.flash("success","Updated profile");
        res.redirect(`/seller/profile/${ownerId}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

module.exports.getAddProducts =  (req,res)=>{
    res.render("sellers/addproduct");
};

module.exports.postAddproduct =  async(req,res)=>{
    const userId = req.params.id;
    const sellerId = (await Seller.findOne({user: userId}))?._id;
    console.log(sellerId);

    const newProduct = new Product({
        name: req.body.name,
        description: req.body.description,
        price:req.body.price,
        stock:req.body.stock,
        category:req.body.category,
        images:req.body.image,
        seller: sellerId
    });

    await newProduct.save();
    req.flash("success","Product added successfully");
    res.redirect(`/seller/my_products/${userId}`);
};

module.exports.getAllMyProducts = async(req,res)=>{
    const sellerId = (await Seller.findOne({user: req.params.id}))?._id;
    const products = await Product.find({seller: sellerId});
    res.render("sellers/allProducts", {products});
};


module.exports.myOrders = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.session.userId);

    // 1️⃣ Find seller using logged-in user
    const seller = await Seller.findOne({ user: userId });

    if (!seller) {
      return res.render("sellers/myOrders", { orders: [] });
    }

    // 2️⃣ Find products of that seller
    const sellerProducts = await Product.find({ seller: seller._id });

    const productIds = sellerProducts.map(p => p._id);

    // 3️⃣ Find orders containing those products
    const orders = await Order.find({
      "items.product": { $in: productIds }
    })
      .populate("items.product")
      .populate("user");

    res.render("sellers/myOrders", { orders });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};