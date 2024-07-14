const express = require('express');
const router = express.Router();
const userFunctions = require('../routeFunctions/authFunctions');
const multer = require('multer');
const fs = require('fs');
const path = require('path');



router.post("/startLive", userFunctions.startLive);
router.post("/stopLive", userFunctions.stopLive);
router.get("/liveStatus", userFunctions.liveStatus);
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
router.post("/addEvent", userFunctions.addEvent);
router.get("/getEvents",userFunctions.getEvents);
router.post("/addVideo", userFunctions.addVideo);
router.get("/getVides",userFunctions.getVideos);
router.post("/addImage", userFunctions.addImage);
router.get("/getImages",userFunctions.getImages);
router.get("/getAdmins",userFunctions.getAdmins);
router.get("/getUsers",userFunctions.getUsers);


module.exports = router;
