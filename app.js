const path=  require('path');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const ejsMate =  require('ejs-mate');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const User = require('./model/user');
const Seller = require('./model/seller');
const Product = require('./model/product');
const methodOverride = require('method-override');
const Cart = require('./model/cart');
const Order = require('./model/order');

app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views')); //to access the dir from outside 
app.use(express.urlencoded({ extended: true })); //to parse 
app.engine("ejs", ejsMate); // to use ejs files 
app.use(express.static(path.join(__dirname, "/public"))); // for static files
app.use(methodOverride("_method"));
app.use(express.json());

app.use(session({
    secret: "mysecret",
    resave: false,
    saveUninitialized: false
}));

app.use(async (req,res,next)=>{
    if(req.session.userId){
        res.locals.currUser = await User.findById(req.session.userId);
    }
    else{
        res.locals.currUser = null;
    }
    next();
});


mongoose.connect("mongodb://127.0.0.1:27017/webmart")
.then(() => console.log("Connected to mongodb"))
.catch((err) => console.log(err));


app.listen(3000, ()=>{
    console.log("App is listening to http://localhost:3000/");
});

app.get("/", (req,res)=>{
    res.render("home.ejs");
});

// Authentication

app.get("/login", (req,res)=>{
    res.render("login.ejs");
});

app.get("/signup", (req,res)=>{
    res.render("signup.ejs");
});

// signup post
app.post("/signup", async(req,res)=>{
    const hashedPassword = await bcrypt.hash(req.body.password,10);
    const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        role: req.body.role
    });
    await newUser.save();
    req.session.userId = newUser._id;
    res.redirect("/");
});

app.post("/login", async(req,res)=>{
    const email= req.body.email;
    const password = req.body.password;
    const ExistUser = await User.findOne({email:email});
    
    if(!ExistUser){
        return res.status(400).send("User not found");
    }
    const isMatch = await bcrypt.compare(password , ExistUser.password);

    if(!isMatch){
        return res.status(400).send("password doesn't match");
    };
    req.session.userId = ExistUser._id;
    res.redirect("/");
});


app.get("/logout", (req,res)=>{
    req.session.destroy();
    res.redirect("/login");
});


app.get("/sellerProfile/:id",async(req,res)=>{
    const sellerId = req.params.id;
    const seller = await Seller.findOne({user: sellerId}).populate("user");
    console.log(seller);

    res.render("profile" , {seller});
});


app.post("/profile/update/:id", async (req, res) => {
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

        res.redirect(`/sellerProfile/${ownerId}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

app.get("/add_product" , (req,res)=>{
    res.render("addproduct");
});

app.post("/add_product/:id", async(req,res)=>{
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
    res.redirect("/show");
});

app.get("/show",async (req,res)=>{
    const products = await Product.find({});
    res.render("showProduct" , {products});
});

app.get("/showDetails/:id" ,async (req,res)=>{
    const product = await Product.findById(req.params.id).populate("seller");
    res.render("showDetails",{product});
});

app.get("/my_products/:id", async(req,res)=>{
    const sellerId = (await Seller.findOne({user: req.params.id}))?._id;
    const products = await Product.find({seller: sellerId});
    res.render("allProducts", {products});
});


app.get("/cart/:id" ,async (req,res)=> {
    const cart = await Cart.findOne({user: req.session.userId}).populate("items.product");
    res.render("cart", {cart});
});

app.post("/addToCart/:id", async (req, res) => {
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
});


app.post("/cart/decrease/:id", async (req, res) => {
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
});


app.post("/cart/increase/:id", async (req,res)=>{
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

});

app.post("/cart/remove/:id", async (req, res) => {
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
    res.redirect(`/cart/${userId}`);
});

app.get("/checkout", async (req,res)=>{
    const cart = await Cart.findOne({user: req.session.userId}).populate("items.product");
    res.render("userDetails",{cart});
});

app.post("/checkout", async (req,res)=>{
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
    
    res.redirect("/");
});

