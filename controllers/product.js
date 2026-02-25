const Product = require('../model/product');

module.exports.getAllProducts = async (req,res)=>{
    const products = await Product.find({});
    res.render("products/showProduct" , {products});
};

module.exports.getDetails = async (req,res)=>{
    const product = await Product.findById(req.params.id).populate("seller");
    res.render("products/showDetails",{product});
};
