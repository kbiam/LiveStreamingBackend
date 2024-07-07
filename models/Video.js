const mongoose = require('mongoose')
const {Schema} =mongoose;

const VideoSchema= new Schema({
    name:{
        type: String,
        required: true
    }, 
    userId:{
        type: String,
        required: true
    },
    videoUrl:{
        type: String,
        required: true
    },
    date:{
        type:Date,
        default:Date.now
    }

});

module.exports = mongoose.model('video',VideoSchema);