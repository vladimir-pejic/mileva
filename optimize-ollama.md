# Optimizing Ollama Serve for Faster Model Loading & Response Times

## 🎯 Overview
This guide shows you how to configure `ollama serve` for maximum performance, ensuring models load faster and respond quicker.

## 🚀 1. Keep-Alive Configuration (Essential)

### Problem: Models unload after each request
By default, ollama unloads models after use, causing delays on subsequent requests.

### Solution: Use persistent keep-alive
```bash
# Option 1: Set keep-alive when starting ollama serve
OLLAMA_KEEP_ALIVE=-1 ollama serve

# Option 2: Set via environment variable
export OLLAMA_KEEP_ALIVE=-1
ollama serve

# Option 3: Set specific duration (e.g., 10 minutes)
export OLLAMA_KEEP_ALIVE=10m
ollama serve
```

### Keep-Alive Values:
- `-1`: Keep models loaded indefinitely (best for active use)
- `0`: Unload immediately after request (default, slowest)
- `5m`: Keep loaded for 5 minutes
- `1h`: Keep loaded for 1 hour

## 🧠 2. Memory Management

### Allocate Sufficient RAM/VRAM
```bash
# Check available memory
free -h
nvidia-smi  # For GPU memory

# Set memory limits (if using Docker)
docker run -d \
  --gpus all \
  -v ollama:/root/.ollama \
  -p 11434:11434 \
  --memory="16g" \
  --memory-swap="24g" \
  ollama/ollama
```

### Memory Optimization Settings
```bash
# Enable memory-efficient KV cache (reduces VRAM usage by ~50%)
export OLLAMA_KV_CACHE_TYPE=q8_0  # or q4_0 for even more savings

# Enable Flash Attention (faster processing)
export OLLAMA_FLASH_ATTN=1
```

## ⚡ 3. Pre-loading Models

### Load models into memory before use:
```bash
# Pre-load specific models
ollama pull llama3.2:1b
ollama pull llama3.2:3b
ollama pull phi3:mini
ollama pull gemma3:4b

# Load model into memory (keeps it ready)
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2:1b",
    "prompt": "",
    "keep_alive": -1
  }'
```

## 🔧 4. Concurrent Request Optimization

### Configure parallel processing:
```bash
# Set number of parallel requests (default: auto-detected)
export OLLAMA_NUM_PARALLEL=4

# Set max number of loaded models
export OLLAMA_MAX_LOADED_MODELS=3

# Set request queue size
export OLLAMA_MAX_QUEUE=512
```

## 🎛️ 5. Context Window Optimization

### Use consistent context sizes across requests:
```json
{
  "model": "llama3.2:1b",
  "prompt": "Hello",
  "options": {
    "num_ctx": 4096
  },
  "keep_alive": -1
}
```

**Important**: Inconsistent context sizes cause model reloading!

## 🖥️ 6. System-Level Optimizations

### CPU Optimizations:
```bash
# Set CPU threads (usually = CPU cores)
export OLLAMA_NUM_THREAD=8

# Enable CPU optimizations
export OMP_NUM_THREADS=8
export GOMP_CPU_AFFINITY="0-7"
```

### GPU Optimizations:
```bash
# Use all available GPUs
export CUDA_VISIBLE_DEVICES=0,1,2,3

# Enable GPU memory fraction (prevent OOM)
export OLLAMA_GPU_MEMORY_FRACTION=0.9
```

## 🛠️ 7. Complete Startup Script

Create an optimized startup script:

```bash
#!/bin/bash
# optimize-ollama-start.sh

# Memory and performance settings
export OLLAMA_KEEP_ALIVE=-1
export OLLAMA_KV_CACHE_TYPE=q8_0
export OLLAMA_FLASH_ATTN=1
export OLLAMA_NUM_PARALLEL=4
export OLLAMA_MAX_LOADED_MODELS=3
export OLLAMA_NUM_THREAD=8

# GPU settings (if available)
export CUDA_VISIBLE_DEVICES=0
export OLLAMA_GPU_MEMORY_FRACTION=0.9

# Start ollama serve
echo "🚀 Starting optimized ollama serve..."
ollama serve

# Pre-load models after startup (run in background)
(
  sleep 10  # Wait for server to start
  echo "📥 Pre-loading models..."
  
  # Pre-load your commonly used models
  curl -s -X POST http://localhost:11434/api/generate \
    -H "Content-Type: application/json" \
    -d '{"model": "llama3.2:1b", "prompt": "", "keep_alive": -1}' > /dev/null
    
  curl -s -X POST http://localhost:11434/api/generate \
    -H "Content-Type: application/json" \
    -d '{"model": "phi3:mini", "prompt": "", "keep_alive": -1}' > /dev/null
    
  echo "✅ Models pre-loaded and ready!"
) &
```

## 🔍 8. Monitoring Performance

### Check model status:
```bash
# See loaded models
curl http://localhost:11434/api/tags

# Check server status
curl http://localhost:11434/api/version
```

### Monitor resource usage:
```bash
# CPU/Memory usage
htop

# GPU usage (if applicable)
nvidia-smi -l 1

# Ollama logs
journalctl -u ollama -f
```

## 📊 9. Performance Testing

Test your optimizations:

```bash
# Time model responses
time curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2:1b",
    "prompt": "Hello, how are you?",
    "stream": false
  }'

# Multiple concurrent requests
for i in {1..5}; do
  curl -X POST http://localhost:11434/api/generate \
    -H "Content-Type: application/json" \
    -d '{"model": "llama3.2:1b", "prompt": "Test '${i}'", "stream": false}' &
done
wait
```

## 🎯 10. Quick Performance Checklist

- [ ] Set `OLLAMA_KEEP_ALIVE=-1` for persistent loading
- [ ] Use consistent context sizes across requests
- [ ] Pre-load frequently used models
- [ ] Allocate sufficient RAM/VRAM
- [ ] Enable KV cache optimization (`q8_0`)
- [ ] Configure appropriate parallel processing
- [ ] Use Flash Attention if supported
- [ ] Monitor resource usage and adjust accordingly

## 💡 Pro Tips

1. **Model Size vs Speed**: Smaller models (1B-3B) load faster than larger ones (7B+)
2. **SSD Storage**: Use fast SSD storage for model files
3. **Network**: Use local ollama instance instead of remote for best performance
4. **Batch Requests**: Group multiple requests when possible
5. **Model Choice**: Consider using quantized models (GGUF Q4/Q8) for better performance

## 🚨 Common Issues & Solutions

### Issue: "Model keeps reloading"
**Solution**: Ensure consistent context sizes and set `keep_alive: -1`

### Issue: "Out of memory errors"
**Solution**: Reduce `num_ctx`, use `q4_0` KV cache, or add more RAM

### Issue: "Slow first response"
**Solution**: Pre-load models on startup

### Issue: "High CPU usage"
**Solution**: Adjust `OLLAMA_NUM_THREAD` to match your CPU cores

This optimized setup should significantly improve your ollama performance! 🚀 