import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const OLLAMA_API_URL = 'http://localhost:11434';

app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'Hello, welcome to Mileva API',
        description: 'A REST API server for running Llama 3.2 models via Ollama',
        version: '1.0.0',
        endpoints: {
            public: {
                'GET /': 'This documentation page',
                'GET /health': 'Health check endpoint'
            },
            protected: {
                'POST /api/llama32-1b': 'Generate text using Llama 3.2 1B model',
                'POST /api/llama32-3b': 'Generate text using Llama 3.2 3B model',
                'GET /api/test-ollama': 'Test ollama functionality',
                'GET /api/ollama-status': 'Check ollama service status'
            }
        },
        usage: {
            authentication: 'Include x-api-key header for protected endpoints',
            request_format: {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'your-api-key'
                },
                body: {
                    input: 'Your prompt text here'
                }
            },
            response_format: {
                result: 'Generated text response'
            }
        },
        examples: {
            'curl_example': 'curl -X POST -H "Content-Type: application/json" -H "x-api-key: YOUR_KEY" -d \'{"input":"Hello"}\' http://your-server.com/api/llama32-1b'
        }
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', (req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
    const key = req.headers['x-api-key'];
    if (key !== API_KEY) {
        console.log('Invalid API key provided');
        return res.status(403).json({ error: 'Forbidden - Invalid API Key' });
    }
    next();
});

async function callOllamaAPI(model, prompt, timeout = 60000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        console.log(`Calling ollama API for model: ${model}`);
        console.log(`Prompt: ${prompt.substring(0, 100)}...`);
        
        const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                }
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama API error (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`Ollama API response received for ${model}`);
        
        return data.response;
        
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            throw new Error('Request timeout - ollama took too long to respond');
        }
        
        console.error('Ollama API error:', error.message);
        throw error;
    }
}

app.post('/api/llama32-1b', async (req, res) => {
    const input = req.body.input;
    if (!input) return res.status(400).json({ error: 'Missing input' });

    console.log(`Processing llama32-1b request with input: ${input.substring(0, 100)}...`);
    
    try {
        const result = await callOllamaAPI('llama3.2:1b', input, 60000);
        console.log('Llama32-1b request completed successfully');
        res.json({ result: result });
    } catch (error) {
        console.error('Llama32-1b error:', error.message);
        
        if (error.message.includes('timeout')) {
            return res.status(408).json({ error: error.message });
        }
        
        return res.status(500).json({ error: error.message });
    }
});

app.post('/api/llama32-3b', async (req, res) => {
    const input = req.body.input;
    if (!input) return res.status(400).json({ error: 'Missing input' });

    console.log(`Processing llama32-3b request with input: ${input.substring(0, 100)}...`);

    try {
        const result = await callOllamaAPI('llama3.2:3b', input, 120000);
        console.log('Llama32-3b request completed successfully');
        res.json({ result: result });
    } catch (error) {
        console.error('Llama32-3b error:', error.message);
        
        if (error.message.includes('timeout')) {
            return res.status(408).json({ error: error.message });
        }
        
        return res.status(500).json({ error: error.message });
    }
});

app.get('/api/test-ollama', async (req, res) => {
    console.log('Testing ollama API with simple command...');
    
    try {
        const result = await callOllamaAPI('llama3.2:1b', 'Say hello', 30000);
        
        res.json({ 
            success: true, 
            result: result,
            message: 'Ollama API is working correctly',
            method: 'REST API'
        });
    } catch (error) {
        console.error('Ollama API test error:', error.message);
        res.status(500).json({ 
            error: error.message,
            method: 'REST API',
            api_url: OLLAMA_API_URL
        });
    }
});

app.get('/api/ollama-status', async (req, res) => {
    try {
        const response = await fetch(`${OLLAMA_API_URL}/api/tags`);
        
        if (!response.ok) {
            throw new Error(`Ollama service not responding (${response.status})`);
        }
        
        const data = await response.json();
        
        res.json({
            status: 'running',
            api_url: OLLAMA_API_URL,
            models: data.models || []
        });
        
    } catch (error) {
        console.error('Ollama status check failed:', error.message);
        res.status(500).json({
            status: 'error',
            error: error.message,
            api_url: OLLAMA_API_URL
        });
    }
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
    console.log(`Ollama status available at: http://localhost:${PORT}/api/ollama-status`);
});
