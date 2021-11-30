require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();

const port = 3000;

app.use(express.static("./public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

require("./src/database/createConnection"); //getting database from createConnection.js in src folder

const userRouter = require("./routers/UserRouter");
const postRouter = require("./routers/PostRouter");
const auth = require("./src/middleware/auth");

const Post = require("./models/PostModel");

app.use(userRouter);
app.use(postRouter);

// homepage route
app.get("/", (req, res) => {
  if (req.cookies.jwt != undefined) {
    res.redirect("/home");
  } else {
    res.render("homepage.ejs");
  }
});

app.get("/home", auth, async (req, res) => {
  try {
    const allPosts = await Post.find();
    res.status(201).render("homepagewithlogin.ejs", {
      userDetails: req.user,
      allPosts: allPosts,
    });
  } catch (error) {
    res.status(401).send(error);
  }
});

app.listen(process.env.PORT || port, () => {
  console.log(`App is running on port ${port}`);
});
