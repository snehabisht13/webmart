const User = require('./model/user');
const Seller = require('./model/seller');




module.exports.isLoggedIn = (req,res,next)=>{
    if (!req.session.userId){
        req.flash("error", "user must be logged in");
        return res.redirect("/user/login");
    }
    next();
};


