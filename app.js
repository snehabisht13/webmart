const path=  require('path');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const ejsMate =  require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');
const User = require('./model/user');
const Seller = require('./model/seller');
const Product = require('./model/product');
const methodOverride = require('method-override');
const Cart = require('./model/cart');
const Order = require('./model/order');
const userRouter = require('./routes/user');
const orderRouter = require('./routes/order');
const productRouter = require('./routes/product');
const sellerRouter = require('./routes/seller');

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

app.use(flash());
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});


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

//routes
app.use("/user", userRouter); 
app.use("/cart", orderRouter);
app.use("/show", productRouter);
app.use("/seller", sellerRouter);






