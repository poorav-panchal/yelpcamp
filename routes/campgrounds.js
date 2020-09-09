const express = require("express");
const router = express.Router();
const middleware = require("../Middleware/index");

const Campground = require("../models/campground");
const Comment = require("../models/comment");
const User = require("../models/user");

//========================
//CAMPGROUNDS ROUTES
//========================

//shows all campgrounds
router.get("/campgrounds", function(req, res){
    //Get campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
        if(err){
            console.log(err);
        }
        else{
            res.render("Campgrounds/campgrounds", {campgrounds:allCampgrounds});
        }
    });
});


//CAMPGROUNDS - posts info to all campgrounds
router.post("/campgrounds", middleware.isLoggedIn, function(req, res){
    let name = req.body.name;
    let price = req.body.price;
    let image = req.body.image;
    let description = req.body.description;
    let author = {
        id: req.user._id,
        username: req.user.username
    }
    let newCampground = {
        name: name, 
        price: price,
        image: image, 
        description: description, 
        author: author
    }
    //Add new Campground to Database
    Campground.create(newCampground, function(err, newCreated){
        if(err){
            console.log(err);
        }
        else{
            //Redirect to All campgrounds page
            res.redirect("/campgrounds");
        }
    })
});


//NEW - create a new campground
router.get("/campgrounds/new", middleware.isLoggedIn, function(req, res){
    res.render("Campgrounds/new");
});


//SHOW - shows more information on the campground
router.get("/campgrounds/:id", function(req, res){
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        }
        else{
            //render the show page
            res.render("Campgrounds/show", {campground: foundCampground});
        }
    })
});

//Edit Campground
router.get("/campgrounds/:id/edit", middleware.checkCampgroundOwner, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
    res.render("Campgrounds/edit", {campground: foundCampground});
    });
});

//Update Campground
router.put("/campgrounds/:id", middleware.checkCampgroundOwner, function(req, res){
    //Find and update the campground
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
        if(err){
            res.redirect("/campgrounds");
        }
        else{
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

//Destroy Campground
router.delete("/campgrounds/:id", middleware.checkCampgroundOwner, function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err, removedCampground){
        if(err){
            console.log(err);
        }
        else{
            Comment.deleteMany( {_id: { $in: removedCampground.comments}}, (err)=>{
                if(err){
                    console.log(err);
                }
                else{
                    res.redirect("/campgrounds");
                }
            });
            
        }
    });
});

module.exports = router;