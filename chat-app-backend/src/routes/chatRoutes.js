

const express = require('express');
const router = express.Router();
const Chat = require('../model/Chat');
const auth = require('../middleware/authMiddleware');



// Get all chats for logged-in user
router.get('/me:id', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ members: req.params.id })
      .populate('members', 'name phone email image')
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: 'err.message' });
  }
});


// Initiate chat here
router.post('/init',auth, async (req, res) => {
  
    const { receiverId, userId } = req.body; 
    console.log(req.body);
    
  try {

    if (!userId || !receiverId) {
      return res.status(404).json({ message: "Somthing went wrong please try again" });
    }


    if (userId.toString() === receiverId) {
      return res.status(400).json({ message: "You cannot create a chat with yourself" });
    }


    let chat = await Chat.findOne({
      isGroup: false,
      members: { $all: [userId, receiverId] }
    });

    if (!chat) {
      chat = await Chat.create({
        members: [userId, receiverId],
        isGroup: false
      });
    }

    res.status(200).json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
    console.log(err);
    
  }
});



module.exports = router;
