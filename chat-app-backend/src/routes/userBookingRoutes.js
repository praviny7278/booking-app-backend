const express = require('express');
const router = express.Router();

const User = require('../model/Users');
const auth = require('../middleware/authMiddleware');





/// Create Booking
router.post("/book-date", auth, async (req, res) => {
  try {
    const { date, bookedName, userId } = req.body;

    if (!date || !bookedName || !userId)
      return res.status(400).json({ message: "Missing fields" });

    const user = await User.findById(userId);

    const existing = user.bookings.find(b => b.date === date);

    if (existing) {
      existing.date = date; // update existing booking
    } else {
      user.bookings.push({ date, bookedName }); // add new booking
    }

    await user.save();

    res.json({ message: "Booking saved", bookings: user.bookings });

  } catch (err) {
    console.log("Booking Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Get All Bookings
router.get("/bookings/:id", auth, async (req, res) => {
  try {
    const { month } = req.query;
    const userId = req.params.id;
    console.log(userId);
    

    const user = await User.findById(userId).select("bookings");

    if (!month) return res.json({ bookings: user.bookings });

    const monthly = user.bookings.filter(b => b.date.startsWith(month));

    res.status(200).json({ bookings: monthly });
    console.log('booking: ', monthly);
    

  } catch (err) {
    console.log("Fetch bookings error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



/// Removing sepecfic bookings date
router.delete("/delete-booking", auth, async (req, res) => {
  try {
    const { date, userId } = req.body;

    if (!userId || !date) res.status(400).json({message: 'Missing field'});
    console.log('userid: ',userId, 'date: ',date );
    

    const user = await User.findById(userId);
    user.bookings = user.bookings.filter(b => b.date !== date);
    await user.save();

    res.json({ message: "Booking removed" });
    console.log("Remove booking:", user.bookings);

  } catch (err) {
    console.log("Remove booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



module.exports = router;