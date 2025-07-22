
/**
 * Influencer Marketing Analytics Script
 * Versão: 1.0.0
 * 
 * INSTRUÇÕES DE INSTALAÇÃO:
 * 1. Adicione este script no <head> de todas as páginas do seu e-commerce
 * 2. Configure sua API_ENDPOINT abaixo
 * 3. Adicione os data-attributes nos elementos que quer trackear
 * 
 * EXEMPLO DE USO:
 * <script src="este-arquivo.js"></script>
 * <script>
 *   InfluencerTracker.init({
 *     apiEndpoint: 'https://sua-api.com/track',
 *     projectId: 'seu_projeto_id',
 *     enableConsentCheck: true
 *   });
 * </script>
 */

(function(window, document) {
  'use strict';
  
  // ========== CONFIGURAÇÕES ==========
  const CONFIG = {
    apiEndpoint: '', // DEVE SER CONFIGURADO
    projectId: '',   // DEVE SER CONFIGURADO
    enableConsentCheck: true,
    batchSize: 10,
    batchTimeout: 3000,
    sessionTimeout: 30 * 60 * 1000, // 30 minutos
    version: '1.0.0'
  };

  // ========== GERENCIAMENTO DE CONSENT (LGPD) ==========
  const ConsentManager = {
    checkConsent: function() {
      if (!CONFIG.enableConsentCheck) return true;
      
      const consent = localStorage.getItem('analytics_consent');
      return consent === 'granted';
    },
    
    waitForConsent: function(callback) {
      const checkInterval = setInterval(() => {
        if (this.checkConsent()) {
          clearInterval(checkInterval);
          callback();
        }
      }, 500);
      
      // Timeout após 10 segundos
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 10000);
    }
  };

  // ========== GERAÇÃO DE IDs ÚNICOS ==========
  const IdGenerator = {
    generateUUID: function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },
    
    getUserId: function() {
      let userId = localStorage.getItem('inf_user_id');
      if (!userId) {
        userId = this.generateUUID();
        localStorage.setItem('inf_user_id', userId);
      }
      return userId;
    },
    
    getSessionId: function() {
      let sessionData = sessionStorage.getItem('inf_session');
      
      if (sessionData) {
        const session = JSON.parse(sessionData);
        const now = Date.now();
        
        // Verifica se a sessão não expirou
        if (now - session.lastActivity < CONFIG.sessionTimeout) {
          session.lastActivity = now;
          sessionStorage.setItem('inf_session', JSON.stringify(session));
          return session.id;
        }
      }
      
      // Cria nova sessão
      const newSession = {
        id: this.generateUUID(),
        startTime: Date.now(),
        lastActivity: Date.now()
      };
      
      sessionStorage.setItem('inf_session', JSON.stringify(newSession));
      return newSession.id;
    }
  };

  // ========== DETECÇÃO DE INFLUENCIADOR ==========
  const InfluencerDetector = {
    detectInfluencer: function() {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      // Verifica parâmetros de influenciador na URL
      const influencerParams = {
        influencer_id: urlParams.get('inf_id') || urlParams.get('influencer') || hashParams.get('inf_id'),
        campaign_id: urlParams.get('camp_id') || urlParams.get('campaign') || hashParams.get('camp_id'),
        promo_code: urlParams.get('promo') || urlParams.get('codigo') || hashParams.get('promo'),
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
        ref: urlParams.get('ref')
      };
      
      // Detecta origem de redes sociais
      const referrer = document.referrer;
      let socialSource = null;
      
      if (referrer.includes('instagram.com')) socialSource = 'instagram';
      else if (referrer.includes('tiktok.com')) socialSource = 'tiktok';
      else if (referrer.includes('youtube.com') || referrer.includes('youtu.be')) socialSource = 'youtube';
      else if (referrer.includes('facebook.com')) socialSource = 'facebook';
      else if (referrer.includes('twitter.com') || referrer.includes('x.com')) socialSource = 'twitter';
      
      // Salva dados do influenciador na sessão se detectado
      const hasInfluencerData = Object.values(influencerParams).some(val => val !== null);
      
      if (hasInfluencerData || socialSource) {
        const influencerData = {
          ...influencerParams,
          social_source: socialSource,
          detected_at: Date.now(),
          landing_page: window.location.href
        };
        
        sessionStorage.setItem('inf_attribution', JSON.stringify(influencerData));
        return influencerData;
      }
      
      // Retorna dados salvos se existirem
      const saved = sessionStorage.getItem('inf_attribution');
      return saved ? JSON.parse(saved) : null;
    }
  };

  // ========== DEVICE FINGERPRINTING ==========
  const DeviceFingerprint = {
    generate: function() {
      const screen = window.screen;
      const nav = navigator;
      
      return {
        user_agent: nav.userAgent,
        language: nav.language,
        platform: nav.platform,
        screen_resolution: `${screen.width}x${screen.height}`,
        color_depth: screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        device_memory: nav.deviceMemory || null,
        hardware_concurrency: nav.hardwareConcurrency || null,
        connection: nav.connection ? {
          effective_type: nav.connection.effectiveType,
          downlink: nav.connection.downlink
        } : null
      };
    }
  };

  // ========== QUEUE DE EVENTOS ==========
  const EventQueue = {
    queue: [],
    
    add: function(event) {
      this.queue.push(event);
      
      if (this.queue.length >= CONFIG.batchSize) {
        this.flush();
      }
    },
    
    flush: function() {
      if (this.queue.length === 0 || !CONFIG.apiEndpoint) return;
      
      const events = this.queue.splice(0, CONFIG.batchSize);
      
      // Envia para API
      fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: CONFIG.projectId,
          events: events,
          version: CONFIG.version
        })
      }).catch(error => {
        console.warn('Influencer Tracker: Failed to send events', error);
        // Salva no localStorage como fallback
        const stored = JSON.parse(localStorage.getItem('inf_failed_events') || '[]');
        stored.push(...events);
        localStorage.setItem('inf_failed_events', JSON.stringify(stored.slice(-100))); // Máximo 100 eventos
      });
    },
    
    scheduleFlush: function() {
      if (this.flushTimer) clearTimeout(this.flushTimer);
      this.flushTimer = setTimeout(() => this.flush(), CONFIG.batchTimeout);
    }
  };

  // ========== TRACKER PRINCIPAL ==========
  const InfluencerTracker = {
    initialized: false,
    startTime: Date.now(),
    
    init: function(options = {}) {
      if (this.initialized) return;
      
      // Configura opções
      Object.assign(CONFIG, options);
      
      if (!CONFIG.apiEndpoint) {
        console.warn('Influencer Tracker: apiEndpoint não configurado');
        return;
      }
      
      // Verifica consent antes de iniciar
      if (CONFIG.enableConsentCheck && !ConsentManager.checkConsent()) {
        ConsentManager.waitForConsent(() => this.startTracking());
        return;
      }
      
      this.startTracking();
    },
    
    startTracking: function() {
      this.initialized = true;
      
      // Detecta influenciador
      const influencerData = InfluencerDetector.detectInfluencer();
      
      // Evento de page view
      this.track('page_view', {
        page_url: window.location.href,
        page_title: document.title,
        referrer: document.referrer,
        influencer_data: influencerData
      });
      
      // Configura listeners
      this.setupEventListeners();
      
      // Flush automático
      EventQueue.scheduleFlush();
      
      // Flush quando sair da página
      window.addEventListener('beforeunload', () => EventQueue.flush());
      
      console.log('Influencer Tracker: Inicializado com sucesso');
    },
    
    track: function(eventType, properties = {}) {
      if (!this.initialized) return;
      
      const event = {
        event_id: IdGenerator.generateUUID(),
        event_type: eventType,
        timestamp: Date.now(),
        user_id: IdGenerator.getUserId(),
        session_id: IdGenerator.getSessionId(),
        page_url: window.location.href,
        device_fingerprint: DeviceFingerprint.generate(),
        properties: properties
      };
      
      EventQueue.add(event);
    },
    
    setupEventListeners: function() {
      // Tracking de scroll
      let maxScroll = 0;
      window.addEventListener('scroll', this.throttle(() => {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        if (scrollPercent > maxScroll) {
          maxScroll = scrollPercent;
          
          // Marcos de scroll
          if ([25, 50, 75, 90].includes(scrollPercent)) {
            this.track('scroll_milestone', { scroll_percent: scrollPercent });
          }
        }
      }, 1000));
      
      // Tracking de cliques
      document.addEventListener('click', (e) => {
        const element = e.target;
        const properties = {
          element_tag: element.tagName,
          element_classes: element.className,
          element_id: element.id,
          element_text: element.textContent?.substring(0, 100),
          x: e.clientX,
          y: e.clientY
        };
        
        // Detecta tipo de clique
        if (element.matches('[data-product-id]')) {
          properties.product_id = element.getAttribute('data-product-id');
          this.track('product_click', properties);
        } else if (element.matches('.btn-buy, .add-to-cart, [data-action="add-cart"]')) {
          this.track('add_to_cart_attempt', properties);
        } else if (element.matches('.btn-checkout, [data-action="checkout"]')) {
          this.track('checkout_attempt', properties);
        } else {
          this.track('click', properties);
        }
      });
      
      // Tracking de formulários
      document.addEventListener('submit', (e) => {
        const form = e.target;
        this.track('form_submit', {
          form_id: form.id,
          form_classes: form.className,
          form_action: form.action,
          field_count: form.elements.length
        });
      });
      
      // Tracking de tempo na página
      let timeOnPage = 0;
      setInterval(() => {
        timeOnPage += 10;
        
        // Marcos de tempo
        if ([30, 60, 120, 300].includes(timeOnPage)) {
          this.track('time_milestone', { seconds_on_page: timeOnPage });
        }
      }, 10000);
      
      // Tracking de produtos visualizados
      this.setupProductTracking();
      
      // Tracking de carrinho abandonado
      this.setupCartTracking();
      
      // Tracking de saída
      this.setupExitTracking();
    },
    
    setupProductTracking: function() {
      // Intersection Observer para produtos visíveis
      const productObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target;
            this.track('product_view', {
              product_id: element.getAttribute('data-product-id'),
              product_name: element.getAttribute('data-product-name'),
              product_price: element.getAttribute('data-product-price'),
              product_category: element.getAttribute('data-product-category'),
              visibility_percent: Math.round(entry.intersectionRatio * 100)
            });
          }
        });
      }, { threshold: 0.5 });
      
      // Observa elementos com data-product-id
      document.querySelectorAll('[data-product-id]').forEach(el => {
        productObserver.observe(el);
      });
    },
    
    setupCartTracking: function() {
      // Detecta mudanças no carrinho via MutationObserver
      const cartObserver = new MutationObserver(() => {
        const cartItems = document.querySelectorAll('[data-cart-item]').length;
        const cartValue = this.getCartValue();
        
        this.track('cart_update', {
          cart_items: cartItems,
          cart_value: cartValue
        });
      });
      
      const cartContainer = document.querySelector('[data-cart-container]') || document.body;
      cartObserver.observe(cartContainer, { 
        childList: true, 
        subtree: true 
      });
    },
    
    setupExitTracking: function() {
      let exitTracked = false;
      
      document.addEventListener('mouseleave', (e) => {
        if (e.clientY <= 0 && !exitTracked) {
          exitTracked = true;
          this.track('exit_intent', {
            time_on_page: Date.now() - this.startTime,
            scroll_percent: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)
          });
        }
      });
    },
    
    getCartValue: function() {
      // Tenta encontrar valor do carrinho em elementos comuns
      const selectors = [
        '[data-cart-total]',
        '.cart-total',
        '#cart-total',
        '.basket-total'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent || element.value;
          const value = parseFloat(text.replace(/[^\d.,]/g, '').replace(',', '.'));
          if (!isNaN(value)) return value;
        }
      }
      
      return null;
    },
    
    // Métodos públicos para tracking manual
    trackPurchase: function(orderData) {
      this.track('purchase', {
        order_id: orderData.orderId,
        total_value: orderData.totalValue,
        currency: orderData.currency || 'BRL',
        items: orderData.items,
        coupon_code: orderData.couponCode,
        influencer_attribution: JSON.parse(sessionStorage.getItem('inf_attribution') || 'null')
      });
    },
    
    trackCustomEvent: function(eventName, properties) {
      this.track(eventName, properties);
    },
    
    // Utility function
    throttle: function(func, limit) {
      let inThrottle;
      return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    }
  };
  
  // ========== EXPÕE API GLOBAL ==========
  window.InfluencerTracker = InfluencerTracker;
  
  // Auto-inicialização se configurado via data attributes
  document.addEventListener('DOMContentLoaded', () => {
    const script = document.querySelector('script[data-inf-endpoint]');
    if (script) {
      InfluencerTracker.init({
        apiEndpoint: script.getAttribute('data-inf-endpoint'),
        projectId: script.getAttribute('data-inf-project'),
        enableConsentCheck: script.getAttribute('data-inf-consent') !== 'false'
      });
    }
  });

})(window, document);

// ========== INSTRUÇÕES DE IMPLEMENTAÇÃO ==========
/*

1. CONFIGURAÇÃO BÁSICA:
   Adicione no <head> do seu site:
   
   <script src="caminho/para/influencer-tracker.js"></script>
   <script>
     InfluencerTracker.init({
       apiEndpoint: 'https://sua-api.com/track',
       projectId: 'seu_projeto_123',
       enableConsentCheck: true
     });
   </script>

2. TRACKING DE PRODUTOS:
   Adicione data-attributes nos seus produtos:
   
   <div class="produto" 
        data-product-id="123"
        data-product-name="Produto X"
        data-product-price="99.90"
        data-product-category="categoria">
     ...
   </div>

3. TRACKING DE CARRINHO:
   Marque o container do carrinho:
   
   <div data-cart-container>
     <div data-cart-item>Item 1</div>
     <div data-cart-item>Item 2</div>
     <span data-cart-total>R$ 199,80</span>
   </div>

4. TRACKING DE COMPRA:
   Chame manualmente na página de sucesso:
   
   <script>
     InfluencerTracker.trackPurchase({
       orderId: 'ORDER_123',
       totalValue: 199.80,
       currency: 'BRL',
       items: [
         {id: '123', name: 'Produto X', price: 99.90, quantity: 2}
       ],
       couponCode: 'DESCONTO10'
     });
   </script>

5. LINKS DE INFLUENCIADORES:
   Use estes formatos de URL:
   
   https://seusite.com/?inf_id=influencer123&camp_id=campanha456&promo=CODIGO20
   https://seusite.com/?utm_source=instagram&utm_medium=influencer&utm_campaign=summer2024&ref=maria_influencer

6. CONSENT LGPD:
   Para ativar tracking após consent:
   
   <script>
     // Quando usuário der consent
     localStorage.setItem('analytics_consent', 'granted');
   </script>

EVENTOS TRACKADOS AUTOMATICAMENTE:
- page_view: Visualização de página
- click: Cliques em elementos
- product_view: Visualização de produtos (com data-product-id)
- product_click: Cliques em produtos
- add_to_cart_attempt: Tentativa de adicionar ao carrinho
- checkout_attempt: Tentativa de checkout
- form_submit: Envio de formulários
- scroll_milestone: Marcos de scroll (25%, 50%, 75%, 90%)
- time_milestone: Marcos de tempo (30s, 1min, 2min, 5min)
- cart_update: Mudanças no carrinho
- exit_intent: Intenção de sair da página
- purchase: Compras (manual)

DADOS CAPTURADOS:
- User ID persistente
- Session ID
- Device fingerprint
- Dados do influenciador (se detectado)
- Timestamps precisos
- Informações da página
- Dados do device/browser
- Geolocalização (se permitida)

*/
