#!/bin/bash

echo "🚀 Starting Optimized Ollama Server..."

# Performance and memory settings for optimal speed
export OLLAMA_KEEP_ALIVE=-1                # Keep models loaded indefinitely
export OLLAMA_KV_CACHE_TYPE=q8_0          # Use 8-bit quantization for KV cache (50% memory savings)
export OLLAMA_FLASH_ATTN=1                # Enable Flash Attention for faster processing
export OLLAMA_NUM_PARALLEL=4              # Allow 4 concurrent requests
export OLLAMA_MAX_LOADED_MODELS=3         # Keep up to 3 models in memory
export OLLAMA_NUM_THREAD=8                # Use 8 CPU threads (adjust based on your CPU)

# GPU settings (uncomment if you have GPU)
# export CUDA_VISIBLE_DEVICES=0
# export OLLAMA_GPU_MEMORY_FRACTION=0.9

# CPU optimizations
export OMP_NUM_THREADS=8
export GOMP_CPU_AFFINITY="0-7"

echo "📋 Configuration:"
echo "  - Keep Alive: Indefinite (-1)"
echo "  - KV Cache: q8_0 (memory optimized)"
echo "  - Flash Attention: Enabled"
echo "  - Parallel Requests: 4"
echo "  - Max Loaded Models: 3"
echo "  - CPU Threads: 8"

# Start ollama serve in the background
echo "🔄 Starting ollama serve..."
ollama serve &
OLLAMA_PID=$!

# Wait for server to start
echo "⏳ Waiting for ollama server to initialize..."
sleep 10

# Check if server is running
if curl -s http://localhost:11434/api/version > /dev/null; then
    echo "✅ Ollama server is running!"
else
    echo "❌ Failed to start ollama server"
    exit 1
fi

# Pre-load models for faster first responses
echo "📥 Pre-loading models for instant responses..."

# Pre-load llama3.2:1b
echo "  Loading llama3.2:1b..."
curl -s -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2:1b",
    "prompt": "",
    "keep_alive": -1,
    "options": {"num_ctx": 4096}
  }' > /dev/null

# Pre-load llama3.2:3b
echo "  Loading llama3.2:3b..."
curl -s -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2:3b", 
    "prompt": "",
    "keep_alive": -1,
    "options": {"num_ctx": 4096}
  }' > /dev/null

# Pre-load phi3:mini
echo "  Loading phi3:mini..."
curl -s -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "phi3:mini",
    "prompt": "",
    "keep_alive": -1,
    "options": {"num_ctx": 4096}
  }' > /dev/null

# Pre-load gemma3:4b
echo "  Loading gemma3:4b..."
curl -s -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemma3:4b",
    "prompt": "",
    "keep_alive": -1,
    "options": {"num_ctx": 4096}
  }' > /dev/null

echo "✅ All models pre-loaded and ready for instant responses!"
echo ""
echo "🎯 Performance Tips:"
echo "  - Models will stay loaded indefinitely for fastest responses"
echo "  - Consistent 4096 context size prevents model reloading"
echo "  - 8-bit KV cache reduces memory usage by ~50%"
echo "  - Flash Attention provides faster processing"
echo ""
echo "🔍 Monitor performance:"
echo "  - Check loaded models: curl http://localhost:11434/api/tags"
echo "  - Check memory usage: htop or nvidia-smi"
echo "  - View logs: journalctl -u ollama -f"
echo ""
echo "🚀 Ollama is now optimized and ready for maximum performance!"

# Keep the script running (so ollama doesn't exit)
wait $OLLAMA_PID 