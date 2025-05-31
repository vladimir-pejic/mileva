#!/bin/bash

export OLLAMA_KEEP_ALIVE=-1
export OLLAMA_KV_CACHE_TYPE=q8_0
export OLLAMA_FLASH_ATTN=1
export OLLAMA_NUM_PARALLEL=4
export OLLAMA_MAX_LOADED_MODELS=3
export OLLAMA_NUM_THREAD=8

export OMP_NUM_THREADS=8
export MKL_NUM_THREADS=8
export OPENBLAS_NUM_THREADS=8
export VECLIB_MAXIMUM_THREADS=8
export NUMEXPR_NUM_THREADS=8

echo "Starting Ollama with optimizations..."
echo "Keep-alive: $OLLAMA_KEEP_ALIVE"
echo "KV Cache: $OLLAMA_KV_CACHE_TYPE"
echo "Flash Attention: $OLLAMA_FLASH_ATTN"
echo "Max Parallel: $OLLAMA_NUM_PARALLEL"
echo "Max Models: $OLLAMA_MAX_LOADED_MODELS"
echo "CPU Threads: $OLLAMA_NUM_THREAD"
echo ""

nohup ollama serve > ollama.log 2>&1 &
OLLAMA_PID=$!
echo "Ollama started with PID: $OLLAMA_PID"

sleep 5

if ps -p $OLLAMA_PID > /dev/null; then
    echo "✅ Ollama service is running"
    echo "📁 Logs: ollama.log"
    echo "🚀 API: http://localhost:11434"
else
    echo "❌ Failed to start Ollama"
    exit 1
fi

echo ""
echo "Pre-loading models for faster responses..."

echo "  Loading llama3.2:3b..."
curl -s -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2:3b",
    "prompt": "",
    "keep_alive": -1,
    "options": {"num_ctx": 4096}
  }' > /dev/null

echo "✅ Ollama optimization complete!"
echo ""
echo "Performance benefits:"
echo "- Models stay loaded indefinitely"
echo "- 50% memory savings with KV cache optimization"
echo "- Flash attention for faster processing"
echo "- Support for 4 concurrent requests"
echo "- Optimized CPU threading"
echo ""
echo "To stop: kill $OLLAMA_PID"

while true; do
    sleep 30
done
