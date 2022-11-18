const { Int32 } = require('bson');
const mongoose = require('mongoose');

var bookSchema = new mongoose.Schema({
    title: String,
    author: String,
    quantity: Number,
    type: String,
    manager:String,
    language: String
});
module.exports = mongoose.model('book', bookSchema)