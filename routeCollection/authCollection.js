const User = require('../models/User');
const AdminUser = require('../models/AdminUser');
const Event=require('../models/Event')
const Video=require("../models/Video")
const express=require('express')
const app = express()
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../sendEmail');
require('dotenv').config();

const saltNumber = 10;
const jwtSecret = "HaHa";



let live=0,streamerId=null;
const decodeToken = (authToken) => {
  const decoded = jwt.verify(authToken, jwtSecret);
  if (!decoded) return 0;
  return decoded.id;
}


const liveStatus=()=>{
  try{
    return {success:true,live:live,id:streamerId};
  } catch(error){
    console.log(error);
    return { success: false, message: "Something went wrong, try again later" };
  }
}
const startLive=(id)=>{
  try{
    live=1;
    streamerId=decodeToken(id);
    return {success:true,live:live,id:streamerId};
  } catch(error){
    console.log(error);
    return { success: false, message: "Something went wrong, try again later" };
  }
}

const stopLive=(id)=>{
  try{
    live=0;
    streamerId=null;
    return {success:true,live:live,id:streamerId};
  } catch(error){
    console.log(error);
    return { success: false, message: "Something went wrong, try again later" };
  }
}

const createUser = async (userData) => {
  //console.log(userData)
  const salt = await bcrypt.genSalt(saltNumber);
  const securedPassword = await bcrypt.hash(userData.password, salt);
  const email = userData.email;
  const existingUser = await User.findOne({ 'email': email });
  if (existingUser) return { success: false, message: "Email already exists" };

  try {
        
    await User.create({ name: userData.name, email: userData.email, password: securedPassword });
    const data = await User.findOne({email:email});
    const authToken = jwt.sign({id:data._id}, jwtSecret);
    const url = `${process.env.BASE_URL}users/verify/${authToken}/${0}`;
    await sendEmail(email, "Verify Email", url);
    
    return { success: true, message: "An email sent to your account, please verify", data: authToken };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Something went wrong, try again later" };
  }
};

const addEvent = async (eventData) => {
  try {
    //console.log(eventData)
    await Event.create({ name: eventData.name, userId: eventData.userId, imageUrl:eventData.imageUrl,date:eventData.date });
    return { success: true, message: "Event added successfully!!" };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Something went wrong, try again later" };
  }
};

const getEvents = async () => {
  try {
    const response=await Event.find({ });
    //console.log(response)
    return { success: true, data: response };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Something went wrong, try again later" };
  }
};


const addVideo = async (videoData) => {
  try {
    //console.log(videoData)
    await Video.create({ name: videoData.name, userId: videoData.userId, videoUrl:videoData.videoUrl });
    return { success: true, message: "Video added successfully!!" };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Something went wrong, try again later" };
  }
};

const getVideos = async () => {
  try {
    const response=await Video.find({ });
    //console.log(response)
    return { success: true, data: response };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Something went wrong, try again later" };
  }
};

const createAdmin = async (userData) => {
  //console.log(userData);
  
  const salt = await bcrypt.genSalt(saltNumber);
  const securedPassword = await bcrypt.hash(userData.password, salt);
  const email = userData.email;
  const existingUser = await AdminUser.findOne({ email: email });
  if (existingUser) return { success: false, message: "Email already exists" };

  try {
    await AdminUser.create({ name: userData.name, email: userData.email, password: securedPassword });
    const data = await AdminUser.findOne({ email: email});
    const authToken = jwt.sign({id:data._id}, jwtSecret);
    return { success: true, message: "Admin Created Successfully!!", data: authToken };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Something went wrong, try again later" };
  }
};



const loginUser = async (email, password, admin) => {  
  try {
    //console.log("login", email, password, admin)
    let userData;
    if (admin == 1){
      userData = await AdminUser.findOne({ 'email': email });
      if (!userData) return { success: false, message: "Enter valid Email" };
    }
    else{
      userData = await User.findOne({ 'email': email });
      if (!userData) return { success: false, message: "Enter valid Email" };
    }
    const bcryptPassword = await bcrypt.compare(password, userData.password);
    if (!bcryptPassword) return { success: false, message: "Enter valid Password" };

    const data = {id:userData._id};
    const authToken = jwt.sign(data, jwtSecret);
    
    if (!userData.verified) {
      const url = `${process.env.BASE_URL}users/verify/${authToken}/${admin}`;
      await sendEmail(userData.email, "Verify Email", url);
      return { success: false, message: "Not a Verified User, An Email sent to your account, please verify" };
    }
    
    return { success: true, data: authToken };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Something went wrong, try again later" };
  }
};

const verifyUser = async (authToken, admin) => {
  try {
    // console.log(authToken, admin)
    let id = decodeToken(authToken);
    //console.log("verfyid",id)
    if (id == 0) return { success: false, message: "Token verification failed" };
    let user;
    if(admin == 1) {
      user = await AdminUser.findOne({ _id:id })
      if (!user) return { success: false, message: "Invalid Link" };
    }
    else {
      user = await User.findOne({ _id:id  });
      if (!user) return { success: false, message: "Invalid Link" };
    }
    if (admin == 1) await AdminUser.updateOne({ _id:id }, { $set: { verified: true } });
    else await User.updateOne({ _id:id }, { $set: { verified: true } });
    return { success: true, message: "Email verified successfully" };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Internal Server Error" };
  }
};

const adminStatus = async (authToken) => {
  try {
    let id = decodeToken(authToken);
    if (id == 0) return { success: false, message: "Token verification failed" };
    let user = await AdminUser.findOne({  _id:id })
    if (user) return { success: true, admin: 1 };
    user = await User.findOne({  _id:id });
    if (user) return { success: true, admin: 0 };
    else return { success: false, message: "Invalid Link" };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Internal Server Error" };
  }
};

const forgotPassword = async (email, admin) => {
  let user;
  if (admin == 1){
     user = await AdminUser.findOne({ 'email': email });
     if (!user) return { success: false, message: "Email does not exist" };
  }
  else {
    user = await User.findOne({ 'email': email });
    if (!user) return { success: false, message: "Email does not exist" };
  }
  try {
    const data = { id:user._id };
    const authToken = jwt.sign(data, jwtSecret);
    const url = `${process.env.BASE_URL}users/reset/${authToken}/${admin}`;
    await sendEmail(email, "Reset Password", url);
    
    return { success: true, message: "An email sent to your account to reset your password", data: authToken };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Something went wrong, try again later" };
  }
};

const updatePassword = async (updateData, admin) => {
  const salt = await bcrypt.genSalt(saltNumber);
  const securedPassword = await bcrypt.hash(updateData.password, salt);
  const email = updateData.email;
  try {
    if (admin == 1) await AdminUser.updateOne({ 'email': email }, { $set: { password: securedPassword } });
    else await User.updateOne({ 'email': email }, { $set: { password: securedPassword } });
    return { success: true, message: "Password updated successfully" };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Something went wrong, try again later" };
  }
};

const checkToken = async (authToken) => {
  try {
    let id = decodeToken(authToken);
    if (id == 0) return { success: false, message: "Token verification failed" };
    const userData = await User.findOne({  _id:id });
    if (!userData) return { success: false, message: "User not found" };
    return { success: true, data: decoded };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Something went wrong, try again later" };
  }
};

const getUserDetails = async (authToken, admin) => {
  try {
    let id = decodeToken(authToken);
    if (id == 0) return { success: false, message: "Token verification failed" };
    //console.log(id,authToken,admin);
    let userData;
    if (admin == 1){
      userData = await AdminUser.findOne({ _id:id });
      if (!userData) return { success: false, message: "User not found" };
    }
    else {
      userData = await User.findOne({  _id:id });
      if (!userData) return { success: false, message: "User not found" };
    }
    //console.log(userData)
    return { success: true, data: userData };
  } catch (error) {
    console.log(error);
    return { success: false, message: "Something went wrong, try again later" };
  }
};


module.exports = { 
  getVideos,
  addVideo,
  getEvents,
  addEvent,
  liveStatus,
  startLive,
  stopLive,
  createUser, 
  loginUser, 
  verifyUser, 
  forgotPassword, 
  updatePassword, 
  checkToken, 
  getUserDetails, 
  createAdmin, 
  adminStatus, 
};
