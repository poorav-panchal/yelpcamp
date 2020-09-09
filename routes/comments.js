const express = require("express");
const router = express.Router();
const middleware = require("../Middleware/index");

const Campground = require("../models/campground");
const Comment = require("../models/comment");

//===================================
//COMMENTS ROUTES
//===================================

//NEW COMMENT
router.get("/campgrounds/:id/comments/new", middleware.isLoggedIn, function(req, res){
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        }
        else{
            res.render("Comments/new", {campground: campground});
        }
    })
});

//CREATE COMMENT
router.post("/campgrounds/:id/comments", middleware.isLoggedIn, function(req, res){
    //find campground
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
            res.redirect("/campgrounds");
        }
        //create the comment
        Comment.create(req.body.comment, function(err, comment){
            if(err){
                req.flash("error", "Something went wrong");
                console.log(err);
            }
            else{
                //Add username and id to comment
                comment.author.id = req.user._id;
                comment.author.username = req.user.username;
                comment.save();
                //Add comment to campground
                campground.comments.push(comment);
                //save the comment
                campground.save();
                //redirect
                req.flash("success", "Added your comment");
                res.redirect("/campgrounds/" + campground._id);
            }
        })

    })

});

//EDIT COMMENT
router.get("/campgrounds/:id/comments/:comment_id/edit", middleware.checkCommentOwner, function(req, res){
    Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err){
            res.redirect("back");
        }
        else{
            res.render("Comments/edit", {campground_id: req.params.id, comment: foundComment});
        }
    });
});

//UPDATE COMMENT
router.put("/campgrounds/:id/comments/:comment_id", middleware.checkCommentOwner, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(err){
            res.redirect("back");
        }
        else{
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

//DELETE COMMENT
router.delete("/campgrounds/:id/comments/:comment_id", middleware.checkCommentOwner, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err, removedComment){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("back");
        }
        else{
            req.flash("success", "Comment deleted");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});


module.exports = router;