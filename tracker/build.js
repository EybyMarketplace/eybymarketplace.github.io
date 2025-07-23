const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

// Configuração dos builds
const BUILD_CONFIG = {
  // Build completo (todas as plataformas)
  full: {
    files: [
      'src/core/tracker-core.js',
      'src/adapters/shopify-adapter.js',
      'src/utils/helpers.js'
    ],
    output: 'tracker-full'
  },
  
  // Builds específicos por plataforma
  shopify: {
    files: [
      'src/core/tracker-core.js',
      'src/adapters/shopify-adapter.js',
      'src/utils/helpers.js'
    ],
    output: 'tracker-shopify'
  },
  
  // Build genérico (sem adaptadores específicos)
  generic: {
    files: [
      'src/core/tracker-core.js',
      'src/utils/helpers.js'
    ],
    output: 'tracker-generic'
  },
  
  // Build auto-detector (carrega dinamicamente)
  auto: {
    files: [
      'src/core/auto-loader.js'
    ],
    output: 'tracker-auto'
  }
};

// Configurações de minificação
const MINIFY_OPTIONS = {
  compress: {
    drop_console: false, // Manter console.log para debug
    drop_debugger: true,
    pure_funcs: ['console.debug'],
    passes: 2,
    unsafe: false
  },
  mangle: {
    reserved: [
      'InfluencerTracker',
      'shopifyAdapter'
    ]
  },
  format: {
    comments: false,
    preamble: `/* Influencer Tracker v2.0.0 | Built: ${new Date().toISOString()} */`
  }
};

async function buildScript() {
  try {
    console.log('🚀 Iniciando build do Influencer Tracker...\n');
    
    // Criar diretórios necessários
    ensureDirectories();
    
    // Obter lista de builds para processar
    const buildsToProcess = process.argv.includes('--all') ? 
      Object.keys(BUILD_CONFIG) : 
      process.argv.slice(2).filter(arg => !arg.startsWith('--')) || ['shopify']; // Default: shopify
    
    if (buildsToProcess.length === 0) {
      console.log('ℹ️  Uso: node build.js [build1] [build2] ou --all');
      console.log('ℹ️  Builds disponíveis:', Object.keys(BUILD_CONFIG).join(', '));
      return;
    }
    
    const results = [];
    
    // Processar cada build
    for (const buildName of buildsToProcess) {
      if (!BUILD_CONFIG[buildName]) {
        console.log(`⚠️  Build '${buildName}' não encontrado. Pulando...`);
        continue;
      }
      
      console.log(`📦 Processando build: ${buildName}`);
      const result = await processBuild(buildName, BUILD_CONFIG[buildName]);
      results.push(result);
    }
    
    // Gerar auto-loader se necessário
    if (buildsToProcess.includes('auto') || process.argv.includes('--all')) {
      await generateAutoLoader();
    }
    
    // Relatório final
    generateReport(results);
    
  } catch (error) {
    console.error('❌ Erro no build:', error);
    process.exit(1);
  }
}

async function processBuild(buildName, config) {
  const startTime = Date.now();
  
  // Concatenar arquivos
  let combinedCode = '';
  const existingFiles = [];
  
  for (const filePath of config.files) {
    const fullPath = path.join(__dirname, filePath);
    
    if (fs.existsSync(fullPath)) {
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      combinedCode += `\n/* === ${filePath} === */\n${fileContent}\n`;
      existingFiles.push(filePath);
    } else {
      console.log(`   ⚠️  Arquivo não encontrado: ${filePath}`);
    }
  }
  
  if (combinedCode.trim() === '') {
    throw new Error(`Nenhum arquivo válido encontrado para build '${buildName}'`);
  }
  
  // Adicionar wrapper e metadata
  const wrappedCode = wrapCode(combinedCode, buildName, existingFiles);
  
  // Salvar versão não-minificada
  const devFile = path.join(__dirname, 'dist', `${config.output}.js`);
  fs.writeFileSync(devFile, wrappedCode);
  
  // Minificar
  const minifyResult = await minify(wrappedCode, MINIFY_OPTIONS);
  
  if (minifyResult.error) {
    throw minifyResult.error;
  }
  
  // Salvar versão minificada
  const minFile = path.join(__dirname, 'dist', `${config.output}.min.js`);
  fs.writeFileSync(minFile, minifyResult.code);
  
  // Calcular estatísticas
  const originalSize = Buffer.byteLength(wrappedCode, 'utf8');
  const minifiedSize = Buffer.byteLength(minifyResult.code, 'utf8');
  const buildTime = Date.now() - startTime;
  
  console.log(`   ✅ ${buildName}: ${(originalSize / 1024).toFixed(1)} KB → ${(minifiedSize / 1024).toFixed(1)} KB (${buildTime}ms)`);
  
  return {
    name: buildName,
    files: existingFiles,
    originalSize,
    minifiedSize,
    buildTime,
    output: config.output
  };
}

function wrapCode(code, buildName, files) {
  const header = `/*!
 * Influencer Tracker - ${buildName.toUpperCase()} Build
 * Version: 2.0.0
 * Built: ${new Date().toISOString()}
 * Files: ${files.join(', ')}
 * 
 * Copyright (c) ${new Date().getFullYear()}
 * Licensed under MIT
 */

(function(window, document, undefined) {
  'use strict';
  
  // Build info
  const BUILD_INFO = {
    name: '${buildName}',
    version: '2.0.0',
    timestamp: '${new Date().toISOString()}',
    files: ${JSON.stringify(files)}
  };
  
  // Expose build info
  if (typeof window !== 'undefined') {
    window.InfluencerTrackerBuild = BUILD_INFO;
  }

${code}

})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : {});`;

  return header;
}

async function generateAutoLoader() {
  console.log('🔄 Gerando auto-loader...');
  
  const autoLoaderCode = `/*!
 * Influencer Tracker - Auto Loader
 * Detecta a plataforma e carrega o build apropriado
 */

(function() {
  'use strict';
  
  const TRACKER_CDN = 'https://eybymarketplace.github.io/traffic-tracker/dist/';
  
  function detectPlatform() {
    // Shopify
    if (window.Shopify || window.shopifyData || 
        document.querySelector('meta[name="shopify-checkout-api-token"]')) {
      return 'shopify';
    }
    
    // WooCommerce
    if (window.wc || window.woocommerce || 
        document.querySelector('body.woocommerce')) {
      return 'woocommerce';
    }
    
    // Magento
    if (window.Magento || window.checkout || 
        document.querySelector('body.catalog-product-view')) {
      return 'magento';
    }
    
    // Vtex
    if (window.vtex || window.vtexjs || 
        document.querySelector('meta[name="vtex-version"]')) {
      return 'vtex';
    }
    
    // Nuvemshop
    if (window.LS || document.querySelector('meta[name="nuvemshop"]')) {
      return 'nuvemshop';
    }
    
    return 'generic';
  }
  
  function loadTracker() {
    const platform = detectPlatform();
    const script = document.createElement('script');
    
    script.src = TRACKER_CDN + 'tracker-' + platform + '.min.js';
    script.async = true;
    script.onload = function() {
      console.log('✅ Influencer Tracker carregado para:', platform);
    };
    script.onerror = function() {
      console.warn('⚠️ Erro ao carregar tracker, tentando versão genérica...');
      const fallbackScript = document.createElement('script');
      fallbackScript.src = TRACKER_CDN + 'tracker-generic.min.js';
      fallbackScript.async = true;
      document.head.appendChild(fallbackScript);
    };
    
    document.head.appendChild(script);
  }
  
  // Carregar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadTracker);
  } else {
    loadTracker();
  }
  
})();`;

  const autoFile = path.join(__dirname, 'dist', 'tracker-auto.js');
  fs.writeFileSync(autoFile, autoLoaderCode);
  
  // Minificar auto-loader
  const minifyResult = await minify(autoLoaderCode, MINIFY_OPTIONS);
  const autoMinFile = path.join(__dirname, 'dist', 'tracker-auto.min.js');
  fs.writeFileSync(autoMinFile, minifyResult.code);
  
  console.log('   ✅ Auto-loader gerado');
}

function ensureDirectories() {
  const dirs = [
    'dist',
    'src/core',
    'src/adapters',
    'src/utils'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Criado diretório: ${dir}`);
    }
  });
}

function generateReport(results) {
  console.log('\n📊 RELATÓRIO DE BUILD');
  console.log('='.repeat(50));
  
  let totalOriginal = 0;
  let totalMinified = 0;
  
  results.forEach(result => {
    const reduction = ((result.originalSize - result.minifiedSize) / result.originalSize * 100).toFixed(1);
    
    console.log(`${result.name.padEnd(12)} | ${(result.originalSize / 1024).toFixed(1).padStart(6)} KB → ${(result.minifiedSize / 1024).toFixed(1).padStart(6)} KB | -${reduction}% | ${result.buildTime}ms`);
    
    totalOriginal += result.originalSize;
    totalMinified += result.minifiedSize;
  });
  
  console.log('-'.repeat(50));
  
  const totalReduction = ((totalOriginal - totalMinified) / totalOriginal * 100).toFixed(1);
  console.log(`TOTAL        | ${(totalOriginal / 1024).toFixed(1).padStart(6)} KB → ${(totalMinified / 1024).toFixed(1).padStart(6)} KB | -${totalReduction}%`);
  
  console.log('\n📦 Arquivos gerados em ./dist/');
  console.log('✅ Build concluído com sucesso!\n');
}

// Executar build
buildScript();