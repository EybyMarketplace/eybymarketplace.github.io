
// Debug completo - adicione APÓS o script original
window.addEventListener('load', function() {
  console.log('=== DEBUG INFLUENCER TRACKER ===');
  
  // 1. Verificações básicas
  console.log('1. InfluencerTracker existe:', !!window.InfluencerTracker);
  console.log('2. Config existe:', !!window.InfluencerTrackerConfig);
  console.log('3. Inicializado:', window.InfluencerTracker?.initialized);
  
  // 2. Verificar consent
  const consent = localStorage.getItem('analytics_consent');
  console.log('4. Consent status:', consent);
  
  if (consent !== 'granted') {
    console.warn('PROBLEMA: Consent não concedido, forçando...');
    localStorage.setItem('analytics_consent', 'granted');
  }
  
  // 3. Verificar endpoint
  console.log('5. API Endpoint:', window.InfluencerTrackerConfig?.apiEndpoint);
  
  // 4. Teste de conectividade
  if (window.InfluencerTrackerConfig?.apiEndpoint) {
    fetch(window.InfluencerTrackerConfig.apiEndpoint, {
      method: 'OPTIONS'
    }).then(response => {
      console.log('6. Teste OPTIONS:', response.status);
    }).catch(error => {
      console.error('6. Erro OPTIONS:', error);
    });
  }
  
  // 5. Interceptar fetch para monitorar requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    if (args[0]?.includes('tracking/events')) {
      console.log('🚀 REQUEST INTERCEPTADO:', args);
    }
    return originalFetch.apply(this, arguments)
      .then(response => {
        if (args[0]?.includes('tracking/events')) {
          console.log('✅ RESPONSE:', response.status, response);
        }
        return response;
      })
      .catch(error => {
        if (args[0]?.includes('tracking/events')) {
          console.error('❌ ERRO REQUEST:', error);
        }
        throw error;
      });
  };
  
  // 6. Forçar inicialização e teste
  setTimeout(() => {
    if (window.InfluencerTracker && !window.InfluencerTracker.initialized) {
      console.log('7. Forçando inicialização...');
      window.InfluencerTracker.init(window.InfluencerTrackerConfig);
    }
    
    // Teste manual
    setTimeout(() => {
      console.log('8. Enviando evento de teste...');
      window.InfluencerTracker?.trackCustomEvent('manual_debug_test', {
        debug: true,
        timestamp: Date.now(),
        url: window.location.href
      });
      
      // Forçar flush
      setTimeout(() => {
        console.log('9. Forçando flush...');
        window.InfluencerTracker?.EventQueue?.flush();
      }, 1000);
      
    }, 1000);
  }, 2000);
});
