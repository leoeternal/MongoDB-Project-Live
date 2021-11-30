const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/UserModel");
const Post=require("../models/PostModel");
const router = new express.Router();
const auth = require("../src/middleware/auth");
const crypto=require("crypto");
const path=require("path");
const mongoose=require("mongoose");
const multer=require("multer");
const {GridFsStorage}=require("multer-gridfs-storage");
const Grid=require("gridfs-stream");


const conn=require("../src/database/createConnection");

let gfs;

conn.on("error",console.error.bind(console,'connection error'));
conn.once("open",function(){
    gfs=Grid(conn.db,mongoose.mongo);
    gfs.collection("uploads");
})

const storage = new GridFsStorage({
    url: "mongodb://localhost:27017/socialwebsite",
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });



router.get("/register", (req, res) => {
    if(req.cookies.jwt!=undefined){
        res.redirect("/");
    }else{
        res.render("register.ejs");
    }
})

router.post("/register", async (req, res) => {
    try {
        const userData = new User(req.body);
        const token = await userData.generateToken();
        const userSaved = await userData.save();
        res.status(201).redirect("/login");
    } catch (error) {
        res.status(401).send(error);
    }
})

router.get("/login", (req, res) => {
    if(req.cookies.jwt!=undefined){
        res.redirect("/");
    }else{
    res.render("login.ejs");
    }
})

router.post("/login", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userFind = await User.findOne({ email: email });
        const isMatch = await bcrypt.compare(password, userFind.password);
        if (isMatch) {
            const token = await userFind.generateToken();
            res.cookie("jwt", token, {
                expires: new Date(Date.now() + 1000000),
                httpOnly: true
            })
            res.status(200).redirect("/home");
        } else {
            res.status(400).redirect("/login");
        }
    } catch (error) {
        res.status(400).send("Invalid Login Details");
    }
})

router.get("/profile", auth,async (req, res) => {
    try {
        const userFind = await User.findById({ _id: req.user._id });
        const allPosts=await Post.find();
        res.render("profile.ejs", {userDetails: userFind,allPosts:allPosts,loggedInUser:req.user });
    } catch (error) {
        res.status(401).send(error);
    }
})

router.get("/profile/:id",auth,async(req,res)=>{
    try{
        const otherUser=await User.findById({_id:req.params.id});
        const allPosts=await Post.find();
        res.status(201).render("profile.ejs",{userDetails:otherUser,allPosts:allPosts,loggedInUser:req.user})
    }catch(error){
        res.status(401).send(error);
    }
})

router.get("/allusers",auth,async(req,res)=>{
    try{
        const allUsers=await User.find();
        res.render("allusers.ejs",{allUsers:allUsers,loggedInUser:req.user});
    }catch(error){
        res.status(401).send(error);
    }
})

router.get("/follow/:userid",auth,async(req,res)=>{
    try{
        const putToClickedUser={
            id:req.user._id,
            firstname:req.user.firstname
        };
        const clickedUser=await User.findByIdAndUpdate({_id:req.params.userid},{$push:{"followers":putToClickedUser}});
        const findUser=await User.findById({_id:req.params.userid});
        const putToLoggedInUser={
            id:findUser._id,
            firstname:findUser.firstname
        };
        const loggedInUser=await User.findByIdAndUpdate({_id:req.user._id},{$push:{"followings":putToLoggedInUser}});
        res.status(201).redirect("/allusers");
    }catch(error){
        res.status(401).send(error);
    }
})

router.get("/unfollow/:userid",auth,async(req,res)=>{
    try{
        const clickedUser=await User.findById({_id:req.params.userid});
        const loggedInUser=await User.findById({_id:req.user._id});
        loggedInUser.followings=loggedInUser.followings.filter((follow)=>{
            return follow.id.toString()!=clickedUser._id.toString()
        })
        await loggedInUser.save();
        clickedUser.followers=clickedUser.followers.filter((follow)=>{
            return follow.id.toString()!=loggedInUser._id.toString()
        })
        await clickedUser.save();
        res.status(201).redirect("/allusers");
    }catch(error){
        res.status(401).send(error);
    }
})

router.get("/profile/update/:userid",auth,async(req,res)=>{
    try{
        const userFind=await User.findById({_id:req.params.userid});
        res.status(201).render("profileupdate.ejs",{userDetails:userFind});
    }catch(error){
        res.status(401).send(error);
    }
})

router.post("/profile/update/:userid",auth,upload.single("file"),(req,res)=>{
    gfs.files.find().toArray(async(err,files)=>{
        if(!files || files.length===0){
            return res.status(404).json({
                err:'No files exist'
            })
        }else{
            const filename=files[files.length-1].filename;
            const updateUser=await User.findByIdAndUpdate({_id:req.params.userid},{profilepicture:filename,profilepicturestatus:true});
            res.redirect("/profile");
        }
    })
})

router.get('/image/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
      if (!file) {
        return res.status(404).json({
          err: 'No file exists'
        });
      }
      if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
        const bucket = new mongoose.mongo.GridFSBucket(conn, {bucketName: 'uploads',});
        const readStream = bucket.openDownloadStreamByName(file.filename);
        readStream.pipe(res);
      } else {
        res.status(404).json({
          err: 'Not an image'
        });
      }
    });
  });

router.get("/logout", auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((currentToken) => {
            return currentToken.token !== req.token
        });
        res.clearCookie("jwt");
        await req.user.save();
        res.redirect("/login");
    } catch (error) {
        res.status(500).send(error);
    }
})

module.exports = router;