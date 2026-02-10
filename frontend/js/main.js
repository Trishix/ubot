// Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/chat';

const outputDiv = document.getElementById('output');
const terminalBody = document.getElementById('terminal-body');
const inputField = document.getElementById('command-input');
const cursor = document.querySelector('.blinking-cursor');

let messages = [];

// --- 1. Gravity / Warp Speed Animation ---
function initAnimation() {
    const canvas = document.getElementById('warpDrive');
    const ctx = canvas.getContext('2d');

    let width, height;
    let stars = [];
    const STAR_COUNT = 200;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    window.addEventListener('resize', resize);
    resize();

    class Star {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = (Math.random() - 0.5) * width;
            this.y = (Math.random() - 0.5) * height;
            this.z = Math.random() * width; // Depth
            this.pz = this.z; // Previous z
        }

        update() {
            this.z -= 10; // Speed
            if (this.z <= 0) {
                this.reset();
                this.z = width;
                this.pz = this.z;
            }
        }

        draw() {
            // Perspective projection
            const sx = (this.x / this.z) * width + width / 2;
            const sy = (this.y / this.z) * height + height / 2;

            const px = (this.x / this.pz) * width + width / 2;
            const py = (this.y / this.pz) * height + height / 2;

            this.pz = this.z;

            if (sx < 0 || sx > width || sy < 0 || sy > height) return;

            const size = (1 - this.z / width) * 3;
            const opacity = (1 - this.z / width);

            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(sx, sy);
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.lineWidth = size;
            ctx.stroke();
        }
    }

    // Init stars
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push(new Star());
    }

    function animate() {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);

        stars.forEach(star => {
            star.update();
            star.draw();
        });

        requestAnimationFrame(animate);
    }

    animate();
}

// --- 2. Terminal Logic ---

// Auto-focus input
document.addEventListener('click', () => inputField.focus());

// Cursor Logic
inputField.addEventListener('input', updateCursor);
function updateCursor() {
    // We rely on standard text input behavior for now, 
    // the blinking block is decorative at the end of the line
}

// Boot Sequence
window.onload = async () => {
    initAnimation();

    await typeLine('UBOT SYSTEM v1.0.2 [INITIALIZING]...');
    await delay(300);
    addSystemMessage('Welcome, Guest. I am UBOT. Ask me about the developer\'s skills, projects, or experience.');
    addSystemMessage('Type "help" for a list of system commands.');
    addSystemMessage('----------------------------------------------------------------');
};

// Handle Command
inputField.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        const text = inputField.value.trim();
        if (!text) return;

        // 1. Commit visual line
        addLogEntry(text);
        inputField.value = '';
        scrollToBottom();

        // 2. Disable input
        inputField.disabled = true;
        cursor.style.display = 'none';

        // 3. Process
        await processCommand(text);

        // 4. Re-enable
        inputField.disabled = false;
        inputField.focus();
        cursor.style.display = 'inline-block';
        scrollToBottom();
    }
});

function addLogEntry(text) {
    const div = document.createElement('div');
    div.className = 'message';
    div.innerHTML = `<span class="prompt">guest@ubot:~$</span><span class="user-command">${escapeHtml(text)}</span>`;
    outputDiv.appendChild(div);
}

function addSystemMessage(text) {
    const div = document.createElement('div');
    div.className = 'message system-message';
    div.innerHTML = escapeHtml(text);
    outputDiv.appendChild(div);
}

async function processCommand(cmd) {
    const lower = cmd.toLowerCase();

    // Local Commands
    if (lower === 'clear' || lower === 'cls') {
        outputDiv.innerHTML = '';
        return;
    }
    if (lower === 'help') {
        addSystemMessage(`
AVAILABLE COMMANDS:
  help      : Show this index
  clear     : Clear terminal buffer
  about     : Display system info
  
  [Or simply type your question to chat with the AI]
`);
        return;
    }
    if (lower === 'about') {
        addSystemMessage('UBOT AI Interface.\nModel: Gemini-1.5-Flash\nFrontend: Vanilla JS (Warp Theme)\nBackend: Node.js/Express');
        return;
    }

    // API Call
    await chatWithAI(cmd);
}

async function chatWithAI(userText) {
    messages.push({ role: 'user', content: userText });

    const responseDiv = document.createElement('div');
    responseDiv.className = 'message bot-response';
    outputDiv.appendChild(responseDiv);

    try {
        console.log(`Sending request to: ${API_URL}`);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages })
        });

        console.log(`Response status: ${response.status}`);

        if (!response.ok) {
            let errorMsg = `HTTP ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg += `: ${errorData.error || 'Unknown error'}`;
            } catch (e) {
                const text = await response.text();
                if (text) errorMsg += `: ${text}`;
            }
            throw new Error(errorMsg);
        }

        if (!response.body) throw new Error('Response body is empty');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let hasContent = false;

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            if (chunk) {
                fullText += chunk;
                hasContent = true;
                responseDiv.innerHTML = escapeHtml(fullText) + '▮'; // Typing cursor
                scrollToBottom();
            }
        }

        // Remove cursor
        responseDiv.innerHTML = escapeHtml(fullText);

        if (!hasContent) {
            throw new Error('No content received from AI');
        }

        messages.push({ role: 'assistant', content: fullText });

    } catch (err) {
        console.error('Chat Error:', err);
        responseDiv.innerHTML = `<span style="color:#ff5f56">ERROR: ${err.message}</span><br><span style="color:#8b949e; font-size: 0.8em">Check browser console for details.</span>`;
    }
}

// Utils
function scrollToBottom() {
    terminalBody.scrollTop = terminalBody.scrollHeight;
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function typeLine(text) {
    const div = document.createElement('div');
    div.className = 'message system-message';
    div.style.marginBottom = '2px';
    outputDiv.appendChild(div);

    div.textContent = text;
    scrollToBottom();
}
