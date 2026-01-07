const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Project = require('../models/Project');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get chat history for a project
// @route   GET /api/chat/:projectId
// @access  Private
router.get('/:projectId', protect, async (req, res) => {
    try {
        // Verify membership
        const project = await Project.findById(req.params.projectId);
        if (!project) return res.status(404).json({ message: "Project not found" });

        if (!project.members.includes(req.user.id)) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const messages = await Message.find({ projectId: req.params.projectId })
            .populate('senderId', 'name email')
            .sort({ createdAt: 1 }); // Oldest first

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
