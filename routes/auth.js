const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const Campground = require("../models/campground");
const async = require("async");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// This is the home page
router.get("/", function(req, res){
    res.render("landing");
});

//=================================
//AUTH ROUTES
//=================================

//Register Route
router.get("/register", function(req, res){
    res.render("register");
});

router.post("/register", function(req, res){
    let newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        avatar: req.body.avatar
    });
    if(req.body.adminCode === "mycode123"){
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            // req.flash("error", "ERROR");
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to YelpCamp " + user.username);
            res.redirect("/campgrounds");
        });
    });
});

//Login Route
router.get("/login", function(req, res){
    res.render("login");
});

router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login"
    }),
    function(req, res){

});

//Logout Route
router.get("/logout", function(req, res){
    req.logOut();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});

//User profile
router.get("/profile/:id", function(req, res){
    User.findById(req.params.id, function(err, user){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("/campgrounds");
        }
        else{
            Campground.find().where("author.id").equals(user._id).exec(function(err, allCampgrounds){
                if(err){
                    req.flash("error", "Something went wrong");
                    res.redirect("/campgrounds");
                }
                else{
                    res.render("User/profile", {user: user, campgrounds: allCampgrounds});
                }
            })
        }
    })
});

router.get("/forgot", function(req, res){
    res.render("Password/forgot");
});

router.post("/forgot", function(req, res, next){
    async.waterfall([
        function(done){
            crypto.randomBytes(20, function(err, buf){
                let token = buf.toString("hex");
                done(err, token);
            });
        },
        function(token, done){
            User.findOne({email: req.body.email}, function(err, user){
                if(!user){
                    req.flash("error", "No account with that email address exists");
                    return res.redirect("/forgot");
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; //1hr

                user.save(function(err){
                    done(err, token, user);
                });
            });
        },
        function(token, user, done){
            let smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth:{
                    user: "poorav.panchal8@gmail.com",
                    pass: "PooravLynx"
                }
            });
            let mailOptions = {
                to: user.email,
                from: "poorav.panchal8@gmail.com",
                subject: "YelpCamp Password Reset",
                text: "You are receiving this because you have requested the reset of the password for your YelpCamp account." + 
                "Please click on the following link or paste this into your browser to complete the process." + 
                "https://" + req.headers.host + "/reset/" + token + "\n\n" + 
                "If you did not request this, please ignore this email and your password will remain unchanged"           
            };
            smtpTransport.sendMail(mailOptions, function(err){
                console.log("mail sent");
                req.flash("success", "An email has to " + user.email + " with further instructions.");
                done(err, "done");
            });
        }
    ], function(err){
        if(err){
            return next(err);
        }
        else{
            res.redirect("/forgot");
        }
    });
});

router.get('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('/forgot');
      }
      res.render('reset', {token: req.params.token});
    });
});

router.post('/reset/:token', function(req, res) {
    async.waterfall([
      function(done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
          }
          if(req.body.password === req.body.confirm) {
            user.setPassword(req.body.password, function(err) {
              user.resetPasswordToken = undefined;
              user.resetPasswordExpires = undefined;
  
              user.save(function(err) {
                req.logIn(user, function(err) {
                  done(err, user);
                });
              });
            })
          } else {
              req.flash("error", "Passwords do not match.");
              return res.redirect('back');
          }
        });
      },
      function(user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            user: 'poorav.panchal8@gmail.com',
            pass: "PooravLynx"
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'poorav.panchal8@gmail.com',
          subject: 'Your password has been changed',
          text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          req.flash('success', 'Success! Your password has been changed.');
          done(err);
        });
      }
    ], function(err) {
      res.redirect('/campgrounds');
    });
  });




module.exports = router;