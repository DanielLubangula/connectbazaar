// models/Vendor.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const VendorSchema = new Schema({
  companyName: {
    type: String,
  },
  companyAddress: {
    type: String,
  },
  phone: {
    type: String,
  },
  emailNotifications: {
    type: String,
    default: "checked",
  },
  smsNotifications: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  confirmPassword: {
    type: String,
  },
  profileImagePath: {
    type: String,
    default: "/images/defaultUserProfil.jpg",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  lastSeen: {
    type: String,
  },
  role : {
    type: String,
    default : "Seller "
  }, 
  status : {
    type : String,
    default : "active"
  },
  listNoir : [{
    userId : {type : mongoose.Schema.Types.ObjectId}
  }],
  publishedProductsCount: {
    type: Number,
    default: 0,
  },
  publishedTodayCount: { type: Number, default: 0 }, // Compteur de publications quotidiennes
  lastPublicationDate: { type: String, default: null }, // Dernière date de publication
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("seller", VendorSchema);
