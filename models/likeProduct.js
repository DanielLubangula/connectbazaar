// models/Preference.js
const mongoose = require("mongoose");

const likedProductSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  userIdTab: [{
    userId :{
        type: mongoose.Schema.Types.ObjectId,
      }
  }]
});

module.exports = mongoose.model("likedProduct7", likedProductSchema);
