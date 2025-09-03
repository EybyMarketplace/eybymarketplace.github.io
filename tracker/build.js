const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

// Módulos base (sempre incluídos)
const BASE_MODULES = [
  'modules/config.js',
  'utils/utils.js',
  'modules/consent-manager.js',
  'modules/id-generator.js',
  'modules/influencer-detector.js',
  'modules/device-fingerprint.js',
  'modules/event-queue.js'
];

// Configuração do build único
const BUILD_CONFIG = {
  modules: [
    ...BASE_MODULES,
    'core/tracker-core.js',
    'adapters/shopify-adapter.js',
    'ai/ai-data-collector.js'
  ],
  output: 'influencer-tracker'
};

// Configurações de minificação
const MINIFY_OPTIONS = {
  compress: {
    drop_console: false,
    drop_debugger: true,
    pure_funcs: ['console.debug'],
    passes: 2
  },
  mangle: {
    reserved: [
      'InfluencerTracker',
      'shopifyAdapter',
      'AIDataCollector'
    ]
  },
  format: {
    comments: false,
    preamble: `/* Influencer Tracker v2.1.0 for Shopify | Built: ${new Date().toISOString()} */`
  }
};

async function buildScript() {
  try {
    console.log('🚀 Building Influencer Tracker v2.1.0 for Shopify...\n');
    
    // Criar diretórios necessários
    ensureDirectories();
    
    // Validar estrutura de módulos
    validateModuleStructure();
    
    // Processar build
    const result = await processBuild();
    
    // Gerar documentação
    generateDocs(result);
    
    // Relatório final
    generateReport(result);
    
  } catch (error) {
    console.error('❌ Build error:', error);
    process.exit(1);
  }
}

function validateModuleStructure() {
  console.log('🔍 Validating module structure...');
  
  const missingModules = BUILD_CONFIG.modules.filter(module => {
    const fullPath = path.join(__dirname, 'src', module);
    return !fs.existsSync(fullPath);
  });
  
  if (missingModules.length > 0) {
    console.warn(`⚠️  Missing modules: ${missingModules.join(', ')}`);
  }
  
  console.log('✅ Validation completed');
}

async function processBuild() {
  const startTime = Date.now();
  
  console.log('📦 Processing build...');
  
  // Concatenar módulos
  let combinedCode = '';
  const existingModules = [];
  
  // Header do bundle
  combinedCode += generateBundleHeader();
  
  // Processar cada módulo
  for (const modulePath of BUILD_CONFIG.modules) {
    const fullPath = path.join(__dirname, 'src', modulePath);
    
    if (fs.existsSync(fullPath)) {
      const moduleContent = processModule(fullPath, modulePath);
      combinedCode += `\n    // ===== ${modulePath.toUpperCase()} =====\n`;
      combinedCode += moduleContent;
      combinedCode += '\n';
      
      existingModules.push(modulePath);
    } else {
      console.log(`   ⚠️  Module not found: ${modulePath}`);
    }
  }
  
  if (combinedCode.trim() === '') {
    throw new Error('No valid modules found for build');
  }
  
  // Adicionar footer do bundle
  combinedCode += generateBundleFooter();
  
  // Salvar versão não-minificada
  const devFile = path.join(__dirname, 'dist', `${BUILD_CONFIG.output}.js`);
  fs.writeFileSync(devFile, combinedCode);
  
  // Minificar
  const minifyResult = await minify(combinedCode, MINIFY_OPTIONS);
  
  if (minifyResult.error) {
    throw minifyResult.error;
  }
  
  // Salvar versão minificada
  const minFile = path.join(__dirname, 'dist', `${BUILD_CONFIG.output}.min.js`);
  fs.writeFileSync(minFile, minifyResult.code);
  
  // Calcular estatísticas
  const originalSize = Buffer.byteLength(combinedCode, 'utf8');
  const minifiedSize = Buffer.byteLength(minifyResult.code, 'utf8');
  const buildTime = Date.now() - startTime;
  
  console.log(`   ✅ Build completed: ${(originalSize / 1024).toFixed(1)} KB → ${(minifiedSize / 1024).toFixed(1)} KB (${buildTime}ms)`);
  
  return {
    modules: existingModules,
    originalSize,
    minifiedSize,
    buildTime,
    output: BUILD_CONFIG.output
  };
}

function processModule(filePath, modulePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remover header comments específicos do módulo
  content = content.replace(/^\/\*![\s\S]*?\*\/\s*/, '');
  
  // Remover IIFEs externas para evitar conflitos no bundle
  content = content.replace(/^\(function\(global\)\s*{/, '');
  content = content.replace(/}\)\(window\);?\s*$/, '');
  
  // Remover console.log de carregamento de módulos
  content = content.replace(/console\.log\([^)]*module loaded[^)]*\);?\s*/g, '');
  
  // Adicionar comentário de identificação do módulo
  const moduleComment = `    // Module: ${modulePath}\n`;
  
  return moduleComment + content;
}

function generateBundleHeader() {
  return `/*!
 * Influencer Tracker for Shopify - Complete Bundle
 * Version: 2.1.0 with AI Analytics
 * Built: ${new Date().toISOString()}
 * Architecture: Modular Vanilla JS
 * 
 * Modules included: ${BUILD_CONFIG.modules.length}
${BUILD_CONFIG.modules.map(m => ` * - ${m}`).join('\n')}
 * 
 * Features:
 * - Event Tracking ✅
 * - Affiliate Attribution ✅
 * - Shopify Integration 🛍️
 * - AI Behavioral Analysis 🤖
 * - Customer Journey Mapping 🤖
 * - Conversion Prediction 🤖
 * 
 * Copyright (c) ${new Date().getFullYear()}
 * Licensed under MIT
 */

(function(window, document, undefined) {
    'use strict';
    
    // Build info
    const BUILD_INFO = {
        name: 'shopify-full',
        version: '2.1.0',
        platform: 'shopify',
        timestamp: '${new Date().toISOString()}',
        modules: ${JSON.stringify(BUILD_CONFIG.modules)},
        features: {
            tracking: true,
            attribution: true,
            shopify: true,
            ai: true
        }
    };
    
    // Create global namespace
    window.InfluencerTracker = window.InfluencerTracker || {};
    
    // Expose build info
    window.InfluencerTracker.BuildInfo = BUILD_INFO;
`;
}

function generateBundleFooter() {
  return `
    
    // ===== AUTO-INITIALIZATION =====
    
    // Verificar dependências
    const requiredModules = ['Config', 'Utils', 'Core'];
    const missingModules = requiredModules.filter(module => 
        !window.InfluencerTracker[module]
    );
    
    if (missingModules.length > 0) {
        console.error('Missing required modules:', missingModules);
    } else {
        // Criar instância principal
        window.InfluencerTracker.instance = window.InfluencerTracker.Core;
        
        // Métodos de conveniência
        window.InfluencerTracker.init = function(options) {
            return window.InfluencerTracker.Core.init(options);
        };
        
        window.InfluencerTracker.track = function(eventType, properties) {
            return window.InfluencerTracker.Core.track(eventType, properties);
        };
        
        window.InfluencerTracker.trackPurchase = function(orderData) {
            return window.InfluencerTracker.Core.trackPurchase(orderData);
        };
        
        window.InfluencerTracker.getInfo = function() {
            return window.InfluencerTracker.Core.getInfo();
        };
        
        // Auto-init se configurado via data attributes
        const script = document.currentScript;
        if (script && script.dataset.autoInit !== 'false') {
            const config = {};
            if (script.dataset.apiEndpoint) config.apiEndpoint = script.dataset.apiEndpoint;
            if (script.dataset.projectId) config.projectId = script.dataset.projectId;
            
            if (Object.keys(config).length > 0) {
                window.InfluencerTracker.init(config);
            }
        }
        
        console.log('🎯 Influencer Tracker v2.1.0 for Shopify loaded');
        console.log('📦 Modules loaded:', ${BUILD_CONFIG.modules.length});
        console.log('🛍️ Shopify integration: Ready');
        console.log('🤖 AI analytics: Enabled');
    }
    
})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : {});`;
}

function ensureDirectories() {
  const dirs = [
    'dist',
    'src/modules',
    'src/adapters',
    'src/ai',
    'docs'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

function generateDocs(result) {
  const docsContent = `# Influencer Tracker v2.1.0 for Shopify

Built: ${new Date().toISOString()}

## 📦 Build Information

- **File**: \`${result.output}.min.js\`
- **Size**: ${(result.minifiedSize / 1024).toFixed(1)} KB (minified)
- **Modules**: ${result.modules.length} included
- **Platform**: Shopify
- **AI**: Enabled

## 🚀 Installation

### CDN (Recommended)
\`\`\`html
<script src="https://your-cdn.com/dist/influencer-tracker.min.js"></script>
\`\`\`

### With Configuration
\`\`\`html
<script 
  src="https://your-cdn.com/dist/influencer-tracker.min.js"
  data-api-endpoint="https://your-api.com/events"
  data-project-id="your-project-id"
  data-auto-init="true">
</script>
\`\`\`

### Manual Configuration
\`\`\`html
<script src="https://your-cdn.com/dist/influencer-tracker.min.js" data-auto-init="false"></script>
<script>
  InfluencerTracker.init({
    apiEndpoint: 'https://your-api.com/events',
    projectId: 'your-project-id',
    enableConsentCheck: true,
    debug: false
  });
</script>
\`\`\`

## 🛍️ Shopify Features

- **Native Integration**: Automatic Shopify detection and hooks
- **Product Tracking**: Automatic product view and cart events
- **Checkout Integration**: Purchase tracking with order details
- **Theme Compatibility**: Works with any Shopify theme

## 🤖 AI Features

- **Behavioral Segmentation**: Automatic customer profiling
- **Conversion Prediction**: Real-time conversion probability
- **Journey Mapping**: Customer path analysis
- **Engagement Scoring**: Quality metrics for each visitor

## 📊 Usage Examples

### Basic Tracking
\`\`\`javascript
// Custom event
InfluencerTracker.track('video_watched', {
  video_id: 'intro-video',
  duration: 120,
  completion_rate: 0.8
});
\`\`\`

### Purchase Tracking
\`\`\`javascript
// Manual purchase tracking (if needed)
InfluencerTracker.trackPurchase({
  orderId: 'ORDER-123',
  totalValue: 299.90,
  currency: 'USD',
  items: [
    {
      id: 'PROD-1',
      name: 'Product Name',
      price: 299.90,
      quantity: 1,
      category: 'Electronics'
    }
  ],
  couponCode: 'SAVE10'
});
\`\`\`

### Get Analytics Data
\`\`\`javascript
// Get current session info
const info = InfluencerTracker.getInfo();
console.log('User ID:', info.userId);
console.log('Session ID:', info.sessionId);
console.log('Has Attribution:', info.hasAttribution);
\`\`\`

## 🎯 Influencer Attribution

The tracker automatically detects influencer attribution from:
- URL parameters: \`?inf_id=123&campaign=summer\`
- UTM parameters: \`?utm_source=influencer&utm_medium=social\`
- Referrer detection: Instagram, TikTok, YouTube, etc.

## ⚙️ Configuration Options

\`\`\`javascript
InfluencerTracker.init({
  // Required
  apiEndpoint: 'https://your-api.com/events',
  projectId: 'your-project-id',
  
  // Optional
  enableConsentCheck: true,    // GDPR/LGPD compliance
  batchSize: 10,              // Events per batch
  batchTimeout: 3000,         // Batch timeout (ms)
  sessionTimeout: 1800000,    // Session timeout (30 min)
  debug: false                // Debug mode
});
\`\`\`

## 📋 Modules Included

${result.modules.map(module => `- \`${module}\``).join('\n')}

## 🔧 Build Details

- **Original Size**: ${(result.originalSize / 1024).toFixed(1)} KB
- **Minified Size**: ${(result.minifiedSize / 1024).toFixed(1)} KB
- **Compression**: ${(((result.originalSize - result.minifiedSize) / result.originalSize) * 100).toFixed(1)}%
- **Build Time**: ${result.buildTime}ms
`;

  const docsFile = path.join(__dirname, 'docs', 'README.md');
  fs.writeFileSync(docsFile, docsContent);
  console.log('📚 Documentation generated in docs/README.md');
}

function generateReport(result) {
  console.log('\n📊 BUILD REPORT v2.1.0');
  console.log('='.repeat(50));
  
  const reduction = ((result.originalSize - result.minifiedSize) / result.originalSize * 100).toFixed(1);
  
  console.log(`Build: ${result.output}`);
  console.log(`Platform: Shopify`);
  console.log(`Modules: ${result.modules.length}`);
  console.log(`Original: ${(result.originalSize / 1024).toFixed(1)} KB`);
  console.log(`Minified: ${(result.minifiedSize / 1024).toFixed(1)} KB`);
  console.log(`Reduction: ${reduction}%`);
  console.log(`Build Time: ${result.buildTime}ms`);
  
  console.log('\n📦 Files generated:');
  console.log(`   • dist/${result.output}.js (development)`);
  console.log(`   • dist/${result.output}.min.js (production)`);
  console.log(`   • docs/README.md (documentation)`);
  
  console.log('\n✅ Build completed successfully!\n');
  
  console.log('💡 USAGE:');
  console.log('   • Add to Shopify theme: <script src="influencer-tracker.min.js"></script>');
  console.log('   • Configure via data attributes or manual init');
  console.log('   • All features included: tracking + AI + Shopify integration\n');
}

// Execute build
buildScript();