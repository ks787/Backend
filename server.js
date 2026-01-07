const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http'); // Import http module
const { Server } = require("socket.io"); // Import Server from socket.io

// Load config
dotenv.config({ path: './backend/.env' });

const connectDB = require('./backend/config/db');

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server, { // Initialize Socket.IO
    cors: {
        origin: "*", // Allow all origins for simplicity in this project
        methods: ["GET", "POST"]
    }
});

connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
app.use(express.static('frontend')); // Serve frontend static files

// Routes
app.use('/api/auth', require('./backend/routes/authRoutes'));
app.use('/api/projects', require('./backend/routes/projectRoutes'));
app.use('/api/tasks', require('./backend/routes/taskRoutes'));
app.use('/api/chat', require('./backend/routes/chatRoutes'));

// 404 Handler
app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

// Error Handler
const { errorHandler } = require('./backend/middleware/errorMiddleware');
app.use(errorHandler);

const Message = require('./backend/models/Message');

// Socket.IO Connection
io.on('connection', (socket) => {
    console.log('User connected: ' + socket.id);

    socket.on('join_project', (projectId) => {
        socket.join(projectId);
        console.log(`User ${socket.id} joined project ${projectId}`);
    });

    socket.on('send_message', async (data) => {
        // data: { projectId, senderId, message, senderName }
        const { projectId, senderId, message, senderName } = data;

        // Save to DB
        try {
            await Message.create({ projectId, senderId, message });

            // Broadcast to room (including sender, or just use emit to room)
            io.to(projectId).emit('receive_message', {
                _id: Date.now(), // Temp ID or fetch real one
                senderId: { _id: senderId, name: senderName }, // Mimic populate
                message,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    socket.on('task_updated', (data) => {
        // Broadcast to everyone else in the room
        // data: { projectId, task }
        socket.to(data.projectId).emit('task_updated', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
