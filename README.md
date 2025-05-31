# Mileva API Server

A simple REST API server that lets you access any Ollama model through HTTP endpoints. I built this because I wanted to test different AI models without dealing with command line interfaces every time.

The server currently supports Llama 3.2 (1B and 3B), Gemma 3 4B, and Phi-3 Mini models, but you can easily add any Ollama model by creating new endpoints.

**NEW**: Now includes OpenAI-compatible API endpoints, so you can use your existing OpenAI code with local models by just changing the base URL!

**ALSO NEW**: Direct access to Google's Gemma model through their cloud API!

## What it does

- Provides HTTP endpoints for any installed Ollama model
- **OpenAI API compatibility** - works as a drop-in replacement for OpenAI API calls
- **Google Gemma integration** - access to Google's cloud-based Gemma model
- Handles authentication with API keys
- Includes proper error handling and timeouts
- Works with browsers (formats JSON nicely) or API clients
- Automatically restarts if it crashes
- Has health checks and diagnostics built in

## Requirements

You'll need Node.js version 18 or newer, and Ollama installed and running on your machine. You'll also want to have the models downloaded that you plan to use.

For Google Gemma integration, you'll need a free Google API key.

### Getting Ollama set up

First install Ollama from their website (https://ollama.ai). Then download the models you want:

```bash
ollama pull llama3.2:1b
ollama pull llama3.2:3b
ollama pull gemma3:4b
ollama pull phi3:mini
```

Start the Ollama service:

```bash
ollama serve
```

### Getting Google API key for Gemma

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new project or select an existing one
3. Get your free API key
4. Add it to your environment variables

## Installation

1. Download or clone this project
2. Install the dependencies:

```bash
npm install
```

3. Create a .env file with your settings:

```bash
echo "PORT=3000" > .env
echo "API_KEY=your-secret-api-key-here" >> .env
echo "GEMINI_API_KEY=your-google-gemini-api-key" >> .env
```

## Getting started

Check if Ollama is working properly:

```bash
npm run check-service
```

Start the server:

```bash
npm start
```

If you want it to restart automatically when it crashes:

```bash
npm run start:managed
```

Test it out:

```bash
curl http://localhost:3000/

# Test local model
curl -X POST -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-api-key-here" \
  -d '{"input":"Hello, how are you?"}' \
  http://localhost:3000/api/llama32-1b

# Test Google Gemma
curl -X POST -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-api-key-here" \
  -d '{"input":"Hello, how are you?"}' \
  http://localhost:3000/api/google-gemma
```

## Available endpoints

### Public endpoints (no API key needed)

- `GET /` - Shows documentation and available endpoints
- `GET /health` - Basic health check

### Mileva native endpoints (need API key)

- `POST /api/llama32-1b` - Use Llama 3.2 1B model (3 minute timeout)
- `POST /api/llama32-3b` - Use Llama 3.2 3B model (2 minute timeout)
- `POST /api/gemma3-4b` - Use Gemma 3 4B model (2.5 minute timeout)
- `POST /api/phi3-mini` - Use Phi-3 Mini model (2 minute timeout)
- `GET /api/test-ollama` - Test basic Ollama functionality
- `GET /api/ollama-status` - Check Ollama service status

### OpenAI-compatible endpoints (need API key)

These work exactly like OpenAI's API, so you can use existing OpenAI code:

- `POST /v1/chat/completions` - Chat completions (like GPT-3.5/4)
- `POST /v1/completions` - Text completions (like text-davinci-003)
- `GET /v1/models` - List available models

### Google Gemma endpoint (need API key + Google API key)

Direct access to Google's cloud-based Gemma model:

- `POST /api/google-gemma` - Google Gemma 3N E4B IT model

### How to use the native API

Send a POST request with your prompt:

```bash
curl -X POST http://localhost:3000/api/llama32-1b \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"input": "Your prompt here"}'
```

### How to use the OpenAI-compatible API

**Chat Completions (recommended):**

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ]
  }'
```

**Text Completions:**

```bash
curl -X POST http://localhost:3000/v1/completions \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "model": "text-davinci-003",
    "prompt": "Hello, how are you?"
  }'
```

### How to use Google Gemma

The Google Gemma endpoint accepts multiple request formats:

**Simple prompt format (like OpenAI):**

```bash
curl -X POST http://localhost:3000/api/google-gemma \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "prompt": "Hello, how are you?",
    "temperature": 0.2,
    "top_p": 0.8,
    "max_tokens": 256
  }'
```

**Google's native format:**

```bash
curl -X POST http://localhost:3000/api/google-gemma \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "contents": [
      {
        "role": "user",
        "parts": [
          {"text": "Hello, how are you?"}
        ]
      }
    ]
  }'
```

**Model mapping:**

The server automatically maps OpenAI model names to local models:
- `gpt-3.5-turbo` → `llama3.2:3b`
- `gpt-4`, `gpt-4-turbo`, `gpt-4o` → `gemma3:4b`
- `gpt-4o-mini` → `llama3.2:1b`
- `text-davinci-003` → `llama3.2:3b`
- `code-davinci-002` → `phi3:mini`

You'll get back either:

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant", 
        "content": "The AI model's response"
      }
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

Or if something went wrong:

```json
{
  "error": {
    "message": "Error description",
    "type": "error_type"
  }
}
```

## Using with existing OpenAI code

If you have existing code that uses OpenAI, you can easily switch to local models:

**Python (openai library):**

```python
import openai

# Instead of:
# openai.api_key = "sk-..."
# openai.api_base = "https://api.openai.com/v1"

# Use:
openai.api_key = "your-secret-api-key-here"
openai.api_base = "http://localhost:3000/v1"

# Your existing code works the same!
response = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

**Node.js:**

```javascript
// Instead of pointing to OpenAI
const response = await fetch('http://localhost:3000/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'your-secret-api-key-here'
    },
    body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello!' }]
    })
});
```

## Available commands

- `npm start` - Start the server normally
- `npm run start:managed` - Start with automatic restart
- `npm run dev` - Start in development mode
- `npm run health` - Check if the server is healthy
- `npm run check-ollama` - Verify Ollama CLI works
- `npm run check-service` - Check if Ollama service is running
- `npm run diagnose` - Run full diagnostics
- `npm run optimize-ollama` - Start Ollama with performance optimizations

## Adding new models

This is really easy. Just check what models you have:

```bash
ollama list
```

Then add a new endpoint in server.js:

```javascript
app.post('/api/your-model-name', async (req, res) => {
    const input = req.body.input;
    if (!input) return res.status(400).json({ error: 'Missing input' });

    console.log(`Processing your-model-name request with input: ${input.substring(0, 100)}...`);
    
    try {
        const result = await callOllamaAPI('actual-model:tag', input, 60000);
        console.log('Your-model-name request completed successfully');
        res.json({ result: result });
    } catch (error) {
        console.error('Your-model-name error:', error.message);
        
        if (error.message.includes('timeout')) {
            return res.status(408).json({ error: error.message });
        }
        
        return res.status(500).json({ error: error.message });
    }
});
```

Replace 'your-model-name' with whatever you want the endpoint to be called, and 'actual-model:tag' with the real model name from your ollama list.

**To add OpenAI model mappings**, edit the `mapModelName` function in server.js:

```javascript
function mapModelName(openaiModel) {
    const modelMap = {
        'gpt-3.5-turbo': 'llama3.2:3b',
        'your-new-model': 'your-ollama-model:tag',
        // ... existing mappings
    };
    return modelMap[openaiModel] || 'llama3.2:3b';
}
```

## Performance optimization

For better performance, you can start Ollama with optimized settings:

```bash
npm run optimize-ollama
```

This configures Ollama to:
- Keep models loaded in memory so they don't have to reload every time
- Use optimized memory settings to reduce RAM usage by about 50%
- Handle multiple requests at once
- Use faster processing when your hardware supports it

The difference is pretty significant. Without optimization, every request takes 5-10 seconds because the model has to load. With optimization, the first request still takes 5-10 seconds, but subsequent requests only take 0.5-2 seconds.

If you want to set this up manually:

```bash
export OLLAMA_KEEP_ALIVE=-1
export OLLAMA_KV_CACHE_TYPE=q8_0
export OLLAMA_FLASH_ATTN=1
export OLLAMA_NUM_PARALLEL=4
ollama serve
```

## Model comparison

**Local models (Ollama):**
- ✅ Free to use
- ✅ Complete privacy (no data sent externally)
- ✅ Works offline
- ❌ Requires good hardware
- ❌ Limited by local compute power

**Google Gemma (cloud):**
- ✅ Very powerful and fast
- ✅ Free tier available
- ✅ No local compute needed
- ❌ Requires internet
- ❌ Data sent to Google
- ❌ Rate limits apply

**OpenAI-compatible (local models):**
- ✅ Drop-in replacement for existing code
- ✅ Same benefits as local models
- ✅ Familiar API format

## Troubleshooting

**"Cannot connect to ollama API"**

Check if Ollama is running:

```bash
npm run check-service
```

Start it if it's not:

```bash
ollama serve
```

Or with optimizations:

```bash
npm run optimize-ollama
```

**"Request timeout"**

Make sure your models are downloaded and you have enough system resources. Try a shorter prompt first to see if it works.

**"Invalid API Key"**

Check your .env file and make sure you're sending the API key in the x-api-key header.

**"Google API key not configured"**

Make sure you have GEMINI_API_KEY set in your .env file:

```bash
echo "GEMINI_API_KEY=your-google-api-key" >> .env
```

**Server keeps crashing**

Use the managed start option:

```bash
npm run start:managed
```

This will automatically restart the server if it crashes. Check server.log for error details.

## Project structure

```
mileva-api/
├── server.js                 # Main server file
├── start-server.js          # Process manager with auto-restart
├── check-ollama.js          # Ollama CLI diagnostics
├── check-ollama-service.js  # Ollama service diagnostics
├── diagnose-deployment.js   # Full environment diagnostics
├── optimize-ollama-start.sh # Optimized ollama startup script
├── optimize-ollama.md       # Complete optimization guide
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables
└── README.md               # This file
```

## Running in production

Set your environment variables:

```bash
export PORT=3000
export API_KEY=your-production-api-key
export GEMINI_API_KEY=your-google-api-key
```

Start Ollama in the background:

```bash
nohup npm run optimize-ollama > ollama.log 2>&1 &
```

Start the API server:

```bash
npm run start:managed
```

You might want to put a reverse proxy like nginx in front of it for SSL and load balancing.

## Configuration

The server connects to Ollama at http://localhost:11434 by default. It uses these environment variables:

- `PORT` (default: 3000) - What port the server runs on
- `API_KEY` - Required for accessing the model endpoints
- `GEMINI_API_KEY` - Required for Google Gemma endpoint (optional)

## Security notes

All the model endpoints require an API key. The server validates input and handles errors gracefully without exposing sensitive information. For production use, you should probably add rate limiting.

For Google Gemma endpoint, your prompts are sent to Google's servers, so be mindful of sensitive data.

## Getting help

If something isn't working, run the diagnostics:

```bash
npm run diagnose
```

This will check your whole setup and tell you what might be wrong. 