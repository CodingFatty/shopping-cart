const mongoose = require('mongoose');

let ProductSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    inventory_count: {
       type: Number,
       required: true
   }
});

module.exports = mongoose.model('Product', ProductSchema);