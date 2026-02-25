const User = require("../model/user");
const bcrypt = require('bcryptjs');
// Authentication

module.exports.getLogin =  (req,res)=>{
    res.render("users/login.ejs");
};

module.exports.getSignup = (req,res)=>{
    res.render("users/signup.ejs");
};

// signup post
module.exports.postSignup =  async(req,res)=>{
    const hashedPassword = await bcrypt.hash(req.body.password,10);
    const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        role: req.body.role
    });
    await newUser.save();
    req.session.userId = newUser._id;
    req.flash("success", "Signed up successfully");
    res.redirect("/");
};

module.exports.postLogin =  async(req,res)=>{
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
    req.flash("success", "Signed in successfully");
    res.redirect("/");
};


module.exports.postLogout =  (req,res)=>{
    req.session.destroy();
    res.redirect("/user/login");
};
