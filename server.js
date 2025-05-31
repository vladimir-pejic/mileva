import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OLLAMA_API_URL = 'http://localhost:11434';

app.use(express.json());

app.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function(obj) {
        res.setHeader('Content-Type', 'application/json');
        
        const isBrowser = req.headers.accept && req.headers.accept.includes('text/html') && req.query.format !== 'json';
        
        if (isBrowser) {
            const prettyJson = JSON.stringify(obj, null, 2);
            const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Mileva API Response</title>
    <style>
        body { font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; margin: 20px; background: #f5f5f5; }
        .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        pre { background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; border-left: 4px solid #007bff; }
        .header { color: #333; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .json-response { font-size: 14px; line-height: 1.4; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🚀 Mileva API Response</h2>
            <p>Content-Type: application/json</p>
        </div>
        <pre class="json-response">${prettyJson}</pre>
    </div>
</body>
</html>`;
            res.setHeader('Content-Type', 'text/html');
            return res.send(html);
        } else {
            return originalJson.call(this, obj);
        }
    };
    next();
});

function mapModelName(openaiModel) {
    const modelMap = {
        'gpt-3.5-turbo': 'llama3.2:3b',
        'gpt-3.5-turbo-instruct': 'llama3.2:3b',
        'gpt-4': 'gemma3:4b',
        'gpt-4-turbo': 'gemma3:4b',
        'gpt-4o': 'gemma3:4b',
        'gpt-4o-mini': 'llama3.2:1b',
        'text-davinci-003': 'llama3.2:3b',
        'text-davinci-002': 'llama3.2:1b',
        'code-davinci-002': 'phi3:mini',
        'llama3.2:1b': 'llama3.2:1b',
        'llama3.2:3b': 'llama3.2:3b',
        'gemma3:4b': 'gemma3:4b',
        'phi3:mini': 'phi3:mini'
    };
    
    return modelMap[openaiModel] || 'llama3.2:3b';
}

function convertMessagesToPrompt(messages) {
    if (!messages || !Array.isArray(messages)) {
        return '';
    }
    
    let prompt = '';
    for (const message of messages) {
        if (message.role === 'system') {
            prompt += `System: ${message.content}\n\n`;
        } else if (message.role === 'user') {
            prompt += `Human: ${message.content}\n\n`;
        } else if (message.role === 'assistant') {
            prompt += `Assistant: ${message.content}\n\n`;
        }
    }
    
    prompt += 'Assistant: ';
    return prompt;
}

app.get('/', (req, res) => {
    res.json({
        message: 'Hello, welcome to Mileva API',
        description: 'A REST API server for testing and accessing ANY installed Ollama model via HTTP endpoints',
        purpose: 'Designed for testing and experimentation with Ollama models',
        model_support: 'Works with ANY ollama model - just add an endpoint for it!',
        version: '1.0.0',
        openai_compatibility: 'Now supports OpenAI-compatible endpoints for easy drop-in replacement',
        google_gemma: 'Direct access to Google Gemma model',
        endpoints: {
            public: {
                'GET /': 'This documentation page',
                'GET /health': 'Health check endpoint'
            },
            mileva_native: {
                'POST /api/llama32-1b': 'Generate text using Llama 3.2 1B model',
                'POST /api/llama32-3b': 'Generate text using Llama 3.2 3B model',
                'POST /api/gemma3-4b': 'Generate text using Gemma 3 4B model',
                'POST /api/phi3-mini': 'Generate text using Phi-3 Mini model',
                'GET /api/test-ollama': 'Test ollama functionality',
                'GET /api/ollama-status': 'Check ollama service status'
            },
            openai_compatible: {
                'POST /v1/chat/completions': 'OpenAI-compatible chat completions',
                'POST /v1/completions': 'OpenAI-compatible text completions',
                'GET /v1/models': 'List available models (OpenAI format)'
            },
            google_gemma: {
                'POST /api/google-gemma': 'Google Gemma model (cloud-based)'
            },
            note: 'Additional endpoints can be easily added for ANY installed ollama model'
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
            },
            openai_usage: {
                chat_completions: 'Use /v1/chat/completions with messages array',
                completions: 'Use /v1/completions with prompt string',
                drop_in_replacement: 'Change base URL to use local models instead of OpenAI'
            },
            google_gemma_usage: {
                simple: 'Use /api/google-gemma with input field',
                requirement: 'Requires GEMINI_API_KEY environment variable'
            }
        },
        examples: {
            'curl_example': 'curl -X POST -H "Content-Type: application/json" -H "x-api-key: YOUR_KEY" -d \'{"input":"Hello"}\' http://your-server.com/api/llama32-1b',
            'openai_chat_example': 'curl -X POST -H "Content-Type: application/json" -H "x-api-key: YOUR_KEY" -d \'{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"Hello"}]}\' http://your-server.com/v1/chat/completions',
            'openai_completion_example': 'curl -X POST -H "Content-Type: application/json" -H "x-api-key: YOUR_KEY" -d \'{"model":"text-davinci-003","prompt":"Hello"}\' http://your-server.com/v1/completions',
            'google_gemma_example': 'curl -X POST -H "Content-Type: application/json" -H "x-api-key: YOUR_KEY" -d \'{"contents":[{"role":"user","parts":[{"text":"Hello"}]}]}\' http://your-server.com/api/google-gemma'
        },
        browser_usage: {
            note: 'When accessing via browser, responses are formatted for readability',
            force_json: 'Add ?format=json to any URL to get raw JSON response',
            example: 'http://your-server.com/?format=json'
        },
        how_to_add_models: {
            description: 'To add support for any other ollama model, simply create a new endpoint',
            example_code: 'app.post("/api/modelname", async (req, res) => { const result = await callOllamaAPI("model:tag", req.body.input, timeout); res.json({ result }); });',
            note: 'Replace "modelname" with your desired endpoint and "model:tag" with actual ollama model name'
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

app.use('/v1', (req, res, next) => {
    console.log(`${new Date().toISOString()} - OpenAI Compatible ${req.method} ${req.path} - IP: ${req.ip}`);
    const key = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    if (key !== API_KEY) {
        console.log('Invalid API key provided for OpenAI endpoint');
        return res.status(401).json({ 
            error: {
                message: 'Invalid API key provided',
                type: 'invalid_request_error',
                code: 'invalid_api_key'
            }
        });
    }
    next();
});

app.get('/v1/models', (req, res) => {
    const models = [
        {
            id: 'gpt-3.5-turbo',
            object: 'model',
            created: 1686935002,
            owned_by: 'mileva-local',
            permission: [],
            root: 'gpt-3.5-turbo',
            parent: null,
            description: 'Powered by Llama 3.2 3B locally'
        },
        {
            id: 'gpt-4',
            object: 'model',
            created: 1686935002,
            owned_by: 'mileva-local',
            permission: [],
            root: 'gpt-4',
            parent: null,
            description: 'Powered by Gemma 3 4B locally'
        },
        {
            id: 'gpt-4o-mini',
            object: 'model',
            created: 1686935002,
            owned_by: 'mileva-local',
            permission: [],
            root: 'gpt-4o-mini',
            parent: null,
            description: 'Powered by Llama 3.2 1B locally'
        },
        {
            id: 'text-davinci-003',
            object: 'model',
            created: 1686935002,
            owned_by: 'mileva-local',
            permission: [],
            root: 'text-davinci-003',
            parent: null,
            description: 'Powered by Llama 3.2 3B locally'
        }
    ];
    
    res.json({
        object: 'list',
        data: models
    });
});

app.post('/v1/chat/completions', async (req, res) => {
    try {
        const { model, messages, temperature = 0.7, max_tokens, stream = false } = req.body;
        
        if (!model || !messages) {
            return res.status(400).json({
                error: {
                    message: 'Missing required parameters: model and messages',
                    type: 'invalid_request_error',
                    code: 'missing_required_parameter'
                }
            });
        }

        if (stream) {
            return res.status(400).json({
                error: {
                    message: 'Streaming is not supported yet',
                    type: 'invalid_request_error',
                    code: 'unsupported_parameter'
                }
            });
        }

        const ollamaModel = mapModelName(model);
        const prompt = convertMessagesToPrompt(messages);
        
        console.log(`Processing OpenAI chat completion for model: ${model} (${ollamaModel})`);
        console.log(`Messages converted to prompt: ${prompt.substring(0, 100)}...`);
        
        const startTime = Date.now();
        const result = await callOllamaAPI(ollamaModel, prompt, 180000);
        const endTime = Date.now();
        
        const response = {
            id: `chatcmpl-${Date.now()}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: model,
            choices: [
                {
                    index: 0,
                    message: {
                        role: 'assistant',
                        content: result
                    },
                    finish_reason: 'stop'
                }
            ],
            usage: {
                prompt_tokens: Math.ceil(prompt.length / 4),
                completion_tokens: Math.ceil(result.length / 4),
                total_tokens: Math.ceil((prompt.length + result.length) / 4)
            },
            system_fingerprint: `mileva-${ollamaModel}`,
            local_info: {
                ollama_model: ollamaModel,
                processing_time_ms: endTime - startTime,
                server: 'mileva-local'
            }
        };
        
        console.log('OpenAI chat completion successful');
        res.json(response);
        
    } catch (error) {
        console.error('OpenAI chat completion error:', error.message);
        
        if (error.message.includes('timeout')) {
            return res.status(408).json({
                error: {
                    message: 'Request timed out - model took too long to respond',
                    type: 'timeout_error',
                    code: 'timeout'
                }
            });
        }
        
        return res.status(500).json({
            error: {
                message: error.message,
                type: 'internal_error',
                code: 'model_error'
            }
        });
    }
});

app.post('/v1/completions', async (req, res) => {
    try {
        const { model, prompt, temperature = 0.7, max_tokens, stream = false } = req.body;
        
        if (!model || !prompt) {
            return res.status(400).json({
                error: {
                    message: 'Missing required parameters: model and prompt',
                    type: 'invalid_request_error',
                    code: 'missing_required_parameter'
                }
            });
        }

        if (stream) {
            return res.status(400).json({
                error: {
                    message: 'Streaming is not supported yet',
                    type: 'invalid_request_error',
                    code: 'unsupported_parameter'
                }
            });
        }

        const ollamaModel = mapModelName(model);
        
        console.log(`Processing OpenAI completion for model: ${model} (${ollamaModel})`);
        console.log(`Prompt: ${prompt.substring(0, 100)}...`);
        
        const startTime = Date.now();
        const result = await callOllamaAPI(ollamaModel, prompt, 180000);
        const endTime = Date.now();
        
        const response = {
            id: `cmpl-${Date.now()}`,
            object: 'text_completion',
            created: Math.floor(Date.now() / 1000),
            model: model,
            choices: [
                {
                    text: result,
                    index: 0,
                    logprobs: null,
                    finish_reason: 'stop'
                }
            ],
            usage: {
                prompt_tokens: Math.ceil(prompt.length / 4),
                completion_tokens: Math.ceil(result.length / 4),
                total_tokens: Math.ceil((prompt.length + result.length) / 4)
            },
            local_info: {
                ollama_model: ollamaModel,
                processing_time_ms: endTime - startTime,
                server: 'mileva-local'
            }
        };
        
        console.log('OpenAI completion successful');
        res.json(response);
        
    } catch (error) {
        console.error('OpenAI completion error:', error.message);
        
        if (error.message.includes('timeout')) {
            return res.status(408).json({
                error: {
                    message: 'Request timed out - model took too long to respond',
                    type: 'timeout_error',
                    code: 'timeout'
                }
            });
        }
        
        return res.status(500).json({
            error: {
                message: error.message,
                type: 'internal_error',
                code: 'model_error'
            }
        });
    }
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
                keep_alive: -1,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                    num_ctx: 4096
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
        const result = await callOllamaAPI('llama3.2:1b', input, 180000);
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

app.post('/api/gemma3-4b', async (req, res) => {
    const input = req.body.input;
    if (!input) return res.status(400).json({ error: 'Missing input' });

    console.log(`Processing gemma3-4b request with input: ${input.substring(0, 100)}...`);

    try {
        const result = await callOllamaAPI('gemma3:4b', input, 150000);
        console.log('Gemma3-4b request completed successfully');
        res.json({ result: result });
    } catch (error) {
        console.error('Gemma3-4b error:', error.message);
        
        if (error.message.includes('timeout')) {
            return res.status(408).json({ error: error.message });
        }
        
        return res.status(500).json({ error: error.message });
    }
});

app.post('/api/phi3-mini', async (req, res) => {
    const input = req.body.input;
    if (!input) return res.status(400).json({ error: 'Missing input' });

    console.log(`Processing phi3-mini request with input: ${input.substring(0, 100)}...`);

    try {
        const result = await callOllamaAPI('phi3:mini', input, 120000);
        console.log('Phi3-mini request completed successfully');
        res.json({ result: result });
    } catch (error) {
        console.error('Phi3-mini error:', error.message);
        
        if (error.message.includes('timeout')) {
            return res.status(408).json({ error: error.message });
        }
        
        return res.status(500).json({ error: error.message });
    }
});

app.get('/api/test-ollama', async (req, res) => {
    console.log('Testing ollama API with simple command...');
    
    try {
        const startTime = Date.now();
        const result = await callOllamaAPI('llama3.2:1b', 'Say hello', 30000);
        const duration = Date.now() - startTime;
        
        res.json({ 
            success: true, 
            result: result,
            duration_ms: duration,
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

app.get('/api/test-complex', async (req, res) => {
    console.log('Testing ollama with a complex prompt...');
    
    try {
        const startTime = Date.now();
        const result = await callOllamaAPI('llama3.2:1b', 'Write a simple function in Python that adds two numbers', 120000);
        const duration = Date.now() - startTime;
        
        res.json({ 
            success: true, 
            result: result,
            duration_ms: duration,
            message: 'Complex prompt test completed',
            method: 'REST API'
        });
    } catch (error) {
        console.error('Complex test error:', error.message);
        res.status(500).json({ 
            error: error.message,
            method: 'REST API',
            api_url: OLLAMA_API_URL,
            suggestion: 'Try restarting ollama service: ollama serve'
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

async function callGoogleGemmaAPI(requestBody) {
    try {
        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY environment variable not set');
        }

        const ai = new GoogleGenAI({
            apiKey: GEMINI_API_KEY,
        });
        
        const config = {
            responseMimeType: 'text/plain',
        };
        
        const model = 'gemma-3n-e4b-it';

        let contents;
        
        if (requestBody.prompt) {
            contents = [
                {
                    role: 'user',
                    parts: [
                        {
                            text: requestBody.prompt,
                        },
                    ],
                },
            ];
        } else if (requestBody.contents) {
            contents = requestBody.contents;
        } else {
            contents = requestBody;
        }

        console.log(`Calling Google Gemma API with request: ${JSON.stringify({ contents }).substring(0, 200)}...`);
        
        const response = await ai.models.generateContentStream({
            model,
            config,
            contents,
        });
        
        let result = '';
        for await (const chunk of response) {
            if (chunk.text) {
                result += chunk.text;
            }
        }
        
        console.log('Google Gemma API response received');
        return result;
        
    } catch (error) {
        console.error('Google Gemma API error:', error.message);
        throw error;
    }
}

app.post('/api/google-gemma', async (req, res) => {
    console.log(`Processing Google Gemma request with body: ${JSON.stringify(req.body).substring(0, 100)}...`);
    
    try {
        const result = await callGoogleGemmaAPI(req.body);
        console.log('Google Gemma request completed successfully');
        res.json({ 
            result: result,
            model: 'gemma-3n-e4b-it',
            provider: 'google'
        });
    } catch (error) {
        console.error('Google Gemma error:', error.message);
        
        if (error.message.includes('GEMINI_API_KEY')) {
            return res.status(500).json({ 
                error: 'Google API key not configured. Set GEMINI_API_KEY environment variable.' 
            });
        }
        
        return res.status(500).json({ error: error.message });
    }
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mileva API server running on port ${PORT}`);
    console.log(`Purpose: Testing and accessing ANY installed Ollama model`);
    console.log(`API key to use: ${API_KEY}`);
    console.log(`Documentation: http://localhost:${PORT}/`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Ollama test: http://localhost:${PORT}/api/test-ollama`);
    console.log(`Ollama status: http://localhost:${PORT}/api/ollama-status`);
    console.log(`\nTo add new models: Just create new endpoints following the pattern!`);
});
