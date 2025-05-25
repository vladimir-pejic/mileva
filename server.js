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

app.post('/api/llama-1', (req, res) => {
    const input = req.body.input;
    if (!input) return res.status(400).json({ error: 'Missing input' });

    console.log(`Processing llama-1 request with input: ${input.substring(0, 100)}...`);
    
    const command = `ollama run llama3.2:1b "${input}"`;

    exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
        if (error) {
            console.error('Llama-1 error:', error.message);
            console.error('Stderr:', stderr);
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

    const command = `ollama run llama3.2:3b "${input}"`;

    exec(command, { timeout: 120000 }, (error, stdout, stderr) => {
        if (error) {
            console.error('Llama-3 error:', error.message);
            console.error('Stderr:', stderr);
            return res.status(500).json({ error: stderr || error.message });
        }
        console.log('Llama-3 request completed successfully');
        res.json({ result: stdout.trim() });
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
});
