const express = require('express');
const router = express.Router();
const userFunctions = require('../routeFunctions/authFunctions');
const multer = require('multer');
const fs = require('fs');
const path = require('path');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads')); // Set the destination directory
  },
  filename: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads', file.originalname);
    if (fs.existsSync(uploadPath)) {
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      let newFilename = `${name}(1)${ext}`;
      let counter = 1;
      while (fs.existsSync(path.join(__dirname, '../uploads', newFilename))) {
        counter++;
        newFilename = `${name}(${counter})${ext}`;
      }
      cb(null, newFilename);
    } else {
      cb(null, file.originalname); // Use the original name of the file
    }
  }
});

const upload = multer({ storage: storage });

router.post('/addEvent', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    console.log(req.file); // Print the file details
    res.status(200).json({ success: true, message: 'File uploaded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
});

router.post("/createUser", userFunctions.createUser);
router.post("/createAdmin", userFunctions.createAdmin);
router.get("/loginUser/:email/:password/:admin", userFunctions.loginUser);
router.put("/verifyUser/:authToken/:admin", userFunctions.verifyUser);
router.put("/updateUser", userFunctions.updateUser);
router.get("/forgotPassword/:email/:admin", userFunctions.forgotPassword);
router.put("/updatePassword/:admin", userFunctions.updatePassword);
router.get("/checkToken/:authToken", userFunctions.checkToken);
router.get("/getUserDetails/:authToken/:admin", userFunctions.getUserDetails);
router.get("/adminStatus/:authToken", userFunctions.adminStatus);

// router.get("/getLive",userFunctions.getLive);
// router.put("/startLive",userFunctions.startLive);
// router.put("/stopLive",userFunctions.stopLive);


module.exports = router;
