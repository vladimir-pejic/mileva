import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkOllamaService() {
    console.log('🔍 Checking Ollama service status...\n');
    
    const OLLAMA_API_URL = 'http://localhost:11434';
    
    console.log('1. Checking ollama processes:');
    try {
        const { stdout } = await execAsync('ps aux | grep ollama');
        const processes = stdout.split('\n').filter(line => 
            line.includes('ollama') && !line.includes('grep')
        );
        
        if (processes.length > 0) {
            console.log('   ✅ Ollama processes found:');
            processes.forEach(proc => console.log(`     ${proc.trim()}`));
        } else {
            console.log('   ❌ No ollama processes running');
        }
    } catch (error) {
        console.log(`   ❌ Error checking processes: ${error.message}`);
    }
    
    console.log('\n2. Checking port 11434:');
    try {
        const { stdout } = await execAsync('netstat -tlnp | grep :11434 || ss -tlnp | grep :11434');
        if (stdout.trim()) {
            console.log('   ✅ Port 11434 is listening:');
            console.log(`     ${stdout.trim()}`);
        } else {
            console.log('   ❌ Port 11434 is not listening');
        }
    } catch (error) {
        console.log('   ❌ Could not check port (ollama service might not be running)');
    }
    
    console.log('\n3. Testing ollama API connection:');
    try {
        const response = await fetch(`${OLLAMA_API_URL}/api/tags`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('   ✅ Ollama API is responding');
            console.log('   Available models:');
            if (data.models && data.models.length > 0) {
                data.models.forEach(model => {
                    console.log(`     - ${model.name} (${model.size || 'unknown size'})`);
                });
            } else {
                console.log('     No models found');
            }
        } else {
            console.log(`   ❌ Ollama API returned status: ${response.status}`);
        }
    } catch (error) {
        console.log(`   ❌ Cannot connect to ollama API: ${error.message}`);
        console.log('   💡 Try starting ollama service with: ollama serve');
    }
    
    console.log('\n4. Testing ollama API generate:');
    try {
        const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama3.2:1b',
                prompt: 'Hello',
                stream: false
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('   ✅ Ollama API generate works');
            console.log(`   Response: ${data.response?.substring(0, 100)}...`);
        } else {
            const errorText = await response.text();
            console.log(`   ❌ API generate failed (${response.status}): ${errorText}`);
        }
    } catch (error) {
        console.log(`   ❌ API generate error: ${error.message}`);
    }
    
    console.log('\n📋 Summary:');
    console.log('If ollama service is not running, start it with:');
    console.log('   ollama serve');
    console.log('');
    console.log('If you want it to run in background:');
    console.log('   nohup ollama serve > ollama.log 2>&1 &');
    console.log('');
    console.log('Check if it\'s running on startup by adding to systemd or crontab.');
}

checkOllamaService().catch(console.error); 