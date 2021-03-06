//PACKAGES
// require("dotenv").config()

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const methodOverride = require("method-override");

//MODELS
const Campground = require("./models/campground");
const Comment = require("./models/comment");
const User = require("./models/user");
const seedDB = require("./seeds");

const campgroundRoutes = require("./routes/campgrounds");
const commentRoutes = require("./routes/comments");
const authRoutes = require("./routes/auth");


//WHEN USING ONE DATABASE, COMMENT THE OTHER ONE OUT

//==========================================================
// WHEN USING LOCAL SERVER
mongoose.connect("mongodb://localhost/yelpCamp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
})
.then(() => console.log("Connected to DB!"))
.catch(error => console.log(error.message));
//===========================================================


//==========================================================
// WHEN USING DEPLOYED SERVER
// mongoose.connect("mongodb+srv://Poorav:PooravLynx@cluster0.7eqg5.mongodb.net/Cluster0?retryWrites=true&w=majority", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     useCreateIndex: true
// })
// .then(() => console.log("Connected to DB!"))
// .catch(error => console.log(error.message));
//===========================================================



app.use(bodyParser.urlencoded({extended: true}));

app.use(methodOverride("_method"));

app.set("view engine", "ejs");

app.use(flash());

app.use(express.static(__dirname + "/public"));

app.locals.moment = require("moment");

//seed the Database
// seedDB();

//PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Poorav Panchal",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
})

app.use(campgroundRoutes);
app.use(commentRoutes);
app.use(authRoutes);






//tell express to listen for requests
let port = process.env.PORT || 3000;
app.listen(port, function(){
	console.log("YelpCamp server has started!");
});








