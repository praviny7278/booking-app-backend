const express = require('express');
const router = express.Router();
const Message = require('../model/Massege');
const Chat = require('../model/Chat');
const auth = require("../middleware/authMiddleware");
const mongoose = require("mongoose");




router.delete('/init', auth, async (req, res) => {
   
    try {
        const { messageId } = req.body;

        if (!messageId) {
            return res.status(404).json({ message: 'Something went wrong please try again later' })
        }


        const deleted = await Message.findByIdAndDelete(messageId);
      
        if (!deleted) {
            return res.status(404).json({ message: 'Message not found!' })
        }

        const chatRoom = deleted.chatRoom;

        req.app.get('io').to(chatRoom).emit('message deleted', {
            messageId: messageId,
        });

        res.json({success: true, messageId: messageId });

    } catch (err) {
        console.log('message error: ', err);
        res.status(500).json({message: 'Server error'});
        
    }
});


//////////////

router.get('/:chatId', auth, async (req, res) => {

    try {
        
        const message = await Message.find({
            chatId: req.params.chatId
           
        }).sort({createdAt: 1}).populate('');

        res.json(message);
    } catch (err) {
        console.log('message get error: ', err);

        res.status(500).json({message: 'server error'});
        
    }
});


module.exports = router;