const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

async function buildScript() {
  try {
    // Lê o arquivo original
    const inputFile = path.join(__dirname, 'src', 'tracker.js');
    const code = fs.readFileSync(inputFile, 'utf8');
    
    // Configurações de minificação
    const options = {
      compress: {
        drop_console: false, // Manter console.log para debug
        drop_debugger: true,
        pure_funcs: ['console.debug'],
        passes: 2
      },
      mangle: {
        reserved: ['TrafficTracker'] // Não minificar nome principal
      },
      format: {
        comments: false, // Remove comentários
        preamble: `/* Traffic Tracker v1.0.0 | ${new Date().toISOString()} */`
      }
    };
    
    // Minifica o código
    const result = await minify(code, options);
    
    if (result.error) {
      throw result.error;
    }
    
    // Cria pasta dist se não existir
    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir);
    }
    
    // Salva arquivo minificado
    const minFile = path.join(distDir, 'tracker.min.js');
    fs.writeFileSync(minFile, result.code);
    
    // Copia arquivo original para dist
    const originalFile = path.join(distDir, 'tracker.js');
    fs.copyFileSync(inputFile, originalFile);
    
    // Estatísticas
    const originalSize = fs.statSync(inputFile).size;
    const minifiedSize = fs.statSync(minFile).size;
    const reduction = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
    
    console.log('✅ Build concluído com sucesso!');
    console.log(`📊 Tamanho original: ${(originalSize / 1024).toFixed(1)} KB`);
    console.log(`📊 Tamanho minificado: ${(minifiedSize / 1024).toFixed(1)} KB`);
    console.log(`📊 Redução: ${reduction}%`);
    
  } catch (error) {
    console.error('❌ Erro no build:', error);
    process.exit(1);
  }
}

buildScript();