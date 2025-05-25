import express from 'express';
import dotenv from 'dotenv';
import { exec } from 'child_process';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

app.use(express.json());

app.use((req, res, next) => {
    console.log(req);
    const key = req.headers['x-api-key'];
    if (key !== API_KEY) {
        return res.status(403).json({ error: 'Forbidden - Invalid API Key' });
    }
    next();
});

app.post('/api/llama-1', (req, res) => {
    const input = req.body.input;
    if (!input) return res.status(400).json({ error: 'Missing input' });

    const command = `ollama run llama3.2:1b "${input}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: stderr || error.message });
        res.json({ result: stdout.trim() });
    });
});

app.post('/api/llama-3', (req, res) => {
    const input = req.body.input;
    if (!input) return res.status(400).json({ error: 'Missing input' });

    const command = `ollama pull llama3.2:3b "${input}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: stderr || error.message });
        res.json({ result: stdout.trim() });
    });
});

app.listen(PORT, () => {
    console.log(`Mileva API server running on port ${PORT}`);
    console.log(`API key to use: ${API_KEY}`);
});
