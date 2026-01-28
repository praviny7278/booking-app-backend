const mongoose = require('mongoose');
require('dotenv').config();


const connectDB = async () => {
    try {
        const uri = process.env.DATABSE_URL;
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('MongoDB connected successfully');
        
    } catch (err) {
        console.log('MongoDB connection error: ', err);
        process.exit(1);
    }
};


module.exports = connectDB;