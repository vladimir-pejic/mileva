import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { access, constants } from 'fs';

const execAsync = promisify(exec);
const accessAsync = promisify(access);

async function diagnoseDeployment() {
    console.log('🔍 Diagnosing deployment environment...\n');
    
    console.log('1. Node.js Environment:');
    console.log(`   Node version: ${process.version}`);
    console.log(`   Platform: ${process.platform}`);
    console.log(`   Architecture: ${process.arch}`);
    console.log(`   Working directory: ${process.cwd()}`);
    console.log(`   User: ${process.env.USER || process.env.USERNAME || 'unknown'}`);
    console.log(`   Home: ${process.env.HOME || 'unknown'}`);
    console.log(`   PATH: ${process.env.PATH}\n`);
    
    console.log('2. Ollama Installation:');
    try {
        const { stdout: version } = await execAsync('ollama --version');
        console.log(`   ✅ Ollama version: ${version.trim()}`);
        
        const { stdout: location } = await execAsync('which ollama');
        console.log(`   ✅ Ollama location: ${location.trim()}`);
        
        try {
            await accessAsync(location.trim(), constants.F_OK | constants.X_OK);
            console.log(`   ✅ Ollama is executable`);
        } catch {
            console.log(`   ❌ Ollama is not executable`);
        }
        
    } catch (error) {
        console.log(`   ❌ Ollama not found: ${error.message}`);
    }
    
    console.log('\n3. Ollama Service:');
    try {
        const { stdout: list } = await execAsync('ollama list');
        console.log(`   ✅ Ollama service is running`);
        console.log(`   Available models:`);
        console.log(list.split('\n').map(line => `     ${line}`).join('\n'));
    } catch (error) {
        console.log(`   ❌ Ollama service issue: ${error.message}`);
    }
    
    console.log('\n4. Testing Simple Ollama Command:');
    try {
        console.log('   Testing: ollama run llama3.2:1b "test"');
        const start = Date.now();
        const { stdout: result } = await execAsync('ollama run llama3.2:1b "test"', { timeout: 30000 });
        const duration = Date.now() - start;
        console.log(`   ✅ Command completed in ${duration}ms`);
        console.log(`   Result: ${result.trim().substring(0, 100)}...`);
    } catch (error) {
        console.log(`   ❌ Command failed: ${error.message}`);
        if (error.code === 'ETIMEDOUT') {
            console.log(`   ❌ Command timed out after 30 seconds`);
        }
    }
    
    console.log('\n5. Testing with Different Shell:');
    try {
        const { stdout: result } = await execAsync('ollama run llama3.2:1b "test"', { 
            shell: '/bin/bash',
            timeout: 30000 
        });
        console.log(`   ✅ Bash shell works`);
    } catch (error) {
        console.log(`   ❌ Bash shell failed: ${error.message}`);
    }
    
    console.log('\n6. Process Limits:');
    try {
        const { stdout: limits } = await execAsync('ulimit -a');
        console.log('   Current limits:');
        console.log(limits.split('\n').map(line => `     ${line}`).join('\n'));
    } catch (error) {
        console.log(`   ❌ Could not check limits: ${error.message}`);
    }
    
    console.log('\n7. Testing with spawn (alternative approach):');
    return new Promise((resolve) => {
        const child = spawn('ollama', ['run', 'llama3.2:1b', 'test'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        const timeout = setTimeout(() => {
            child.kill('SIGKILL');
            console.log('   ❌ Spawn approach timed out');
            resolve();
        }, 30000);
        
        child.on('close', (code) => {
            clearTimeout(timeout);
            if (code === 0) {
                console.log(`   ✅ Spawn approach works: ${stdout.trim().substring(0, 100)}...`);
            } else {
                console.log(`   ❌ Spawn approach failed with code ${code}: ${stderr}`);
            }
            resolve();
        });
        
        child.on('error', (error) => {
            clearTimeout(timeout);
            console.log(`   ❌ Spawn approach error: ${error.message}`);
            resolve();
        });
    });
}

diagnoseDeployment().catch(console.error); 