# Mileva API Server

A REST API server for testing and accessing **ANY installed Ollama model** via HTTP endpoints. This server provides easy HTTP access to Ollama's AI models with proper authentication and error handling.

> **🧪 Testing Purpose**: This server is designed for testing and experimentation with any Ollama model. Adding support for new models is as simple as creating a new endpoint!

## 🚀 Features

- **Universal Model Support**: Works with ANY installed Ollama model (currently includes Llama 3.2 1B and 3B)
- **Easy Model Addition**: Add new models by simply creating new endpoints
- **REST API Interface**: Clean HTTP API instead of CLI commands
- **Testing Focused**: Perfect for experimenting with different models
- **Authentication**: API key protection for model endpoints
- **Error Handling**: Comprehensive error handling and timeouts
- **Health Monitoring**: Built-in health checks and diagnostics
- **Auto-restart**: Process management with automatic restart on crashes
- **Comprehensive Logging**: Detailed logging for debugging

## 📋 Prerequisites

- **Node.js** v18+ 
- **Ollama** installed and running
- **Any Ollama models** you want to test (examples use Llama 3.2 1B and 3B)

### Installing Ollama

```bash
# Install Ollama (Linux/macOS)
curl -fsSL https://ollama.ai/install.sh | sh

# Pull required models
ollama pull llama3.2:1b
ollama pull llama3.2:3b

# Start ollama service
ollama serve
```

## 🛠️ Installation

1. **Clone or download the project files**
2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
# Create .env file
echo "PORT=3000" > .env
echo "API_KEY=your-secret-api-key-here" >> .env
```

## ⚡ Quick Start

1. **Check if Ollama is working:**
```bash
npm run check-service
```

2. **Start the server:**
```bash
npm start
# Or with auto-restart:
npm run start:managed
```

3. **Test the API:**
```bash
# Check server status
curl http://localhost:3000/

# Test with your API key
curl -X POST -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-api-key-here" \
  -d '{"input":"Hello, how are you?"}' \
  http://localhost:3000/api/llama32-1b
```

## 🔗 API Endpoints

### Public Endpoints (No API Key Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API documentation and endpoint listing |
| `GET` | `/health` | Health check with timestamp |

### Protected Endpoints (API Key Required)

| Method | Endpoint | Description | Timeout |
|--------|----------|-------------|---------|
| `POST` | `/api/llama32-1b` | Generate text using Llama 3.2 1B model | 60s |
| `POST` | `/api/llama32-3b` | Generate text using Llama 3.2 3B model | 120s |
| `GET` | `/api/test-ollama` | Test ollama functionality | 30s |
| `GET` | `/api/ollama-status` | Check ollama service status | - |

### Request Format

```bash
curl -X POST http://your-server.com/api/llama32-1b \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"input": "Your prompt here"}'
```

### Response Format

**Success Response:**
```json
{
  "result": "Generated text response from the model"
}
```

**Error Response:**
```json
{
  "error": "Error description"
}
```

## 🔧 Development Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start the server normally |
| `npm run start:managed` | Start with auto-restart on crashes |
| `npm run dev` | Start in development mode with file watching |
| `npm run health` | Check server health |
| `npm run check-ollama` | Verify ollama CLI installation |
| `npm run check-service` | Check if ollama service is running |
| `npm run diagnose` | Full environment diagnostics |

## 🚀 Adding New Models

**Adding support for any ollama model is incredibly easy!** Just follow this pattern:

### 1. Check available models:
```bash
ollama list
```

### 2. Add a new endpoint:
```javascript
app.post('/api/your-model-name', async (req, res) => {
    const input = req.body.input;
    if (!input) return res.status(400).json({ error: 'Missing input' });

    console.log(`Processing your-model-name request with input: ${input.substring(0, 100)}...`);
    
    try {
        // Replace 'model:tag' with your actual model name from 'ollama list'
        const result = await callOllamaAPI('model:tag', input, 60000);
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

### 3. Examples for popular models:
```javascript
// For CodeLlama
app.post('/api/codellama', async (req, res) => {
    // ... same pattern with callOllamaAPI('codellama:latest', input, 60000)
});

// For Mistral
app.post('/api/mistral', async (req, res) => {
    // ... same pattern with callOllamaAPI('mistral:latest', input, 60000)
});

// For any other model
app.post('/api/modelname', async (req, res) => {
    // ... same pattern with callOllamaAPI('actual-model:tag', input, 60000)
});
```

**That's it!** The server architecture handles everything else automatically.

## 🔍 Troubleshooting

### Common Issues

1. **"Cannot connect to ollama API"**
   ```bash
   # Check if ollama service is running
   npm run check-service
   
   # Start ollama service
   ollama serve
   ```

2. **"Request timeout"**
   - Check if models are downloaded: `ollama list`
   - Ensure sufficient system resources
   - Try smaller prompts first

3. **"Invalid API Key"**
   - Verify your API key in the `.env` file
   - Ensure you're using the correct header: `x-api-key`

4. **Server crashes**
   - Use `npm run start:managed` for auto-restart
   - Check logs in `server.log`
   - Run diagnostics: `npm run diagnose`

### Diagnostic Tools

```bash
# Comprehensive environment check
npm run diagnose

# Check ollama service specifically
npm run check-service

# Test individual components
npm run check-ollama
```

## 📁 Project Structure

```
mileva-api/
├── server.js                 # Main server file
├── start-server.js          # Process manager with auto-restart
├── check-ollama.js          # Ollama CLI diagnostics
├── check-ollama-service.js  # Ollama service diagnostics
├── diagnose-deployment.js   # Full environment diagnostics
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables
└── README.md               # This file
```

## 🚦 Production Deployment

1. **Set environment variables:**
```bash
export PORT=3000
export API_KEY=your-production-api-key
```

2. **Start ollama service:**
```bash
# Background service
nohup ollama serve > ollama.log 2>&1 &
```

3. **Start the API server:**
```bash
npm run start:managed
```

4. **Set up reverse proxy (nginx/apache):**
```nginx
location /api/ {
    proxy_pass http://localhost:3000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 📊 Monitoring

- **Health Check**: `GET /health`
- **Service Status**: `GET /api/ollama-status`
- **Logs**: Check `server.log` for detailed logging
- **Process Status**: Monitor ollama and node processes

## 🔒 Security

- **API Key Authentication**: All model endpoints require valid API key
- **Rate Limiting**: Consider implementing rate limiting for production
- **Input Validation**: Server validates input before processing
- **Error Handling**: Errors are logged but sensitive details aren't exposed

## 📝 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `API_KEY` | - | Required API key for protected endpoints |

### Ollama Configuration

The server connects to ollama at `http://localhost:11434` by default. Ensure ollama service is running and accessible.

## 🤝 Contributing

1. Test your changes with `npm run diagnose`
2. Ensure all endpoints work with `npm run check-service`
3. Update documentation as needed

## 📄 License

This project is available for use and modification as needed.

---

**Need help?** Run `npm run diagnose` for comprehensive troubleshooting information. 