const socket = io();

// Join Project Room
socket.emit('join_project', projectId);

const chatMessages = document.getElementById('chat-messages');

// Load History
async function loadChatHistory() {
    try {
        const messages = await api.get(`/chat/${projectId}`);
        messages.forEach(msg => appendMessage(msg));
        scrollToBottom();
    } catch (error) {
        console.error('Failed to load chat');
    }
}

function appendMessage(msg) {
    // msg: { senderId: {_id, name}, message, timestamp }
    const div = document.createElement('div');
    const isMine = msg.senderId._id === user._id || msg.senderId === user._id; // Handle populated vs raw response

    div.className = `message ${isMine ? 'my-message' : 'other-message'}`;

    const senderName = msg.senderId.name || 'Unknown';

    div.innerHTML = `
        <div class="message-meta">${isMine ? 'You' : senderName}</div>
        <div>${msg.message}</div>
    `;

    chatMessages.appendChild(div);
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send Message
function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();

    if (!text) return;

    const msgData = {
        projectId,
        senderId: user._id,
        senderName: user.name,
        message: text
    };

    socket.emit('send_message', msgData);
    input.value = '';
}

// Listen for messages
socket.on('receive_message', (msg) => {
    appendMessage(msg);
    scrollToBottom();
});

// Listen for task updates (cross-interaction)
socket.on('task_updated', () => {
    // Reload board
    loadTasks();
});

// Initial load
loadChatHistory();
