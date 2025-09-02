const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

// Configuração dos builds
const BUILD_CONFIG = {
  // Build completo (todas as plataformas + IA)
  full: {
    files: [
      'src/core/tracker-core.js',
      'src/adapters/shopify/index.js',
      'src/ai/ai-data-collector.js',
      'src/utils/helpers.js'
    ],
    output: 'tracker-full'
  },
  
  // Builds específicos por plataforma com IA
  shopify: {
    files: [
      'src/core/tracker-core.js',
      'src/adapters/shopify/index.js',
      'src/ai/ai-data-collector.js',
      'src/utils/helpers.js'
    ],
    output: 'tracker-shopify'
  },
  
  // Build Shopify sem IA (mais leve)
  'shopify-lite': {
    files: [
      'src/core/tracker-core.js',
      'src/adapters/shopify/index.js',
      'src/utils/helpers.js'
    ],
    output: 'tracker-shopify-lite'
  },
  
  // Build genérico com IA
  generic: {
    files: [
      'src/core/tracker-core.js',
      'src/ai/ai-data-collector.js',
      'src/utils/helpers.js'
    ],
    output: 'tracker-generic'
  },
  
  // Build apenas IA (para usar com tracker existente)
  'ai-only': {
    files: [
      'src/ai/ai-data-collector.js'
    ],
    output: 'tracker-ai-addon'
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
      'shopifyAdapter',
      'AIDataCollector',
      'UserProfiler',
      'BehaviorAnalyzer',
      'CustomerJourneyAnalyzer'
    ]
  },
  format: {
    comments: false,
    preamble: `/* Influencer Tracker v2.1.0 with AI | Built: ${new Date().toISOString()} */`
  }
};

async function buildScript() {
  try {
    console.log('🚀 Iniciando build do Influencer Tracker v2.1.0 (com IA)...\n');
    
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
    
    // Gerar documentação de builds
    generateBuildDocs(results);
    
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
  
  const hasAI = existingFiles.some(file => file.includes('ai/'));
  const aiIndicator = hasAI ? ' 🤖' : '';
  
  console.log(`   ✅ ${buildName}${aiIndicator}: ${(originalSize / 1024).toFixed(1)} KB → ${(minifiedSize / 1024).toFixed(1)} KB (${buildTime}ms)`);
  
  return {
    name: buildName,
    files: existingFiles,
    originalSize,
    minifiedSize,
    buildTime,
    output: config.output,
    hasAI
  };
}

function wrapCode(code, buildName, files) {
  const hasAI = files.some(file => file.includes('ai/'));
  
  const header = `/*!
 * Influencer Tracker - ${buildName.toUpperCase()} Build
 * Version: 2.1.0${hasAI ? ' with AI Analytics' : ''}
 * Built: ${new Date().toISOString()}
 * Files: ${files.join(', ')}
 * 
 * Features:
 * - Event Tracking ✅
 * - Affiliate Attribution ✅
 * - Platform Adapters ✅${hasAI ? '\n * - AI Behavioral Analysis 🤖\n * - Customer Journey Mapping 🤖\n * - Conversion Prediction 🤖' : ''}
 * 
 * Copyright (c) ${new Date().getFullYear()}
 * Licensed under MIT
 */

(function(window, document, undefined) {
  'use strict';
  
  // Build info
  const BUILD_INFO = {
    name: '${buildName}',
    version: '2.1.0',
    timestamp: '${new Date().toISOString()}',
    files: ${JSON.stringify(files)},
    features: {
      tracking: true,
      attribution: true,
      adapters: true,
      ai: ${hasAI}
    }
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
 * Influencer Tracker - Auto Loader v2.1.0
 * Detecta a plataforma e carrega o build apropriado (com ou sem IA)
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
  
  function shouldLoadAI() {
    // Verificar se IA está habilitada via query param ou config
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tracker_ai') === 'false') return false;
    if (urlParams.get('tracker_ai') === 'true') return true;
    
    // Verificar configuração global
    if (window.InfluencerTrackerConfig?.enableAI === false) return false;
    if (window.InfluencerTrackerConfig?.enableAI === true) return true;
    
    // Default: carregar IA (pode ser mudado para false se preferir)
    return true;
  }
  
  function loadTracker() {
    const platform = detectPlatform();
    const useAI = shouldLoadAI();
    const script = document.createElement('script');
    
    // Escolher versão com ou sem IA
    let scriptName = 'tracker-' + platform;
    if (platform === 'shopify' && !useAI) {
      scriptName = 'tracker-shopify-lite';
    }
    
    script.src = TRACKER_CDN + scriptName + '.min.js';
    script.async = true;
    script.onload = function() {
      const aiStatus = useAI ? 'com IA 🤖' : 'sem IA';
      console.log(\`✅ Influencer Tracker carregado para: \${platform} (\${aiStatus})\`);
      
      // Carregar addon de IA separadamente se necessário
      if (useAI && platform !== 'shopify') {
        loadAIAddon();
      }
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
  
  function loadAIAddon() {
    const aiScript = document.createElement('script');
    aiScript.src = TRACKER_CDN + 'tracker-ai-addon.min.js';
    aiScript.async = true;
    aiScript.onload = function() {
      console.log('🤖 Módulo de IA carregado separadamente');
    };
    document.head.appendChild(aiScript);
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
    'src/ai',
    'src/utils',
    'docs'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Criado diretório: ${dir}`);
    }
  });
}

function generateBuildDocs(results) {
  const docsContent = `# Influencer Tracker v2.1.0 - Builds Disponíveis

Gerado em: ${new Date().toISOString()}

## 📦 Builds Disponíveis

${results.map(result => {
  const aiStatus = result.hasAI ? '🤖 **Com IA**' : '📊 Sem IA';
  return `### ${result.name}
- **Arquivo**: \`${result.output}.min.js\`
- **Tamanho**: ${(result.minifiedSize / 1024).toFixed(1)} KB (minificado)
- **Recursos**: ${aiStatus}
- **Arquivos incluídos**: ${result.files.join(', ')}
`;
}).join('\n')}

## 🚀 Como Usar

### Opção 1: Auto-loader (Recomendado)
\`\`\`html
<script src="https://eybymarketplace.github.io/traffic-tracker/dist/tracker-auto.min.js"></script>
\`\`\`

### Opção 2: Build Específico
\`\`\`html
<!-- Shopify com IA -->
<script src="https://eybymarketplace.github.io/traffic-tracker/dist/tracker-shopify.min.js"></script>

<!-- Shopify sem IA (mais leve) -->
<script src="https://eybymarketplace.github.io/traffic-tracker/dist/tracker-shopify-lite.min.js"></script>
\`\`\`

### Opção 3: Addon de IA Separado
\`\`\`html
<!-- Carregar tracker básico -->
<script src="https://eybymarketplace.github.io/traffic-tracker/dist/tracker-shopify-lite.min.js"></script>
<!-- Adicionar IA depois -->
<script src="https://eybymarketplace.github.io/traffic-tracker/dist/tracker-ai-addon.min.js"></script>
\`\`\`

## ⚙️ Configuração

\`\`\`javascript
// Configurar antes de carregar o script
window.InfluencerTrackerConfig = {
  enableAI: true, // ou false para desabilitar IA
  apiEndpoint: 'https://sua-api.com/events',
  projectId: 'seu_projeto_id'
};
\`\`\`

## 🤖 Recursos de IA

Quando habilitada, a IA fornece:
- Segmentação comportamental automática
- Predição de probabilidade de conversão
- Análise de qualidade de engajamento
- Mapeamento da jornada do cliente
- Métricas de performance de afiliados
`;

  const docsFile = path.join(__dirname, 'docs', 'builds.md');
  fs.writeFileSync(docsFile, docsContent);
  console.log('📚 Documentação gerada em docs/builds.md');
}

function generateReport(results) {
  console.log('\n📊 RELATÓRIO DE BUILD v2.1.0');
  console.log('='.repeat(60));
  
  let totalOriginal = 0;
  let totalMinified = 0;
  
  results.forEach(result => {
    const reduction = ((result.originalSize - result.minifiedSize) / result.originalSize * 100).toFixed(1);
    const aiIcon = result.hasAI ? '🤖' : '📊';
    
    console.log(`${(result.name + ' ' + aiIcon).padEnd(20)} | ${(result.originalSize / 1024).toFixed(1).padStart(6)} KB → ${(result.minifiedSize / 1024).toFixed(1).padStart(6)} KB | -${reduction}% | ${result.buildTime}ms`);
    
    totalOriginal += result.originalSize;
    totalMinified += result.minifiedSize;
  });
  
  console.log('-'.repeat(60));
  
  const totalReduction = ((totalOriginal - totalMinified) / totalOriginal * 100).toFixed(1);
  console.log(`TOTAL                | ${(totalOriginal / 1024).toFixed(1).padStart(6)} KB → ${(totalMinified / 1024).toFixed(1).padStart(6)} KB | -${totalReduction}%`);
  
  console.log('\n📦 Arquivos gerados em ./dist/');
  console.log('📚 Documentação em ./docs/');
  console.log('✅ Build concluído com sucesso!\n');
  
  // Mostrar recomendações
  console.log('💡 RECOMENDAÇÕES:');
  console.log('   • Use tracker-auto.min.js para detecção automática');
  console.log('   • Use tracker-shopify-lite.min.js se não precisar de IA');
  console.log('   • Use tracker-ai-addon.min.js para adicionar IA posteriormente');
  console.log('   • Configure enableAI: false para desabilitar IA globalmente\n');
}

// Executar build
buildScript();