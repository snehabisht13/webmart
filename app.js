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
const user = require('./model/user');

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