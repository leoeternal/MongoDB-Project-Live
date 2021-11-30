const mongoose = require("mongoose");

mongoose.connect(process.env.DATABASE_CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const conn = mongoose.connection;

conn.on("error", console.error.bind(console, "connection error"));
conn.once("open", function () {
  // gfs=Grid(conn.db,mongoose.mongo);
  // gfs.collection("uploads");
  console.log("Application is connected to database");
});

// const storage = new GridFsStorage({
//     url: "mongodb://localhost:27017/socialwebsite",
//     file: (req, file) => {
//       return new Promise((resolve, reject) => {
//         crypto.randomBytes(16, (err, buf) => {
//           if (err) {
//             return reject(err);
//           }
//           const filename = buf.toString('hex') + path.extname(file.originalname);
//           const fileInfo = {
//             filename: filename,
//             bucketName: 'uploads'
//           };
//           resolve(fileInfo);
//         });
//       });
//     }
//   });
//   const upload = multer({ storage });

module.exports = conn;
