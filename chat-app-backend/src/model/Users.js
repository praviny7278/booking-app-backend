
const mongoose = require('mongoose');


const BookingSchema = new mongoose.Schema({
  bookedName: { type: String, require: true },
  date: {type: String, require: true }
});



const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true }, // unique phone number
  email: { type: String, required: true, unique:true } , // unique phone number
  password: { type: String, required: true }, 
  image: { type: String },
  profession: { type: String },
  gender: { type: String },
  bookings: [BookingSchema],
  online: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  otp: { type: String},
  otpExpires: { type: String},
  verified: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
