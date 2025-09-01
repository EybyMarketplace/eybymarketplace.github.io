/*!
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
      console.log(`✅ Influencer Tracker carregado para: ${platform} (${aiStatus})`);
      
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
  
})();