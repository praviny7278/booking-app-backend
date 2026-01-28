const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../model/Users');
const { hash } = require('bcrypt');
const nodemailer = require('nodemailer');
const router = express.Router();
require('dotenv').config();

function generateOtp() {
    return Math.floor( 100000 + Math.random() * 900000).toString();
}

//
const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
});

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded" : "Missing");



transporter.verify((error, success) => {
    // console.log("EMAIL_USER:", process.env.EMAIL_USER);
    // console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded" : "Missing");

    if (error) {
        console.error("Email config error:", error);
    } else {
        console.log("Email server is ready to send messages.");
    }
});


//
async function sendOtpEmail(to, otp) {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject: "Your verification OTP",
        text: `Your OTP is ${otp}. Expire in 10 minutes.`,
    });
}




// CREATE new User
router.post('/register', async (req, res) => {
    try {
        const {name, phone, password, email, image, profession, gender, bookings } = req.body;
        
        if (!name || !phone || !password || !email || !profession || !gender) {
            return res.status(400).json({message: 'Missing fields'});
        }

        const phoneUser = await User.findOne({ phone });
        if (phoneUser) return res.status(400).json({message: 'Phone already used'});


        const emailUser = await User.findOne({ email });
        if (emailUser) return res.status(400).json({message: 'Email already used'});

        const otp = generateOtp();
        const otpExpires = Date.now() + 10 * 60 * 1000;
 

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            phone,
            password: hashedPassword, 
            email, 
            image, 
            profession, 
            gender, 
            bookings,
            otp,
            otpExpires,
            verified: false,
        });

        
        await user.save();

        await sendOtpEmail(email, otp);

        res.status(200).json({ message: 'Otp sent to your email', userId: user._id});
        console.log('Otp: ', otp);

    } catch (err) {
        console.log('Register Error: ',err);
        res.status(500).json({message: 'Server error'});
        
    }
});


/// VERIFY User with OTP find by User ID
router.post('/verify-id', async (req, res) => {

    try {
        
        const { userId, otp } = req.body;
        
        const user = await User.findOne({_id: userId});
        if (!user) return res.status(404).json({message: 'User not found!'});

        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({message: 'Invalid or expired OTP'});
        }


        user.verified = true;
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        res.status(200).json({ message: 'User verified successfully.', user: user });

        console.log('otp verified successfully.', user.id);

    } catch (err) {
        console.log('otp verified error: ', err);
        
        res.status(500).json({ message: 'Server Error' });
    }
});


/// LOGIN User phone or email
router.post('/login', async (req, res) => {

    try {
        
        const { phoneOrEmail, password } = req.body;

        if (!phoneOrEmail || !password ) return res.status(400).json({message: 'Missing field'});

        const user = await User.findOne({ $or: [{ phone: phoneOrEmail }, { email: phoneOrEmail}] });
        if (!user) return res.status(400).json({message: 'Invalid credential!'});

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({message: 'Invalid Password!'});

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '500s'});
        res.status(200).json({
            token, user: 
            {
                id: user._id, 
                name: user.name, 
            }
        });
        console.log('Login successfull.', user);
 
    } catch (error) {
        res.status(500).json({message: 'Server error'});
        console.log(error);
        
    }
});


/// FORGET user password
router.post('/forget-password', async (req, res) => {

  try {
    
    const { email } = req.body;

    const user = await User.findOne({ email });

    if(!user) {
      res.status(404).json({ message: 'User not found !' });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    res.status(200).json({
      message: 'OTP sent to your email',
      success: true,
    })

    console.log('OTP sent to email: ', otp);


  } catch (err) {
    console.log('err: ', err);
    res.status(500).json({message: err});
    
  }
});


/// VERIFY User with OTP find by User email
router.post('/verify-email', async (req, res) => {

    try {
        
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not founs!'});

        if (user.otp !== otp || user.otpExpires < Date.now() || otp == null) {
            return res.status(400).json({ message: 'Invalid or expired OTP'});

        }

  
        user.otp = null;
        user.otpExpires = null;
        await user.save();


        console.log('User verified');
        res.status(200).json({ message: 'User verified' })
        
        
    } catch (err) {
        console.log('User verified error: ', err);
        
        res.status(500).json({ message: 'Server Error' })
    }
});


/// RESET User password
router.post('/reset-password', async (req, res) => {

    try {
        
        const {email, newPassword } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found!'});

        if (newPassword == null) return res.status(404).json({ message: 'Enter password'});


        const salt = await bcrypt.genSalt(10);
        //
        user.password = await bcrypt.hash(newPassword, salt);
        //
        await user.save();


        console.log('Password reset successfully');
        res.status(200).json({ message: 'Password reset successfully' })
        
        
    } catch (err) {
        console.log('Password error: ', err);
        
        res.status(500).json({ message: 'Server Error' })
    }
});








module.exports = router;