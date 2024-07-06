const mongoose = require('mongoose')
const {Schema} =mongoose;

const EventSchema= new Schema({
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
        required: true
    }

});

module.exports = mongoose.model('event',EventSchema);