const express = require('express');
const auth = require("../middleware/authMiddleware");
const User = require("../model/Users");
const router = express.Router();








/// Get contacts details
router.post('/check-contacts', auth, async (req, res) => {

    try {
        
        const {contacts} = req.body;

        if (!contacts || !Array.isArray(contacts)) {
            return res.status(400).json({message: 'Contacts not found!'});

        } 

        // make all contacts looks normal (removing: +91, or any other)
        const normalized = contacts
          .map(num => num.replace(/\D/g, '').slice(-10))
          .filter(num => num.length === 10); // Keep only valid numbers

        // check all contacts 
        const registerdUsers = await User.find({ phone: { $in: normalized} }).select('-password');

        if (!registerdUsers.length) {
          return res.status(404).json({message: "No contacts found !", registerdUsers: [] });
        }

        res.status(200).json({registerdUsers});
        // console.log('users: ', registerdUsers );
        

    } catch (err) {
        console.log('Contact find error: ',err);
        res.status(500).json({message: 'Server error'});
    }
});


// get profile
router.get('/me/:id', auth, async (req, res) => {
   
  try {
    const id = req.params.id;

    if (!id) return res.sendStatus(400).json({message: 'User not found!'});

    const user = await User.findById(id);
    if (!user) return res.sendStatus(400).json({message: 'User not found!'});

    res.json(user);


  } catch (err) {
    res.status(500).json({message: 'Internal server error', err})
  }

});


/// Edit user information
router.post('/update', auth, async (req, res) => {

  try {
    
    const allowFields = ['name'];
    const { userId } = req.body;
    const updates = {};

    allowFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {$set: updates},
      {new: true}
    ).select('-password');


    res.status(200).json({
      success: true,
      message: 'user updated successfully.',
      user: updatedUser
    });

    console.log(
      'success:', true,
      'message:', 'user updated successfully.',
      'update:', updates
    );
    


  } catch (err) {
    res.status(500).json({
        success: false,
        message: 'user update faild',
    })
    console.log('err: ', err);
    
  }
});




module.exports = router;