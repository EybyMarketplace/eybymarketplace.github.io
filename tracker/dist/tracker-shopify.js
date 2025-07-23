/*!
 * Influencer Tracker - SHOPIFY Build
 * Version: 2.0.0
 * Built: 2025-07-23T18:20:34.452Z
 * Files: src/core/tracker-core.js, src/adapters/shopify-adapter.js, src/utils/helpers.js
 * 
 * Copyright (c) 2025
 * Licensed under MIT
 */

(function(window, document, undefined) {
  'use strict';
  
  // Build info
  const BUILD_INFO = {
    name: 'shopify',
    version: '2.0.0',
    timestamp: '2025-07-23T18:20:34.454Z',
    files: ["src/core/tracker-core.js","src/adapters/shopify-adapter.js","src/utils/helpers.js"]
  };
  
  // Expose build info
  if (typeof window !== 'undefined') {
    window.InfluencerTrackerBuild = BUILD_INFO;
  }


/* === src/core/tracker-core.js === */
/*!
 * Influencer Tracker - Core Universal
 * Funcionalidades base que funcionam em qualquer plataforma
 */

(function(window, document) {
  'use strict';
  
  // ========== CONFIGURAÇÕES ==========
  const CONFIG = {
    apiEndpoint: '',
    projectId: '',
    enableConsentCheck: true,
    batchSize: 10,
    batchTimeout: 3000,
    sessionTimeout: 30 * 60 * 1000, // 30 minutos
    version: '2.0.0'
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
        platform: 'generic',
        adapter: null,

        init: function(options = {}) {
            if (this.initialized) return;
            
            // Configura opções
            Object.assign(CONFIG, options);
            
            if (!CONFIG.apiEndpoint) {
            console.warn('Influencer Tracker: apiEndpoint não configurado');
            return;
            }
            
            // Detecta plataforma
            this.platform = this.detectPlatform();
            console.log(`🎯 Plataforma detectada: ${this.platform}`);
            
            // Carrega adaptador
            this.adapter = this.loadAdapter(this.platform);
            
            // Verifica consent antes de iniciar
            if (CONFIG.enableConsentCheck && !ConsentManager.checkConsent()) {
            ConsentManager.waitForConsent(() => this.startTracking());
            return;
            }
            
            this.startTracking();
        },

        detectPlatform: function() {
            // Shopify
            if (window.Shopify || window.shopifyData || 
                document.querySelector('meta[name="shopify-checkout-api-token"]')) {
            return 'shopify';
            }
            
            return 'generic';
        },

        loadAdapter: function(platform) {
            const adapterName = `${platform}Adapter`;
            return window[adapterName] || null;
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
            
            // Configura listeners universais
            this.setupUniversalTracking();
            
            // Inicialização específica da plataforma
            if (this.adapter?.init) {
            this.adapter.init();
            }
            
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
            platform: this.platform,
            properties: properties
            };
            
            // Enriquecer com dados específicos da plataforma
            if (this.adapter?.enrichEvent) {
            Object.assign(event.properties, this.adapter.enrichEvent(eventType, properties));
            }
            
            EventQueue.add(event);
        },

        setupUniversalTracking: function() {
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
            
            // Tracking de cliques universais
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
            
            this.track('click', properties);
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
            
            // Tracking de saída
            this.setupExitTracking();
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
  
  // Expõe módulos internos para adaptadores
  window.InfluencerTracker.ConsentManager = ConsentManager;
  window.InfluencerTracker.IdGenerator = IdGenerator;
  window.InfluencerTracker.InfluencerDetector = InfluencerDetector;
  window.InfluencerTracker.DeviceFingerprint = DeviceFingerprint;
  window.InfluencerTracker.EventQueue = EventQueue;

})(window, document);

/* === src/adapters/shopify-adapter.js === */
/*!
 * Influencer Tracker - Shopify Adapter
 * Funcionalidades específicas para Shopify
 */

(function(window, document) {
  'use strict';
  
  window.shopifyAdapter = {
    lastCartState: null,
    cartUpdateTimeout: null,
    
    init: function() {
      console.log('🛍️ Inicializando adaptador Shopify');
      
      // Setup tracking específico do Shopify
      this.setupShopifyTracking();
      this.setupCartTracking();
      this.setupProductTracking();
      this.setupCheckoutTracking();
      
      // Estado inicial do carrinho
      this.lastCartState = {
        items: this.getCartItemCount(),
        value: this.getCartValue()
      };
      
      console.log('🛒 Estado inicial do carrinho:', this.lastCartState);
    },
    
    // Enriquecer eventos com dados específicos do Shopify
    enrichEvent: function(eventType, properties) {
      const shopifyData = {
        shop_domain: window.Shopify?.shop || window.shopifyData?.shop?.domain,
        currency: window.shopifyData?.shop?.currency || 'USD',
        customer_id: window.shopifyData?.customer?.id,
        cart_token: this.getCartToken()
      };
      
      // Dados específicos por tipo de evento
      if (eventType === 'cart_update') {
        shopifyData.cart_items = this.getCartItemCount();
        shopifyData.cart_value = this.getCartValue();
      }
      
      if (eventType === 'product_view' && window.shopifyData?.product) {
        shopifyData.product_id = window.shopifyData.product.id;
        shopifyData.product_handle = window.shopifyData.product.handle;
        shopifyData.product_type = window.shopifyData.product.type;
        shopifyData.product_vendor = window.shopifyData.product.vendor;
        shopifyData.product_price = window.shopifyData.product.price;
        shopifyData.product_available = window.shopifyData.product.available;
      }
      
      return shopifyData;
    },
    
    // ========== FUNÇÕES DE CARRINHO ==========
    getCartValue: function() {
      console.log('🛒 getCartValue (Shopify)');
      
      // ESTRATÉGIA 1: Dados do Shopify (mais confiável)
      if (window.shopifyData?.cart?.total_price !== undefined) {
        const value = window.shopifyData.cart.total_price;
        console.log('   ✅ Via Shopify data:', value);
        return value;
      }
      
      // ESTRATÉGIA 2: API do Shopify
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/cart.js', false);
        xhr.send();
        
        if (xhr.status === 200) {
          const cartData = JSON.parse(xhr.responseText);
          const value = cartData.total_price / 100; // Shopify retorna em centavos
          console.log('   ✅ Via API /cart.js:', value);
          return value;
        }
      } catch (e) {
        console.log('   ❌ Erro API:', e);
      }
      
      // ESTRATÉGIA 3: DOM (fallback)
      const selectors = [
        '[data-cart-total]',
        '.cart-total',
        '#cart-total',
        '.basket-total',
        '.cart__total',
        '.drawer-cart__total'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent || element.value || element.getAttribute('data-cart-total');
          if (text) {
            const value = this.parseCartValue(text);
            if (value !== null) {
              console.log('   ✅ Via DOM:', value);
              return value;
            }
          }
        }
      }
      
      console.log('   ⚠️ Fallback para 0');
      return 0;
    },
    
    getCartItemCount: function() {
      // Shopify data primeiro
      if (window.shopifyData?.cart?.item_count !== undefined) {
        return window.shopifyData.cart.item_count;
      }
      
      // API como fallback
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/cart.js', false);
        xhr.send();
        
        if (xhr.status === 200) {
          const cartData = JSON.parse(xhr.responseText);
          return cartData.item_count;
        }
      } catch (e) {
        console.log('Erro ao buscar item count:', e);
      }
      
      // DOM como último recurso
      return document.querySelectorAll('[data-cart-item], .cart-item, .line-item').length;
    },
    
    getCartToken: function() {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/cart.js', false);
        xhr.send();
        
        if (xhr.status === 200) {
          const cartData = JSON.parse(xhr.responseText);
          return cartData.token;
        }
      } catch (e) {
        return null;
      }
    },
    
    parseCartValue: function(text) {
      if (!text) return null;
      
      // Converter para string
      text = String(text).trim();
      
      // Remover símbolos de moeda e espaços
      let cleaned = text.replace(/[^\d.,\-]/g, '');
      
      // Tratar diferentes formatos
      if (cleaned.includes(',') && cleaned.includes('.')) {
        // Formato: 1.234,56 ou 1,234.56
        if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
          // Formato europeu: 1.234,56
          cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else {
          // Formato americano: 1,234.56
          cleaned = cleaned.replace(/,/g, '');
        }
      } else if (cleaned.includes(',')) {
        // Apenas vírgula: pode ser decimal (12,34) ou milhares (1,234)
        const parts = cleaned.split(',');
        if (parts.length === 2 && parts[1].length <= 2) {
          // Decimal: 12,34
          cleaned = cleaned.replace(',', '.');
        } else {
          // Milhares: 1,234
          cleaned = cleaned.replace(/,/g, '');
        }
      }
      
      const value = parseFloat(cleaned);
      
      // Se valor muito alto, pode estar em centavos
      if (value > 10000) {
        return value / 100;
      }
      
      return isNaN(value) ? null : value;
    },
    
    // ========== TRACKING ESPECÍFICO DO SHOPIFY ==========
    setupShopifyTracking: function() {
      const tracker = window.InfluencerTracker;
      
      // 1. TRACKING DE PÁGINA ESPECÍFICA
      if (window.shopifyData?.page?.type === 'product') {
        tracker.trackCustomEvent('product_view', {
          product_id: window.shopifyData.product?.id,
          product_handle: window.shopifyData.product?.handle,
          product_title: window.shopifyData.product?.title,
          product_price: window.shopifyData.product?.price,
          product_type: window.shopifyData.product?.type,
          product_vendor: window.shopifyData.product?.vendor,
          product_available: window.shopifyData.product?.available,
          variants_count: window.shopifyData.product?.variants?.length
        });
      }
      
      if (window.shopifyData?.page?.type === 'collection') {
        tracker.trackCustomEvent('collection_view', {
          collection_id: window.shopifyData.collection?.id,
          collection_handle: window.shopifyData.collection?.handle,
          collection_title: window.shopifyData.collection?.title,
          products_count: window.shopifyData.collection?.products_count
        });
      }
      
      if (window.shopifyData?.page?.type === 'cart') {
        tracker.trackCustomEvent('cart_view', {
          cart_items: window.shopifyData.cart?.item_count || 0,
          cart_total: window.shopifyData.cart?.total_price || 0,
          cart_items_detail: window.shopifyData.cart?.items || []
        });
      }
      
      // 2. TRACKING DE ADD TO CART
      document.addEventListener('submit', (e) => {
        const form = e.target;
        
        // Formulário de produto
        if (form.matches('[action*="/cart/add"], .product-form, form[action*="cart"]')) {
          const formData = new FormData(form);
          const variantId = formData.get('id') || formData.get('variant_id');
          const quantity = formData.get('quantity') || 1;
          
          tracker.trackCustomEvent('add_to_cart_attempt', {
            product_id: window.shopifyData?.product?.id,
            variant_id: variantId,
            quantity: parseInt(quantity),
            product_handle: window.shopifyData?.product?.handle,
            product_title: window.shopifyData?.product?.title,
            form_action: form.action,
            trigger_element: 'form_submit'
          });
          
          // Aguardar resposta e trackear sucesso
          setTimeout(() => {
            this.checkCartChange('add_to_cart');
          }, 1500);
        }
      });
      
      // 3. TRACKING DE BOTÕES ADD TO CART (AJAX)
      document.addEventListener('click', (e) => {
        const button = e.target;
        
        if (button.matches('.btn-add-to-cart, [data-add-to-cart], .product-form__cart-submit, .btn[type="submit"]')) {
          const form = button.closest('form');
          
          if (form && form.matches('[action*="/cart/add"]')) {
            tracker.trackCustomEvent('add_to_cart_click', {
              product_id: window.shopifyData?.product?.id,
              button_text: button.textContent?.trim(),
              button_classes: button.className,
              trigger_element: 'button_click'
            });
          }
        }
        
        // Botões de quantidade no carrinho
        if (button.matches('.qty-btn, .cart-item__quantity-btn, [data-quantity-change]')) {
          const action = button.getAttribute('data-action') || 
                        (button.textContent.includes('+') ? 'increase' : 'decrease');
          
          tracker.trackCustomEvent('shopify_cart_quantity_change', {
            action: action,
            trigger_element: 'quantity_button'
          });
          
          setTimeout(() => {
            this.checkCartChange('quantity_change');
          }, 1000);
        }
        
        // Botões de remoção do carrinho
        if (button.matches('.cart-remove, [data-cart-remove], .cart-item__remove')) {
          tracker.trackCustomEvent('shopify_cart_remove_attempt', {
            trigger_element: 'remove_button'
          });
          
          setTimeout(() => {
            this.checkCartChange('remove_item');
          }, 1000);
        }
      });
    },
    
	setupCartTracking: function() {
		const tracker = window.InfluencerTracker;
		console.log('🛒 Setup cart tracking (sem AJAX interception)');
		
		// ========== MUTATION OBSERVER OTIMIZADO ==========
		const cartObserver = new MutationObserver((mutations) => {
		  let shouldCheck = false;
		  
		  mutations.forEach((mutation) => {
			// Verificar apenas mudanças relevantes
			if (mutation.type === 'childList') {
			  const relevantChanges = [...mutation.addedNodes, ...mutation.removedNodes]
				.some(node => {
				  if (node.nodeType !== Node.ELEMENT_NODE) return false;
				  
				  return (
					node.matches?.('[data-cart-item], .cart-item, .line-item') ||
					node.querySelector?.('[data-cart-item], .cart-item, .line-item') ||
					node.classList?.contains('cart-item')
				  );
				});
			  
			  if (relevantChanges) shouldCheck = true;
			}
			
			// Mudanças em atributos de carrinho
			if (mutation.type === 'attributes') {
			  const cartAttributes = ['data-cart-item', 'data-quantity', 'data-cart-total'];
			  if (cartAttributes.includes(mutation.attributeName)) {
				shouldCheck = true;
			  }
			}
		  });
		  
		  if (shouldCheck) {
			this.checkCartChange('dom_mutation');
		  }
		});
		
		// ========== CONTAINERS PARA OBSERVAR ==========
		const cartContainers = [
		  '[data-cart-container]',
		  '.cart-drawer',
		  '.mini-cart', 
		  '.cart-items',
		  '.cart',
		  '.cart-form'
		];
		
		let observedContainers = 0;
		
		cartContainers.forEach(selector => {
		  const container = document.querySelector(selector);
		  if (container) {
			cartObserver.observe(container, {
			  childList: true,
			  subtree: true,
			  attributes: true,
			  attributeFilter: ['data-cart-item', 'data-quantity', 'data-cart-total']
			});
			observedContainers++;
			console.log(`👀 Observando container: ${selector}`);
		  }
		});
		
		// Fallback: observar body se nenhum container específico
		if (observedContainers === 0) {
		  cartObserver.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['data-cart-item', 'data-quantity', 'data-cart-total']
		  });
		  console.log('👀 Observando body como fallback');
		}
		
		// ========== EVENT LISTENERS ESPECÍFICOS ==========
		
		// 1. Form submits (add to cart, update cart)
		document.addEventListener('submit', (e) => {
		  const form = e.target;
		  
		  if (form.matches('[action*="/cart/add"], [action*="/cart/update"], .cart-form')) {
			console.log('📝 Form submit detectado:', form.action);
			
			// Aguardar processamento e verificar mudanças
			setTimeout(() => {
			  this.checkCartChange('form_submit');
			}, 1500);
		  }
		});
		
		// 2. Quantity input changes
		document.addEventListener('change', (e) => {
		  if (e.target.matches('input[name*="quantity"], .cart-quantity, .qty-input')) {
			console.log('🔢 Quantity change detectado');
			
			// Debounce para evitar múltiplos triggers
			if (this.quantityChangeTimeout) {
			  clearTimeout(this.quantityChangeTimeout);
			}
			
			this.quantityChangeTimeout = setTimeout(() => {
			  this.checkCartChange('quantity_change');
			}, 1000);
		  }
		});
		
		// 3. Button clicks (quantity +/-, remove, etc.)
		document.addEventListener('click', (e) => {
		  const button = e.target;
		  
		  // Botões de quantidade
		  if (button.matches('.qty-btn, [data-quantity-change]')) {
			console.log('🔘 Quantity button clicked');
			setTimeout(() => {
			  this.checkCartChange('quantity_button');
			}, 500);
		  }
		  
		  // Botões de remoção
		  if (button.matches('.cart-remove, [data-cart-remove]')) {
			console.log('🗑️ Remove button clicked');
			setTimeout(() => {
			  this.checkCartChange('item_remove');
			}, 1000);
		  }
		  
		  // Add to cart buttons
		  if (button.matches('.btn-add-to-cart, [data-add-to-cart], .product-form__cart-submit')) {
			console.log('➕ Add to cart button clicked');
			setTimeout(() => {
			  this.checkCartChange('add_to_cart');
			}, 2000);
		  }
		});
		
		// ========== VERIFICAÇÃO PERIÓDICA ==========
		// Como fallback, verificar carrinho periodicamente
		setInterval(() => {
		  this.checkCartChange('periodic_check');
		}, 45000); // A cada 45 segundos
		
		// ========== ESTADO INICIAL ==========
		this.lastCartState = {
		  items: this.getCartItemCount(),
		  value: this.getCartValue()
		};
		
		console.log('🛒 Estado inicial do carrinho:', this.lastCartState);
		console.log(`✅ Cart tracking ativo (${observedContainers} containers observados)`);
	},
    
    setupProductTracking: function() {
      const tracker = window.InfluencerTracker;
      
      // Intersection Observer para produtos visíveis
      const productObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target;
            
            tracker.trackCustomEvent('product_impression', {
              product_id: element.getAttribute('data-product-id'),
              product_handle: element.getAttribute('data-product-handle'),
              product_title: element.getAttribute('data-product-title'),
              product_price: element.getAttribute('data-product-price'),
              visibility_percent: Math.round(entry.intersectionRatio * 100),
              element_position: this.getElementPosition(element)
            });
          }
        });
      }, { threshold: 0.5 });
      
      // Observar produtos na página
      const productSelectors = [
        '[data-product-id]',
        '.product-item',
        '.product-card',
        '.grid-product',
        '.product-grid-item'
      ];
      
      productSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          productObserver.observe(el);
        });
      });
      
      // Tracking de cliques em produtos
      document.addEventListener('click', (e) => {
        const element = e.target;
        const productElement = element.closest('[data-product-id], .product-item, .product-card');
        
        if (productElement) {
          tracker.trackCustomEvent('product_click', {
            product_id: productElement.getAttribute('data-product-id'),
            product_handle: productElement.getAttribute('data-product-handle'),
            product_title: productElement.getAttribute('data-product-title'),
            click_element: element.tagName,
            click_text: element.textContent?.substring(0, 50)
          });
        }
      });
      
      // Tracking de variant selection
      document.addEventListener('change', (e) => {
        if (e.target.matches('select[name="id"], input[name="id"], .product-form__variants select')) {
          const selectedVariant = e.target.value;
          
          tracker.trackCustomEvent('variant_selection', {
            product_id: window.shopifyData?.product?.id,
            variant_id: selectedVariant,
            selection_method: e.target.tagName.toLowerCase()
          });
        }
      });
    },
    
    setupCheckoutTracking: function() {
      const tracker = window.InfluencerTracker;
      
      // Detectar início do checkout
      document.addEventListener('click', (e) => {
        const button = e.target;
        
        if (button.matches('.btn-checkout, [data-checkout], .checkout-button, [href*="/checkout"]')) {
          tracker.trackCustomEvent('checkout_initiated', {
            cart_items: this.getCartItemCount(),
            cart_value: this.getCartValue(),
            checkout_method: button.tagName === 'A' ? 'link' : 'button',
            button_text: button.textContent?.trim()
          });
        }
      });
      
      // Tracking na página de checkout
      if (window.location.pathname.includes('/checkout')) {
        tracker.trackCustomEvent('checkout_page_view', {
          checkout_step: this.getCheckoutStep(),
          cart_items: this.getCartItemCount(),
          cart_value: this.getCartValue()
        });
        
        // Tracking de steps do checkout
        this.setupCheckoutStepTracking();
      }
      
      // Tracking de thank you page
      if (window.location.pathname.includes('/thank_you') || 
          window.location.pathname.includes('/orders/')) {
        this.trackPurchaseCompletion();
      }
    },
    
    setupCheckoutStepTracking: function() {
      const tracker = window.InfluencerTracker;
      
      // Observer para mudanças no checkout
      const checkoutObserver = new MutationObserver(() => {
        const currentStep = this.getCheckoutStep();
        
        if (this.lastCheckoutStep !== currentStep) {
          tracker.trackCustomEvent('shopify_checkout_step_change', {
            previous_step: this.lastCheckoutStep,
            current_step: currentStep,
            cart_items: this.getCartItemCount(),
            cart_value: this.getCartValue()
          });
          
          this.lastCheckoutStep = currentStep;
        }
      });
      
      const checkoutContainer = document.querySelector('.checkout, #checkout, .main-content') || document.body;
      checkoutObserver.observe(checkoutContainer, { childList: true, subtree: true });
    },
    
    // ========== FUNÇÕES AUXILIARES ==========
    checkCartChange: function(trigger) {
      if (this.cartUpdateTimeout) {
        clearTimeout(this.cartUpdateTimeout);
      }
      
      this.cartUpdateTimeout = setTimeout(() => {
        const currentState = {
          items: this.getCartItemCount(),
          value: this.getCartValue()
        };
        
        // Só dispara se houver mudança real
        if (!this.lastCartState || 
            currentState.items !== this.lastCartState.items || 
            Math.abs(currentState.value - this.lastCartState.value) > 0.01) {
          
          console.log('🛒 Cart mudou:', this.lastCartState, '→', currentState);
          
          window.InfluencerTracker.track('cart_update', {
            cart_items: currentState.items,
            cart_value: currentState.value,
            previous_items: this.lastCartState?.items || 0,
            previous_value: this.lastCartState?.value || 0,
            change_trigger: trigger,
            change_type: currentState.items > (this.lastCartState?.items || 0) ? 'add' : 
                        currentState.items < (this.lastCartState?.items || 0) ? 'remove' : 'update'
          });
          
          this.lastCartState = currentState;
        }
      }, 1000);
    },
    
    getCheckoutStep: function() {
      if (document.querySelector('.step-contact, [data-step="contact"]')) return 'contact';
      if (document.querySelector('.step-shipping, [data-step="shipping"]')) return 'shipping';
      if (document.querySelector('.step-payment, [data-step="payment"]')) return 'payment';
      if (document.querySelector('.step-review, [data-step="review"]')) return 'review';
      return 'unknown';
    },
    
    getElementPosition: function(element) {
      const rect = element.getBoundingClientRect();
      return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      };
    },
    
    trackPurchaseCompletion: function() {
      const tracker = window.InfluencerTracker;
      
      // Tentar extrair dados do pedido da página
      const orderData = this.extractOrderData();
      
      tracker.trackCustomEvent('purchase_completed', {
        ...orderData,
        influencer_attribution: JSON.parse(sessionStorage.getItem('inf_attribution') || 'null'),
        page_url: window.location.href
      });
      
      // Também usar o método público do tracker
      if (orderData.order_id) {
        tracker.trackPurchase({
          orderId: orderData.order_id,
          totalValue: orderData.total_value,
          currency: orderData.currency,
          items: orderData.items,
          couponCode: orderData.coupon_code
        });
      }
    },
    
    extractOrderData: function() {
      // Tentar extrair dados do Shopify
      if (window.Shopify?.checkout) {
        return {
          order_id: window.Shopify.checkout.order_id,
          total_value: window.Shopify.checkout.total_price / 100,
          currency: window.Shopify.checkout.currency,
          items: window.Shopify.checkout.line_items,
          coupon_code: window.Shopify.checkout.discount?.code
        };
      }
      
      // Fallback: tentar extrair do DOM
      const orderNumber = document.querySelector('.order-number, [data-order-number]')?.textContent;
      const totalElement = document.querySelector('.total-price, [data-total-price]');
      const total = totalElement ? this.parseCartValue(totalElement.textContent) : 0;
      
      return {
        order_id: orderNumber,
        total_value: total,
        currency: 'USD', // Fallback
        items: [],
        coupon_code: null
      };
    }
  };

})(window, document);

/* === src/utils/helpers.js === */
/*!
 * Influencer Tracker - Utility Functions
 * Funções auxiliares compartilhadas
 */

(function(window) {
    'use strict';
    
    window.InfluencerTrackerUtils = {
      
      // Debounce function
      debounce: function(func, wait, immediate) {
        let timeout;
        return function executedFunction() {
          const context = this;
          const args = arguments;
          
          const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
          };
          
          const callNow = immediate && !timeout;
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
          
          if (callNow) func.apply(context, args);
        };
      },
      
      // Throttle function
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
      },
      
      // Get element position
      getElementPosition: function(element) {
        const rect = element.getBoundingClientRect();
        return {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      },
      
      // Parse currency values
      parseCurrency: function(text) {
        if (!text) return null;
        
        text = String(text).trim();
        let cleaned = text.replace(/[^\d.,\-]/g, '');
        
        if (cleaned.includes(',') && cleaned.includes('.')) {
          if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
          } else {
            cleaned = cleaned.replace(/,/g, '');
          }
        } else if (cleaned.includes(',')) {
          const parts = cleaned.split(',');
          if (parts.length === 2 && parts[1].length <= 2) {
            cleaned = cleaned.replace(',', '.');
          } else {
            cleaned = cleaned.replace(/,/g, '');
          }
        }
        
        const value = parseFloat(cleaned);
        
        if (value > 10000) {
          return value / 100;
        }
        
        return isNaN(value) ? null : value;
      },
      
      // Check if element is visible
      isElementVisible: function(element) {
        const rect = element.getBoundingClientRect();
        return (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
      },
      
      // Get scroll percentage
      getScrollPercentage: function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        return Math.round((scrollTop / scrollHeight) * 100);
      },
      
      // Cookie utilities
      setCookie: function(name, value, days) {
        const expires = days ? `; expires=${new Date(Date.now() + days * 864e5).toUTCString()}` : '';
        document.cookie = `${name}=${value}${expires}; path=/`;
      },
      
      getCookie: function(name) {
        return document.cookie.split('; ').reduce((r, v) => {
          const parts = v.split('=');
          return parts[0] === name ? decodeURIComponent(parts[1]) : r;
        }, '');
      },
      
      // Local storage with fallback
      setStorage: function(key, value, useSession = false) {
        try {
          const storage = useSession ? sessionStorage : localStorage;
          storage.setItem(key, JSON.stringify(value));
          return true;
        } catch (e) {
          console.warn('Storage not available, using cookie fallback');
          this.setCookie(key, JSON.stringify(value), useSession ? null : 30);
          return false;
        }
      },
      
      getStorage: function(key, useSession = false) {
        try {
          const storage = useSession ? sessionStorage : localStorage;
          const item = storage.getItem(key);
          return item ? JSON.parse(item) : null;
        } catch (e) {
          const cookieValue = this.getCookie(key);
          return cookieValue ? JSON.parse(cookieValue) : null;
        }
      }
    };
  
  })(window);


})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : {});