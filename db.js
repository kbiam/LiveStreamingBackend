const mongoose = require('mongoose');
require('dotenv').config()
const dbURL=process.env.dbURL;

const connectDB = async () => {
    await mongoose.connect(dbURL,{useNewUrlParser:true},async(err,res) =>{
        if(err) console.log("---",err)
        else console.log("Mongo Connected")
    });
}

module.exports = connectDB;


