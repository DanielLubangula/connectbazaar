// models/Preference.js
const mongoose = require("mongoose");

const preferenceSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true,
  },
  emailNotifications: { type: Boolean },
  smsNotifications: { type: Boolean },
});

module.exports = mongoose.model("Preference", preferenceSchema);
