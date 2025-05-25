import { spawn } from 'child_process';
import { writeFileSync, appendFileSync } from 'fs';

const MAX_RESTARTS = 5;
const RESTART_DELAY = 5000; // 5 seconds

let restartCount = 0;
let serverProcess = null;

function logMessage(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    console.log(logEntry.trim());
    appendFileSync('server.log', logEntry);
}

function startServer() {
    logMessage('Starting server...');
    
    serverProcess = spawn('node', ['server.js'], {
        stdio: ['inherit', 'pipe', 'pipe'],
        env: process.env
    });

    serverProcess.stdout.on('data', (data) => {
        logMessage(`SERVER: ${data.toString().trim()}`);
    });

    serverProcess.stderr.on('data', (data) => {
        logMessage(`SERVER ERROR: ${data.toString().trim()}`);
    });

    serverProcess.on('close', (code) => {
        logMessage(`Server process exited with code ${code}`);
        
        if (code !== 0 && restartCount < MAX_RESTARTS) {
            restartCount++;
            logMessage(`Restarting server (attempt ${restartCount}/${MAX_RESTARTS}) in ${RESTART_DELAY/1000} seconds...`);
            
            setTimeout(() => {
                startServer();
            }, RESTART_DELAY);
        } else if (restartCount >= MAX_RESTARTS) {
            logMessage('Max restart attempts reached. Server will not restart automatically.');
        } else {
            logMessage('Server shut down normally.');
        }
    });

    serverProcess.on('error', (error) => {
        logMessage(`Failed to start server: ${error.message}`);
    });

    setTimeout(() => {
        restartCount = 0;
    }, 30000);
}

process.on('SIGINT', () => {
    logMessage('Received SIGINT, shutting down gracefully...');
    if (serverProcess) {
        serverProcess.kill('SIGTERM');
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    logMessage('Received SIGTERM, shutting down gracefully...');
    if (serverProcess) {
        serverProcess.kill('SIGTERM');
    }
    process.exit(0);
});

writeFileSync('server.log', `=== Server started at ${new Date().toISOString()} ===\n`);

startServer(); 