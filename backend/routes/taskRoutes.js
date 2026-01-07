const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get tasks for a project
// @route   GET /api/tasks/:projectId
// @access  Private
router.get('/:projectId', protect, async (req, res) => {
    try {
        // Verify membership
        const project = await Project.findById(req.params.projectId);
        if (!project) return res.status(404).json({ message: "Project not found" });

        if (!project.members.includes(req.user.id)) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const tasks = await Task.find({ projectId: req.params.projectId })
            .populate('assignedTo', 'name email');

        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { title, description, status, projectId, assignedTo, dueDate } = req.body;

        const project = await Project.findById(projectId);
        if (!project.members.includes(req.user.id)) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const task = await Task.create({
            title,
            description,
            status,
            projectId,
            assignedTo,
            dueDate
        });

        // Populate to return full object if needed
        const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name email');

        res.status(201).json(populatedTask);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        let task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const project = await Project.findById(task.projectId);
        if (!project.members.includes(req.user.id)) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        task = await Task.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('assignedTo', 'name email');

        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const project = await Project.findById(task.projectId);
        if (!project.members.includes(req.user.id)) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await task.deleteOne();

        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
