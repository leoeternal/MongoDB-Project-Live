const express = require("express");
const User = require("../models/UserModel");
const Post=require("../models/PostModel");
const router = new express.Router();
const auth = require("../src/middleware/auth");

router.get("/addpost",auth,(req,res)=>{
    res.render("addpost.ejs");
})

router.post("/addpost",auth,async(req,res)=>{
    try{
        const user={
            id:req.user._id,
            firstname:req.user.firstname,
            email:req.user.email
        };
        const postCreated=new Post({
            title:req.body.title,
            body:req.body.desc,
            createdAt:new Date(),
            user:user
        });
        const postSaved=await postCreated.save();
        res.status(201).redirect("/");
    }catch(error){
        res.status(401).send(error);
    }
})

router.get("/like/:postid",auth,async(req,res)=>{
    try{
        const user={
            id:req.user._id,
            firstname:req.user.firstname
        };
        var updatedPost=await Post.findByIdAndUpdate({_id:req.params.postid},{$inc:{'likeCount':1},$push:{"likePersons":user}});
        res.status(201).redirect("/");
    }catch(error){
        res.status(401).send(error);
    }
})

router.get("/dislike/:postid",auth,async(req,res)=>{
    try{
        var updatedPost=await Post.findByIdAndUpdate({_id:req.params.postid},{$inc:{'likeCount':-1}});
        var findPost=await Post.findById({_id:req.params.postid});
        findPost.likePersons=findPost.likePersons.filter((person)=>{
            return person.id.toString()!==req.user._id.toString()
        });
        await findPost.save();
        res.status(201).redirect("/");
    }catch(error){
        res.status(401).send(error);
    }
})

router.get("/viewpost/:postid",auth,async(req,res)=>{
    try{
        const findPost=await Post.findById({_id:req.params.postid});
        res.status(201).render("postinfo.ejs",{findPost:findPost,userDetails:req.user});
    }catch(error){
        res.status(401).send(error);
    }
})

router.post("/comment/:postid",auth,async(req,res)=>{
    const data={
        id:req.user._id,
        firstname:req.user.firstname,
        comment:req.body.comment
    };
    try{
        const postFind=await Post.findByIdAndUpdate({_id:req.params.postid},{$push:{"comments":data}});
        res.status(201).redirect("/viewpost/"+req.params.postid);
    }catch(error){
        res.status(401).send(error);
    }
})

router.get("/delete/:postid",auth,async(req,res)=>{
    try{
        const postDeleted=await Post.findByIdAndDelete({_id:req.params.postid});
        res.status(201).redirect("/profile");
    }catch(error){
        res.status(401).send(error);
    }
})

module.exports=router;