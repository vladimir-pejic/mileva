import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkOllamaStatus() {
    console.log('🔍 Checking Ollama status...\n');
    
    try {
        console.log('1. Checking if Ollama is running...');
        const { stdout: version } = await execAsync('ollama --version');
        console.log(`✅ Ollama is installed: ${version.trim()}`);
        
        console.log('\n2. Checking available models...');
        const { stdout: models } = await execAsync('ollama list');
        console.log('📋 Available models:');
        console.log(models);
        
        const requiredModels = ['llama3.2:1b', 'llama3.2:3b'];
        const availableModels = models.toLowerCase();
        
        console.log('3. Checking required models:');
        for (const model of requiredModels) {
            if (availableModels.includes(model.toLowerCase())) {
                console.log(`✅ ${model} - Available`);
            } else {
                console.log(`❌ ${model} - Missing`);
                console.log(`   Run: ollama pull ${model}`);
            }
        }
        
        console.log('\n4. Testing llama3.2:1b with a simple query...');
        try {
            const { stdout: testResult } = await execAsync('ollama run llama3.2:1b "Hello, just say hi back"', { timeout: 30000 });
            console.log(`✅ Test successful: ${testResult.trim().substring(0, 100)}...`);
        } catch (testError) {
            console.log(`❌ Test failed: ${testError.message}`);
        }
        
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('❌ Ollama is not installed or not in PATH');
            console.log('   Please install Ollama from: https://ollama.ai/');
        } else {
            console.log(`❌ Error checking Ollama: ${error.message}`);
        }
    }
}

checkOllamaStatus().catch(console.error); 