const Cart = require('../model/cart');
const Product = require('../model/product');
const Order = require('../model/order');

module.exports.getAddToCart = async (req,res)=> {
    const cart = await Cart.findOne({user: req.session.userId}).populate("items.product");
    res.render("orders/cart", {cart});
};

 module.exports.postAddToCart = async (req, res) => {
  const productId = req.params.id;
  const userId = req.session.userId;

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).send("Product not found");
  }

  let cart = await Cart.findOne({ user: userId });

  // CREATE CART IF NOT EXISTS
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [], totalQuantity: 0, totalPrice: 0 });
  }

  // FIND PRODUCT IN CART
  const itemIndex = cart.items.findIndex(
    item => item.product.toString() === productId
  );

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += 1;
  } else {
    cart.items.push({
      product: productId,
      quantity: 1,
      priceAtAdd: product.price
    });
  }

  cart.totalQuantity += 1;
  cart.totalPrice += product.price;

  await cart.save();
  res.redirect(`/cart/${userId}`);
};


module.exports.decreaseItem = async (req, res) => {
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) return res.redirect(`/cart/${req.session.userId}`);

    const cart = await Cart.findOne({ user: req.session.userId })
        .populate("items.product");

    if (!cart) return res.redirect(`/cart/${req.session.userId}`);

    const itemIndex = cart.items.findIndex(item =>
        item.product._id.toString() === productId
    );

    if (itemIndex > -1) {
        cart.items[itemIndex].quantity -= 1;
        cart.totalQuantity -= 1;
        cart.totalPrice -= product.price;

        // Remove item if quantity becomes 0
        if (cart.items[itemIndex].quantity <= 0) {
            cart.items.splice(itemIndex, 1);
        }
    }

    // Safety checks
    cart.totalQuantity = Math.max(cart.totalQuantity, 0);
    cart.totalPrice = Math.max(cart.totalPrice, 0);

    await cart.save();
    res.redirect(`/cart/${req.session.userId}`);
};


module.exports.increaseItem =  async (req,res)=>{
    const productId = req.params.id;
    const userId = req.session.userId;
    const product = await Product.findById(productId);
    if (!product) return res.redirect(`/cart/${req.session.userId}`);

    const cart = await Cart.findOne({ user: req.session.userId })
        .populate("items.product");

    if (!cart) return res.redirect(`/cart/${req.session.userId}`);

    const itemIndex = cart.items.findIndex(item =>
        item.product._id.toString() === productId
    );

    if (itemIndex > -1) {
        cart.items[itemIndex].quantity += 1;
        cart.totalQuantity += 1;
        cart.totalPrice += product.price;
    }

    await cart.save();
    res.redirect(`/cart/${req.session.userId}`);

};

module.exports.removeItem = async (req, res) => {
    const productId = req.params.id;
    const userId = req.session.userId;

    const product = await Product.findById(productId);
    if (!product) return res.redirect(`/cart/${userId}`);

    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart) return res.redirect(`/cart/${userId}`);

    const itemIndex = cart.items.findIndex(item =>
        item.product._id.toString() === productId
    );

    if (itemIndex > -1) {
        const item = cart.items[itemIndex];

        // Update totals correctly
        cart.totalQuantity -= item.quantity;
        cart.totalPrice -= item.quantity * product.price;

        // Remove item completely
        cart.items.splice(itemIndex, 1);
    }

    // Safety checks
    cart.totalQuantity = Math.max(cart.totalQuantity, 0);
    cart.totalPrice = Math.max(cart.totalPrice, 0);

    await cart.save();
    req.flash("error", "Removed item ");
    res.redirect(`/cart/${userId}`);
};

// order booking
module.exports.getCheckout =  async (req,res)=>{
    const cart = await Cart.findOne({user: req.session.userId}).populate("items.product");
    res.render("orders/userDetails",{cart});
};

module.exports.postCheckout =  async (req,res)=>{
    const userId = req.session.userId;
    const {address , phone} = req.body;
    const cart = await Cart.findOne({user: userId}).populate("items.product");

    const order = new Order({
        user: req.session.userId,
        items: cart.items,
        totalPrice: cart.totalPrice,
        address: address,
        phone_no: phone,
    });

    await order.save();
    await Cart.findOneAndDelete({ user: userId });
    req.flash("success","Order booked");
    res.redirect("/cart/showOrders");
};

module.exports.showOrders = async(req,res)=>{
    const orders = await Order.find({user: req.session.userId})
    .populate("items.product").populate("user").sort({createdAt: -1});

    res.render("orders/userOrders", {orders});
};
