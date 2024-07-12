const mongoose = require('mongoose')
const {Schema} =mongoose;

const ImageSchema= new Schema({
    name:{
        type: String,
        required: true
    }, 
    userId:{
        type: String,
        required: true
    },
    imageUrl:{
        type: String,
        required: true
    },
    date:{
        type:Date,
        default:Date.now
    }

});

module.exports = mongoose.model('image',ImageSchema);