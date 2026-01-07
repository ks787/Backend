const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Invitation = require('../models/Invitation');
const { protect } = require('../middleware/authMiddleware');
const crypto = require('crypto');

// @desc    Get user projects
// @route   GET /api/projects
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const projects = await Project.find({ members: req.user.id });
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('members', 'name email')
            .populate('owner', 'name email');

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is member
        if (!project.members.some(member => member._id.toString() === req.user.id)) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create project
// @route   POST /api/projects
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        if (!req.body.name) {
            return res.status(400).json({ message: 'Please add a project name' });
        }

        const project = await Project.create({
            name: req.body.name,
            owner: req.user.id,
            members: [req.user.id]
        });

        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Invite user
// @route   POST /api/projects/:id/invite
// @access  Private (Owner only)
router.post('/:id/invite', protect, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (project.owner.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Only owner can invite' });
        }

        const inviteToken = crypto.randomBytes(20).toString('hex');

        // Expires in 24 hours
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await Invitation.create({
            projectId: project._id,
            inviteToken,
            expiresAt
        });

        res.status(201).json({ inviteToken });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Join project via invite
// @route   POST /api/projects/join/:token
// @access  Private
router.post('/join/:token', protect, async (req, res) => {
    try {
        const invitation = await Invitation.findOne({
            inviteToken: req.params.token,
            expiresAt: { $gt: Date.now() }
        });

        if (!invitation) {
            return res.status(400).json({ message: 'Invalid or expired invite token' });
        }

        const project = await Project.findById(invitation.projectId);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if already member
        if (project.members.includes(req.user.id)) {
            return res.status(200).json({ message: 'Already a member', projectId: project._id });
        }

        project.members.push(req.user.id);
        await project.save();

        res.status(200).json({ message: 'Joined project successfully', projectId: project._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
