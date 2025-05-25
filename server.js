import express from 'express';
import dotenv from 'dotenv';
import { exec } from 'child_process';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

app.use(express.json());

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
    const key = req.headers['x-api-key'];
    if (key !== API_KEY) {
        console.log('Invalid API key provided');
        return res.status(403).json({ error: 'Forbidden - Invalid API Key' });
    }
    next();
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

function escapeShellInput(input) {
    return input.replace(/'/g, "'\"'\"'");
}

function executeOllama(model, input, timeout, callback) {
    const escapedInput = escapeShellInput(input);
    const command = `ollama run ${model} '${escapedInput}'`;
    
    console.log(`Executing: ${command.substring(0, 100)}...`);
    
    const options = {
        timeout: timeout,
        maxBuffer: 1024 * 1024 * 10,
        shell: '/bin/bash',
        env: {
            ...process.env,
            PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
            HOME: process.env.HOME || '/root'
        }
    };
    
    exec(command, options, callback);
}

app.post('/api/llama-1', (req, res) => {
    const input = req.body.input;
    if (!input) return res.status(400).json({ error: 'Missing input' });

    console.log(`Processing llama-1 request with input: ${input.substring(0, 100)}...`);
    
    executeOllama('llama3.2:1b', input, 60000, (error, stdout, stderr) => {
        if (error) {
            console.error('Llama-1 error:', error.message);
            console.error('Stderr:', stderr);
            
            if (error.code === 'ETIMEDOUT') {
                return res.status(408).json({ error: 'Request timeout - ollama took too long to respond' });
            }
            
            return res.status(500).json({ error: stderr || error.message });
        }
        console.log('Llama-1 request completed successfully');
        res.json({ result: stdout.trim() });
    });
});

app.post('/api/llama-3', (req, res) => {
    const input = req.body.input;
    if (!input) return res.status(400).json({ error: 'Missing input' });

    console.log(`Processing llama-3 request with input: ${input.substring(0, 100)}...`);

    executeOllama('llama3.2:3b', input, 120000, (error, stdout, stderr) => {
        if (error) {
            console.error('Llama-3 error:', error.message);
            console.error('Stderr:', stderr);
            
            if (error.code === 'ETIMEDOUT') {
                return res.status(408).json({ error: 'Request timeout - ollama took too long to respond' });
            }
            
            return res.status(500).json({ error: stderr || error.message });
        }
        console.log('Llama-3 request completed successfully');
        res.json({ result: stdout.trim() });
    });
});

app.get('/api/test-ollama', (req, res) => {
    console.log('Testing ollama with simple command...');
    
    executeOllama('llama3.2:1b', 'Say hello', 30000, (error, stdout, stderr) => {
        if (error) {
            console.error('Ollama test error:', error.message);
            console.error('Stderr:', stderr);
            return res.status(500).json({ 
                error: stderr || error.message,
                command: 'ollama run llama3.2:1b "Say hello"'
            });
        }
        
        res.json({ 
            success: true, 
            result: stdout.trim(),
            message: 'Ollama is working correctly'
        });
    });
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mileva API server running on port ${PORT}`);
    console.log(`API key to use: ${API_KEY}`);
    console.log(`Health check available at: http://localhost:${PORT}/health`);
    console.log(`Ollama test available at: http://localhost:${PORT}/api/test-ollama`);
});
