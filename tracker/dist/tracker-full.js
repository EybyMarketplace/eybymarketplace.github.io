/*!
 * Influencer Tracker - FULL Build
 * Version: 2.1.0 with AI Analytics
 * Built: 2025-09-02T18:51:20.384Z
 * Files: src/core/tracker-core.js, src/adapters/shopify-adapter.js, src/ai/ai-data-collector.js, src/utils/helpers.js
 * 
 * Features:
 * - Event Tracking ✅
 * - Affiliate Attribution ✅
 * - Platform Adapters ✅
 * - AI Behavioral Analysis 🤖
 * - Customer Journey Mapping 🤖
 * - Conversion Prediction 🤖
 * 
 * Copyright (c) 2025
 * Licensed under MIT
 */

(function(window, document, undefined) {
  'use strict';
  
  // Build info
  const BUILD_INFO = {
    name: 'full',
    version: '2.1.0',
    timestamp: '2025-09-02T18:51:20.385Z',
    files: ["src/core/tracker-core.js","src/adapters/shopify-adapter.js","src/ai/ai-data-collector.js","src/utils/helpers.js"],
    features: {
      tracking: true,
      attribution: true,
      adapters: true,
      ai: true
    }
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

(function (window, document) {
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
		checkConsent: function () {
			if (!CONFIG.enableConsentCheck) return true;

			const consent = localStorage.getItem('analytics_consent');
			return consent === 'granted';
		},

		waitForConsent: function (callback) {
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
		generateUUID: function () {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
				const r = Math.random() * 16 | 0;
				const v = c == 'x' ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			});
		},

		getUserId: function () {
			let userId = localStorage.getItem('inf_user_id');
			if (!userId) {
				userId = this.generateUUID();
				localStorage.setItem('inf_user_id', userId);
			}
			return userId;
		},

		getSessionId: function () {
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
		detectInfluencer: function () {
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
		generate: function () {
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

		add: function (event) {
			this.queue.push(event);

			if (this.queue.length >= CONFIG.batchSize) {
				this.flush();
			}
		},

		flush: function () {
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

		scheduleFlush: function () {
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

		init: function (options = {}) {
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

		detectPlatform: function () {
			// Shopify
			if (window.Shopify || window.shopifyData ||
				document.querySelector('meta[name="shopify-checkout-api-token"]')) {
				return 'shopify';
			}

			return 'generic';
		},

		loadAdapter: function (platform) {
			const adapterName = `${platform}Adapter`;
			return window[adapterName] || null;
		},

		startTracking: function () {
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

		track: function (eventType, properties = {}) {
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

		setupUniversalTracking: function () {
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

		setupExitTracking: function () {
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
		trackPurchase: function (orderData) {
			this.track('purchase', {
				order_id: orderData.orderId,
				total_value: orderData.totalValue,
				currency: orderData.currency || 'BRL',
				items: orderData.items,
				coupon_code: orderData.couponCode,
				influencer_attribution: JSON.parse(sessionStorage.getItem('inf_attribution') || 'null')
			});
		},

		trackCustomEvent: function (eventName, properties) {
			this.track(eventName, properties);
		},

		// Utility function
		throttle: function (func, limit) {
			let inThrottle;
			return function () {
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
 * Hybrid Shopify Tracker - Universal + Behavioral
 * Funciona com qualquer tema Shopify + dados comportamentais completos
 */

(function(window, document) {
    'use strict';

    const HybridShopifyTracker = {
        initialized: false,
        startTime: Date.now(),
        lastCartState: null,
        lastScrollPercent: 0,
        timeOnPage: 0,
        exitTracked: false,
        checkoutStartTime: null,
        checkoutSteps: [],
        currentStep: null,
        checkoutSessionData: {},
        formInteractions: {},
        abandonmentTracked: false,
        
        // ========== INICIALIZAÇÃO ==========
        init: function() {
            if (this.initialized) return;
            
            console.log('🔄 Inicializando Hybrid Shopify Tracker');
            
            // 1. DADOS DE CARRINHO/PRODUTO (Universal)
            this.setupUniversalEcommerce();
            
            // 2. DADOS COMPORTAMENTAIS (Genérico)
            this.setupBehavioralTracking();
            
            // 3. DADOS ESPECÍFICOS SHOPIFY (API)
            this.setupShopifySpecific();
            
            // 4. CHECKOUT TRACKING AVANÇADO (NOVO)
            this.setupAdvancedCheckoutTracking();
            
            // 5. INICIALIZAÇÃO DE ESTADO
            this.initializeState();
            
            this.initialized = true;
            console.log('✅ Hybrid Shopify Tracker inicializado com checkout tracking');
        },

        // ========== ECOMMERCE UNIVERSAL ==========
        setupUniversalEcommerce: function() {
            console.log('🛒 Configurando tracking de ecommerce universal');
            
            // Interceptar APIs do Shopify
            this.interceptShopifyAPIs();
            
            // Eventos nativos do Shopify
            this.listenToShopifyEvents();
            
            // Polling inteligente como fallback
            this.setupSmartPolling();
        },

        interceptShopifyAPIs: function() {
            const self = this;
            
            // ========== INTERCEPTAR FETCH ==========
            const originalFetch = window.fetch;
            window.fetch = async function(...args) {
                const response = await originalFetch.apply(this, args);
                
                if (response.ok) {
                    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
                    
                    try {
                        // Cart APIs
                        if (url.includes('/cart')) {
                            const clonedResponse = response.clone();
                            
                            if (url.includes('/cart/add')) {
                                const data = await clonedResponse.json();
                                self.handleCartAdd(data, url);
                            } else if (url.includes('/cart/update') || url.includes('/cart/change')) {
                                const data = await clonedResponse.json();
                                self.handleCartUpdate(data, url);
                            } else if (url.includes('/cart/clear')) {
                                self.handleCartClear(url);
                            } else if (url.includes('/cart.js') || url.endsWith('/cart')) {
                                const data = await clonedResponse.json();
                                self.handleCartData(data, url);
                            }
                        }
                        
                        // Product APIs
                        if (url.includes('/products/') && url.includes('.js')) {
                            const data = await clonedResponse.json();
                            self.handleProductData(data, url);
                        }
                        
                        // Checkout APIs
                        if (url.includes('/checkout') || url.includes('/orders')) {
                            // Para checkout, pode ser HTML ou JSON
                            const contentType = response.headers.get('content-type');
                            if (contentType && contentType.includes('application/json')) {
                                const data = await clonedResponse.json();
                                self.handleCheckoutData(data, url);
                            }
                        }
                        
                    } catch (e) {
                        // Ignorar erros de parsing
                        console.log('🔄 Erro ao processar resposta:', e);
                    }
                }
                
                return response;
            };

            // ========== INTERCEPTAR XMLHttpRequest ==========
            const originalOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url, ...rest) {
                if (url.includes('/cart')) {
                    this.addEventListener('load', function() {
                        if (this.status >= 200 && this.status < 300) {
                            try {
                                const data = JSON.parse(this.responseText);
                                
                                if (url.includes('/cart/add')) {
                                    self.handleCartAdd(data, url);
                                } else if (url.includes('/cart/update') || url.includes('/cart/change')) {
                                    self.handleCartUpdate(data, url);
                                } else if (url.includes('/cart.js')) {
                                    self.handleCartData(data, url);
                                }
                            } catch (e) {
                                // Não é JSON válido
                            }
                        }
                    });
                }
                
                return originalOpen.apply(this, [method, url, ...rest]);
            };
            
            console.log('✅ Interceptação de APIs configurada');
        },

        listenToShopifyEvents: function() {
            // Eventos nativos do Shopify (se disponíveis)
            const shopifyEvents = [
                'cart:updated',
                'cart:added', 
                'cart:removed',
                'cart:changed',
                'product:added-to-cart',
                'ajaxCart:updated',
                'drawer:updated'
            ];

            shopifyEvents.forEach(eventName => {
                document.addEventListener(eventName, (e) => {
                    console.log(`🛒 Evento Shopify detectado: ${eventName}`);
                    
                    setTimeout(() => {
                        this.refreshCartState('shopify_event', eventName, e.detail);
                    }, 300);
                });
            });

            // Eventos jQuery (se disponível)
            if (window.jQuery) {
                const $ = window.jQuery;
                
                $(document).on('cart.requestComplete', (event, cart) => {
                    console.log('🛒 Evento jQuery cart.requestComplete');
                    this.handleCartData(cart, 'jquery_event');
                });
            }
        },

        setupSmartPolling: function() {
            let pollInterval = 30000; // 30 segundos inicial
            
            const checkCartState = async () => {
                try {
                    const response = await fetch('/cart.js');
                    if (response.ok) {
                        const cartData = await response.json();
                        this.handleCartData(cartData, 'polling');
                    }
                } catch (e) {
                    console.log('🔄 Erro no polling:', e);
                }
            };

            // Polling adaptativo baseado na atividade do usuário
            setInterval(() => {
                const isActive = document.hasFocus() && !document.hidden;
                pollInterval = isActive ? 20000 : 60000; // Mais frequente se ativo
                
                checkCartState();
            }, pollInterval);
            
            console.log('✅ Polling inteligente configurado');
        },

        // ========== HANDLERS DE DADOS ==========
        handleCartAdd: function(data, url) {
            console.log('🛒 Produto adicionado ao carrinho:', data);
            
            this.track('cart_add', {
                product_id: data.product_id,
                variant_id: data.variant_id || data.id,
                quantity: data.quantity || 1,
                price: data.price ? data.price / 100 : null,
                title: data.title || data.product_title,
                vendor: data.vendor,
                product_type: data.product_type,
                api_endpoint: url,
                timestamp: Date.now()
            });

            // Atualizar estado do carrinho após adição
            setTimeout(() => this.refreshCartState('cart_add'), 500);
        },

        handleCartUpdate: function(data, url) {
            console.log('🛒 Carrinho atualizado:', data);
            
            this.track('cart_update_action', {
                updates: data.updates || data,
                api_endpoint: url,
                timestamp: Date.now()
            });

            setTimeout(() => this.refreshCartState('cart_update'), 500);
        },

        handleCartClear: function(url) {
            console.log('🛒 Carrinho limpo');
            
            this.track('cart_clear', {
                api_endpoint: url,
                timestamp: Date.now()
            });

            setTimeout(() => this.refreshCartState('cart_clear'), 500);
        },

        handleCartData: function(data, source) {
            const currentState = {
                items: data.item_count || 0,
                total: data.total_price ? data.total_price / 100 : 0,
                currency: data.currency || 'USD',
                token: data.token
            };

            // Verificar se houve mudança real
            if (!this.lastCartState || 
                currentState.items !== this.lastCartState.items || 
                Math.abs(currentState.total - this.lastCartState.total) > 0.01) {
                
                console.log('🛒 Estado do carrinho mudou:', this.lastCartState, '→', currentState);
                
                const changeType = this.determineChangeType(this.lastCartState, currentState);
                
                this.track('cart_update', {
                    // Dados básicos
                    cart_items: currentState.items,
                    cart_value: currentState.total,
                    cart_currency: currentState.currency,
                    cart_token: currentState.token,
                    
                    // Dados de mudança
                    previous_items: this.lastCartState?.items || 0,
                    previous_value: this.lastCartState?.total || 0,
                    change_type: changeType,
                    change_trigger: source,
                    
                    // Dados detalhados dos itens
                    items_detail: data.items ? data.items.map(item => ({
                        product_id: item.product_id,
                        variant_id: item.variant_id,
                        quantity: item.quantity,
                        price: item.price / 100,
                        line_price: item.line_price / 100,
                        title: item.title,
                        vendor: item.vendor,
                        product_type: item.product_type,
                        handle: item.handle,
                        sku: item.sku,
                        grams: item.grams,
                        properties: item.properties
                    })) : [],
                    
                    // Dados de desconto
                    total_discount: data.total_discount ? data.total_discount / 100 : 0,
                    discounts: data.cart_level_discount_applications || [],
                    
                    // Metadados
                    cart_note: data.note,
                    cart_attributes: data.attributes || {},
                    
                    // Timestamp
                    timestamp: Date.now()
                });
                
                this.lastCartState = currentState;
            }
        },

        handleProductData: function(data, url) {
            console.log('📦 Dados de produto carregados:', data);
            
            this.track('product_data_loaded', {
                product_id: data.id,
                product_handle: data.handle,
                product_title: data.title,
                product_type: data.product_type,
                vendor: data.vendor,
                price_min: data.price_min / 100,
                price_max: data.price_max / 100,
                available: data.available,
                variants_count: data.variants ? data.variants.length : 0,
                images_count: data.images ? data.images.length : 0,
                tags: data.tags || [],
                api_endpoint: url,
                timestamp: Date.now()
            });
        },

        handleCheckoutData: function(data, url) {
            console.log('💳 Dados de checkout:', data);
            
            this.track('checkout_data', {
                checkout_data: data,
                api_endpoint: url,
                timestamp: Date.now()
            });
        },

        // ========== BEHAVIORAL TRACKING ==========
        setupBehavioralTracking: function() {
            console.log('👤 Configurando tracking comportamental');
            
            this.trackScrollBehavior();
            this.trackTimeOnPage();
            this.trackExitIntent();
            this.trackClickBehavior();
            this.trackFormInteractions();
            this.trackPageVisibility();
        },

        trackScrollBehavior: function() {
            window.addEventListener('scroll', this.throttle(() => {
                const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
                
                if (scrollPercent > this.lastScrollPercent) {
                    this.lastScrollPercent = scrollPercent;
                    
                    // Marcos de scroll
                    if ([25, 50, 75, 90].includes(scrollPercent)) {
                        const scrollData = {
                            scroll_percent: scrollPercent,
                            scroll_depth: window.scrollY,
                            page_height: document.body.scrollHeight,
                            viewport_height: window.innerHeight,
                            timestamp: Date.now()
                        };
                        
                        this.track('scroll_milestone', scrollData);
                        
                        // Salvar na jornada
                        this.saveScrollMilestone(scrollData);
                    }
                }
            }, 1000));
        },

        trackTimeOnPage: function() {
            setInterval(() => {
                this.timeOnPage += 10;
                
                // Marcos de tempo
                if ([30, 60, 120, 300, 600].includes(this.timeOnPage)) {
                    this.track('time_milestone', {
                        seconds_on_page: this.timeOnPage,
                        minutes_on_page: Math.round(this.timeOnPage / 60),
                        is_active: document.hasFocus(),
                        timestamp: Date.now()
                    });
                }
            }, 10000);
        },

        trackExitIntent: function() {
            document.addEventListener('mouseleave', (e) => {
                if (e.clientY <= 0 && !this.exitTracked) {
                    this.exitTracked = true;
                    
                    this.track('exit_intent', {
                        time_on_page: Date.now() - this.startTime,
                        scroll_percent: this.lastScrollPercent,
                        page_url: window.location.href,
                        referrer: document.referrer,
                        timestamp: Date.now()
                    });
                }
            });
        },

        trackClickBehavior: function() {
            document.addEventListener('click', this.throttle((e) => {
                const element = e.target;
                
                // Detectar tipos específicos de clicks
                let clickType = 'generic';
                
                if (element.matches('a[href*="/products/"]')) {
                    clickType = 'product_link';
                } else if (element.matches('button[name="add"], input[name="add"]')) {
                    clickType = 'add_to_cart_button';
                } else if (element.matches('a[href*="/cart"], button[data-cart]')) {
                    clickType = 'cart_link';
                } else if (element.matches('a[href*="/checkout"]')) {
                    clickType = 'checkout_link';
                }
                
                const clickData = {
                    click_type: clickType,
                    element_tag: element.tagName,
                    element_class: element.className,
                    element_id: element.id,
                    element_text: element.textContent?.substring(0, 100),
                    href: element.href,
                    position_x: e.clientX,
                    position_y: e.clientY,
                    timestamp: Date.now()
                };
                
                this.track('click_event', clickData);
                
                // Salvar na jornada
                this.saveInteraction({
                    type: 'click',
                    ...clickData
                });
            }, 500));
        },

        trackFormInteractions: function() {
            // Tracking de interações com formulários
            document.addEventListener('submit', (e) => {
                const form = e.target;
                
                let formType = 'generic';
                if (form.action && form.action.includes('/cart/add')) {
                    formType = 'add_to_cart';
                } else if (form.action && form.action.includes('/contact')) {
                    formType = 'contact';
                } else if (form.querySelector('input[type="email"]')) {
                    formType = 'newsletter';
                }
                
                this.track('form_submit', {
                    form_type: formType,
                    form_action: form.action,
                    form_method: form.method,
                    fields_count: form.elements.length,
                    timestamp: Date.now()
                });
            });
        },

        trackPageVisibility: function() {
            // Tracking de visibilidade da página
            document.addEventListener('visibilitychange', () => {
                this.track('page_visibility_change', {
                    is_visible: !document.hidden,
                    time_on_page: Date.now() - this.startTime,
                    timestamp: Date.now()
                });
            });
        },

        // ========== SHOPIFY ESPECÍFICO ==========
        setupShopifySpecific: function() {
            console.log('🛍️ Configurando tracking específico do Shopify');
            
            this.trackPageType();
            this.trackCustomerData();
            this.trackShopData();
            this.trackVariantSelections();
        },

        trackPageType: function() {
            // Detectar tipo de página atual
            const path = window.location.pathname;
            let pageType = 'other';
            
            if (path.includes('/products/')) {
                pageType = 'product';
                this.trackProductView();
            } else if (path.includes('/collections/')) {
                pageType = 'collection';
                this.trackCollectionView();
            } else if (path.includes('/cart')) {
                pageType = 'cart';
            } else if (path.includes('/checkout')) {
                pageType = 'checkout';
            } else if (path === '/' || path === '') {
                pageType = 'home';
            }
            
            this.track('page_view_detailed', {
                page_type: pageType,
                page_path: path,
                page_title: document.title,
                referrer: document.referrer,
                timestamp: Date.now()
            });
        },

        trackProductView: function() {
            const productData = this.extractProductData();
            
            if (productData) {
                this.track('product_view', {
                    ...productData,
                    timestamp: Date.now()
                });
                
                // Salvar na jornada
                this.saveProductView(productData);
            }
        },

        trackCollectionView: function() {
            const collectionData = this.extractCollectionData();
            
            if (collectionData) {
                this.track('collection_view', {
                    ...collectionData,
                    timestamp: Date.now()
                });
            }
        },

        trackVariantSelections: function() {
            // Detectar mudanças de variante
            const variantSelectors = [
                'input[name="id"]',
                'select[name="id"]',
                '[data-variant-id]',
                '.product-variant-id'
            ];

            variantSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    element.addEventListener('change', () => {
                        this.track('variant_selection', {
                            product_id: this.getProductId(),
                            variant_id: element.value || element.dataset.variantId,
                            product_handle: this.getProductHandle(),
                            selection_method: element.tagName.toLowerCase(),
                            timestamp: Date.now()
                        });
                    });
                });
            });
        },

        trackCustomerData: function() {
            // Dados do cliente (se disponível)
            const customerData = this.extractCustomerData();
            
            if (customerData) {
                this.track('customer_data', {
                    ...customerData,
                    timestamp: Date.now()
                });
            }
        },

        trackShopData: function() {
            // Dados da loja
            const shopData = this.extractShopData();
            
            this.track('shop_data', {
                ...shopData,
                timestamp: Date.now()
            });
        },

        // ========== MÉTODOS AUXILIARES ==========
        refreshCartState: function(trigger, eventName = null, eventDetail = null) {
            setTimeout(async () => {
                try {
                    const response = await fetch('/cart.js');
                    if (response.ok) {
                        const cartData = await response.json();
                        this.handleCartData(cartData, trigger);
                    }
                } catch (e) {
                    console.log('🔄 Erro ao atualizar estado do carrinho:', e);
                }
            }, 300);
        },

        determineChangeType: function(previous, current) {
            if (!previous) return 'initial';
            
            if (current.items > previous.items) return 'add';
            if (current.items < previous.items) return 'remove';
            if (Math.abs(current.total - previous.total) > 0.01) return 'update';
            
            return 'unknown';
        },

        extractProductData: function() {
            // Extrair dados do produto da página atual
            const productData = {};
            
            // Tentar múltiplas fontes
            if (window.product) {
                productData.product_id = window.product.id;
                productData.product_handle = window.product.handle;
                productData.product_title = window.product.title;
                productData.product_type = window.product.type;
                productData.vendor = window.product.vendor;
                productData.price = window.product.price / 100;
                productData.available = window.product.available;
                productData.variants_count = window.product.variants?.length || 0;
            } else if (window.meta?.product) {
                productData.product_id = window.meta.product.id;
                productData.product_handle = window.meta.product.handle;
            }
            
            // Fallback para meta tags
            if (!productData.product_id) {
                const metaProduct = document.querySelector('meta[property="product:retailer_item_id"]');
                if (metaProduct) productData.product_id = metaProduct.content;
            }
            
            return Object.keys(productData).length > 0 ? productData : null;
        },

        extractCollectionData: function() {
            const collectionData = {};
            
            if (window.collection) {
                collectionData.collection_id = window.collection.id;
                collectionData.collection_handle = window.collection.handle;
                collectionData.collection_title = window.collection.title;
                collectionData.products_count = window.collection.products_count;
            }
            
            return Object.keys(collectionData).length > 0 ? collectionData : null;
        },

        extractCustomerData: function() {
            const customerData = {};
            
            if (window.customer) {
                customerData.customer_id = window.customer.id;
                customerData.customer_email = window.customer.email;
                customerData.customer_tags = window.customer.tags;
                customerData.orders_count = window.customer.orders_count;
                customerData.total_spent = window.customer.total_spent;
            } else if (window.Shopify?.customer) {
                customerData.customer_id = window.Shopify.customer.id;
                customerData.customer_email = window.Shopify.customer.email;
            }
            
            return Object.keys(customerData).length > 0 ? customerData : null;
        },

        extractShopData: function() {
            return {
                shop_domain: window.Shopify?.shop || window.shopifyData?.shop?.domain,
                shop_currency: window.Shopify?.currency?.active || window.shopifyData?.shop?.currency,
                shop_money_format: window.Shopify?.money_format,
                shop_locale: window.Shopify?.locale
            };
        },

        getProductId: function() {
            if (window.product?.id) return window.product.id;
            if (window.meta?.product?.id) return window.meta.product.id;
            
            const metaProduct = document.querySelector('meta[property="product:retailer_item_id"]');
            return metaProduct ? metaProduct.content : null;
        },

        getProductHandle: function() {
            if (window.product?.handle) return window.product.handle;
            
            const pathParts = window.location.pathname.split('/');
            return pathParts[pathParts.length - 1] || null;
        },

        initializeState: function() {
            // Estado do carrinho (existente)
            fetch('/cart.js')
                .then(response => response.json())
                .then(cartData => {
                    this.lastCartState = {
                        items: cartData.item_count || 0,
                        total: cartData.total_price ? cartData.total_price / 100 : 0,
                        currency: cartData.currency || 'USD',
                        token: cartData.token
                    };
                    
                    console.log('🛒 Estado inicial do carrinho:', this.lastCartState);
                })
                .catch(e => {
                    console.log('⚠️ Erro ao carregar estado inicial do carrinho:', e);
                    this.lastCartState = { items: 0, total: 0, currency: 'USD', token: null };
                });
            
            // Salvar visita da página atual
            this.savePageVisit({
                page_type: this.detectPageType(),
                referrer: document.referrer
            });
            
            // Verificar checkout abandonado
            this.checkForAbandonedCheckout();
            
            console.log('✅ Estado inicial configurado');
        },

        detectPageType: function() {
            const path = window.location.pathname;
            
            if (path.includes('/products/')) return 'product';
            if (path.includes('/collections/')) return 'collection';
            if (path.includes('/cart')) return 'cart';
            if (path.includes('/checkout')) return 'checkout';
            if (path.includes('/thank_you') || path.includes('/orders/')) return 'thank_you';
            if (path === '/' || path === '') return 'home';
            
            return 'other';
        },

        getInfluencerAttribution: function() {
            try {
                return JSON.parse(sessionStorage.getItem('inf_attribution') || 'null');
            } catch (e) {
                return null;
            }
        },
        
        getCustomerJourney: function() {
            // Construir jornada do cliente baseada no histórico da sessão
            const journey = {
                session_start: this.startTime,
                pages_visited: this.getPagesVisited(),
                products_viewed: this.getProductsViewed(),
                time_on_site: Date.now() - this.startTime,
                scroll_milestones: this.getScrollMilestones(),
                interactions: this.getInteractionHistory()
            };
            
            return journey;
        },
        
        getPagesVisited: function() {
            try {
                return JSON.parse(sessionStorage.getItem('pages_visited') || '[]');
            } catch (e) {
                return [];
            }
        },
        
        getProductsViewed: function() {
            try {
                return JSON.parse(sessionStorage.getItem('products_viewed') || '[]');
            } catch (e) {
                return [];
            }
        },
        
        getScrollMilestones: function() {
            try {
                return JSON.parse(sessionStorage.getItem('scroll_milestones') || '[]');
            } catch (e) {
                return [];
            }
        },
        
        getInteractionHistory: function() {
            try {
                return JSON.parse(sessionStorage.getItem('interaction_history') || '[]');
            } catch (e) {
                return [];
            }
        },

        // ========== MÉTODO DE TRACKING ==========
        track: function(eventType, properties = {}) {
            // Usar o tracker principal
            if (window.InfluencerTracker && window.InfluencerTracker.track) {
                window.InfluencerTracker.track(eventType, properties);
            } else {
                console.log('📊 Evento rastreado:', eventType, properties);
            }
        },

        // ========== ENRICHMENT PARA COMPATIBILIDADE ==========
        enrichEvent: function(eventType, properties) {
            const shopifyData = this.extractShopData();
            const customerData = this.extractCustomerData();
            
            return {
                ...shopifyData,
                ...customerData,
                platform_version: 'hybrid',
                tracking_method: 'universal_api'
            };
        },

        // ========== UTILITY FUNCTIONS ==========
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

        // ========== SALVAR DADOS DA JORNADA ==========

        savePageVisit: function(pageData) {
            try {
                const pages = this.getPagesVisited();
                pages.push({
                    url: window.location.href,
                    title: document.title,
                    timestamp: Date.now(),
                    ...pageData
                });
                
                // Manter apenas últimas 50 páginas
                sessionStorage.setItem('pages_visited', JSON.stringify(pages.slice(-50)));
            } catch (e) {
                console.log('Erro ao salvar visita de página:', e);
            }
        },

        saveProductView: function(productData) {
            try {
                const products = this.getProductsViewed();
                products.push({
                    timestamp: Date.now(),
                    ...productData
                });
                
                // Manter apenas últimos 20 produtos
                sessionStorage.setItem('products_viewed', JSON.stringify(products.slice(-20)));
            } catch (e) {
                console.log('Erro ao salvar visualização de produto:', e);
            }
        },

        saveScrollMilestone: function(scrollData) {
            try {
                const milestones = this.getScrollMilestones();
                milestones.push({
                    timestamp: Date.now(),
                    page: window.location.href,
                    ...scrollData
                });
                
                // Manter apenas últimos 100 milestones
                sessionStorage.setItem('scroll_milestones', JSON.stringify(milestones.slice(-100)));
            } catch (e) {
                console.log('Erro ao salvar milestone de scroll:', e);
            }
        },

        saveInteraction: function(interactionData) {
            try {
                const interactions = this.getInteractionHistory();
                interactions.push({
                    timestamp: Date.now(),
                    page: window.location.href,
                    ...interactionData
                });
                
                // Manter apenas últimas 200 interações
                sessionStorage.setItem('interaction_history', JSON.stringify(interactions.slice(-200)));
            } catch (e) {
                console.log('Erro ao salvar interação:', e);
            }
        },



        // ========== MÉTODOS DE CHECKOUT TRACKING ==========

        setupAdvancedCheckoutTracking: function() {
            console.log('💳 Configurando checkout tracking avançado');
            
            // Detectar se está no checkout
            if (this.isCheckoutPage()) {
                this.initCheckoutTracking();
            }
            
            // Detectar navegação para checkout
            this.monitorCheckoutNavigation();
            
            // Detectar thank you page
            if (this.isThankYouPage()) {
                this.handlePurchaseCompletion();
            }
        },

        isCheckoutPage: function() {
            return window.location.pathname.includes('/checkout') || 
                window.location.pathname.includes('/checkouts/') ||
                document.querySelector('.checkout, #checkout, [data-checkout]') ||
                document.querySelector('body.checkout, body[class*="checkout"]');
        },

        isThankYouPage: function() {
            return window.location.pathname.includes('/thank_you') ||
                window.location.pathname.includes('/orders/') ||
                document.querySelector('.order-confirmation, .thank-you, [data-order-confirmation]');
        },

        monitorCheckoutNavigation: function() {
            // Monitor cliques em botões de checkout
            document.addEventListener('click', (e) => {
                const element = e.target;
                
                // Detectar cliques em botões de checkout
                if (this.isCheckoutButton(element)) {
                    this.track('checkout_button_clicked', {
                        button_text: element.textContent?.trim(),
                        button_location: this.getElementLocation(element),
                        cart_value: this.getCartValue(),
                        cart_items: this.getCartItemCount(),
                        influencer_attribution: this.getInfluencerAttribution(),
                        timestamp: Date.now()
                    });
                }
            });
            
            // Monitor mudanças de URL para detectar entrada no checkout
            let lastUrl = window.location.href;
            const urlObserver = new MutationObserver(() => {
                const currentUrl = window.location.href;
                if (currentUrl !== lastUrl) {
                    if (this.isCheckoutPage() && !lastUrl.includes('/checkout')) {
                        // Entrou no checkout
                        setTimeout(() => this.initCheckoutTracking(), 500);
                    }
                    lastUrl = currentUrl;
                }
            });
            
            urlObserver.observe(document, { subtree: true, childList: true });
        },

        isCheckoutButton: function(element) {
            const text = element.textContent?.toLowerCase() || '';
            const classes = element.className?.toLowerCase() || '';
            const id = element.id?.toLowerCase() || '';
            
            const checkoutKeywords = ['checkout', 'finalizar', 'comprar', 'buy now', 'purchase'];
            
            return checkoutKeywords.some(keyword => 
                text.includes(keyword) || 
                classes.includes(keyword) || 
                id.includes(keyword)
            ) || element.matches('[href*="/checkout"], [data-checkout], .checkout-btn, .btn-checkout');
        },

        initCheckoutTracking: function() {
            if (this.checkoutStartTime) return; // Já inicializado
            
            console.log('💳 Inicializando tracking de checkout');
            
            this.checkoutStartTime = Date.now();
            this.checkoutSteps = [];
            this.currentStep = this.detectCheckoutStep();
            this.checkoutSessionData = this.initCheckoutSession();
            this.abandonmentTracked = false;
            
            // Track início do checkout
            this.track('checkout_started', {
                checkout_id: this.generateCheckoutId(),
                cart_value: this.getCartValue(),
                cart_items: this.getCartItemCount(),
                cart_details: this.getCartDetails(),
                influencer_attribution: this.getInfluencerAttribution(),
                customer_journey: this.getCustomerJourney(),
                entry_method: this.getCheckoutEntryMethod(),
                device_info: this.getDeviceInfo(),
                initial_step: this.currentStep,
                timestamp: Date.now()
            });
            
            // Salvar início da sessão de checkout
            this.saveCheckoutSession();
            
            // Configurar monitoramento
            this.monitorCheckoutSteps();
            this.monitorCheckoutForms();
            this.monitorCheckoutAbandonment();
            this.monitorCheckoutPerformance();
            
            console.log('✅ Checkout tracking ativo para step:', this.currentStep);
        },

        initCheckoutSession: function() {
            return {
                checkout_id: this.generateCheckoutId(),
                start_time: Date.now(),
                steps_data: {},
                form_interactions: {},
                performance_metrics: {},
                user_behavior: {
                    scroll_events: [],
                    click_events: [],
                    focus_events: []
                }
            };
        },

        generateCheckoutId: function() {
            return 'checkout_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },

        detectCheckoutStep: function() {
            // Múltiplas estratégias para detectar o step atual
            
            // Estratégia 1: Atributos data
            if (document.querySelector('[data-step="contact"], [data-checkout-step="contact"]')) return 'contact';
            if (document.querySelector('[data-step="shipping"], [data-checkout-step="shipping"]')) return 'shipping';
            if (document.querySelector('[data-step="payment"], [data-checkout-step="payment"]')) return 'payment';
            if (document.querySelector('[data-step="review"], [data-checkout-step="review"]')) return 'review';
            
            // Estratégia 2: Classes CSS
            if (document.querySelector('.step-contact, .checkout-step-contact')) return 'contact';
            if (document.querySelector('.step-shipping, .checkout-step-shipping')) return 'shipping';
            if (document.querySelector('.step-payment, .checkout-step-payment')) return 'payment';
            if (document.querySelector('.step-review, .checkout-step-review')) return 'review';
            
            // Estratégia 3: Conteúdo da página
            if (document.querySelector('input[name="email"], #email')) return 'contact';
            if (document.querySelector('select[name="country"], input[name="address1"]')) return 'shipping';
            if (document.querySelector('input[name="number"], [data-payment]')) return 'payment';
            
            // Estratégia 4: URL
            const url = window.location.href;
            if (url.includes('contact')) return 'contact';
            if (url.includes('shipping')) return 'shipping';
            if (url.includes('payment')) return 'payment';
            if (url.includes('review')) return 'review';
            
            // Estratégia 5: Breadcrumbs ou navegação
            const activeStep = document.querySelector('.breadcrumb .active, .checkout-nav .active, .step.active');
            if (activeStep) {
                const text = activeStep.textContent?.toLowerCase() || '';
                if (text.includes('contact') || text.includes('information')) return 'contact';
                if (text.includes('shipping') || text.includes('delivery')) return 'shipping';
                if (text.includes('payment') || text.includes('billing')) return 'payment';
                if (text.includes('review') || text.includes('confirm')) return 'review';
            }
            
            return 'unknown';
        },

        monitorCheckoutSteps: function() {
            const observer = new MutationObserver(() => {
                const newStep = this.detectCheckoutStep();
                
                if (newStep !== this.currentStep && newStep !== 'unknown') {
                    const stepTime = Date.now() - this.checkoutStartTime;
                    const previousStep = this.currentStep;
                    
                    console.log(`💳 Step mudou: ${previousStep} → ${newStep}`);
                    
                    // Track step completion
                    if (previousStep && previousStep !== 'unknown') {
                        this.track('checkout_step_completed', {
                            checkout_id: this.checkoutSessionData.checkout_id,
                            step: previousStep,
                            next_step: newStep,
                            time_on_step: stepTime,
                            step_data: this.getStepData(previousStep),
                            form_interactions: this.formInteractions[previousStep] || {},
                            step_performance: this.getStepPerformance(previousStep),
                            timestamp: Date.now()
                        });
                        
                        this.checkoutSteps.push({
                            step: previousStep,
                            time_spent: stepTime,
                            completed: true,
                            data: this.getStepData(previousStep)
                        });
                    }
                    
                    // Track new step start
                    this.track('checkout_step_started', {
                        checkout_id: this.checkoutSessionData.checkout_id,
                        step: newStep,
                        previous_step: previousStep,
                        total_time_in_checkout: Date.now() - this.checkoutSessionData.start_time,
                        timestamp: Date.now()
                    });
                    
                    this.currentStep = newStep;
                    this.checkoutStartTime = Date.now();
                    
                    // Reset form interactions para o novo step
                    this.formInteractions[newStep] = {};
                    
                    // Salvar progresso
                    this.saveCheckoutSession();
                }
            });
            
            observer.observe(document.body, { 
                childList: true, 
                subtree: true, 
                attributes: true,
                attributeFilter: ['class', 'data-step', 'data-checkout-step']
            });
        },

        monitorCheckoutForms: function() {
            console.log('📝 Monitorando interações com formulários');
            
            // Monitor todos os inputs, selects e textareas
            const formElements = document.querySelectorAll('input, select, textarea');
            
            formElements.forEach(element => {
                this.setupFieldMonitoring(element);
            });
            
            // Monitor novos elementos adicionados dinamicamente
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const newFields = node.querySelectorAll('input, select, textarea');
                            newFields.forEach(field => this.setupFieldMonitoring(field));
                        }
                    });
                });
            });
            
            observer.observe(document.body, { childList: true, subtree: true });
        },

        setupFieldMonitoring: function(element) {
            if (element.dataset.trackerMonitored) return; // Já monitorado
            element.dataset.trackerMonitored = 'true';
            
            const fieldName = element.name || element.id || element.placeholder || 'unknown';
            const fieldType = element.type || element.tagName.toLowerCase();
            
            let interactionData = {
                field_name: fieldName,
                field_type: fieldType,
                focus_count: 0,
                input_count: 0,
                total_focus_time: 0,
                value_changes: 0,
                focus_start: null,
                initial_value: element.value,
                error_count: 0
            };
            
            // Focus events
            element.addEventListener('focus', () => {
                interactionData.focus_count++;
                interactionData.focus_start = Date.now();
                
                this.track('checkout_field_focus', {
                    checkout_id: this.checkoutSessionData.checkout_id,
                    step: this.currentStep,
                    field_name: fieldName,
                    field_type: fieldType,
                    focus_count: interactionData.focus_count,
                    timestamp: Date.now()
                });
            });
            
            // Blur events
            element.addEventListener('blur', () => {
                if (interactionData.focus_start) {
                    const focusTime = Date.now() - interactionData.focus_start;
                    interactionData.total_focus_time += focusTime;
                    interactionData.focus_start = null;
                    
                    this.track('checkout_field_blur', {
                        checkout_id: this.checkoutSessionData.checkout_id,
                        step: this.currentStep,
                        field_name: fieldName,
                        field_type: fieldType,
                        focus_time: focusTime,
                        total_focus_time: interactionData.total_focus_time,
                        has_value: !!element.value,
                        timestamp: Date.now()
                    });
                }
            });
            
            // Input events
            element.addEventListener('input', () => {
                interactionData.input_count++;
                
                if (element.value !== interactionData.initial_value) {
                    interactionData.value_changes++;
                }
                
                // Throttle input tracking
                this.throttledTrackInput(element, interactionData);
            });
            
            // Change events (para selects)
            element.addEventListener('change', () => {
                this.track('checkout_field_change', {
                    checkout_id: this.checkoutSessionData.checkout_id,
                    step: this.currentStep,
                    field_name: fieldName,
                    field_type: fieldType,
                    new_value: fieldType === 'select-one' ? element.value : '[hidden]',
                    timestamp: Date.now()
                });
            });
            
            // Error detection
            const checkForErrors = () => {
                const hasError = element.classList.contains('error') || 
                                element.classList.contains('invalid') ||
                                element.getAttribute('aria-invalid') === 'true' ||
                                element.closest('.error, .invalid, [data-error]');
                
                if (hasError) {
                    interactionData.error_count++;
                    
                    this.track('checkout_field_error', {
                        checkout_id: this.checkoutSessionData.checkout_id,
                        step: this.currentStep,
                        field_name: fieldName,
                        field_type: fieldType,
                        error_count: interactionData.error_count,
                        timestamp: Date.now()
                    });
                }
            };
            
            // Check for errors periodically
            setInterval(checkForErrors, 2000);
            
            // Salvar dados de interação
            if (!this.formInteractions[this.currentStep]) {
                this.formInteractions[this.currentStep] = {};
            }
            this.formInteractions[this.currentStep][fieldName] = interactionData;
        },

        throttledTrackInput: (() => {
            const throttleMap = new Map();
            
            return function(element, interactionData) {
                const fieldName = interactionData.field_name;
                
                if (throttleMap.has(fieldName)) {
                    clearTimeout(throttleMap.get(fieldName));
                }
                
                throttleMap.set(fieldName, setTimeout(() => {
                    this.track('checkout_field_input', {
                        checkout_id: this.checkoutSessionData.checkout_id,
                        step: this.currentStep,
                        field_name: fieldName,
                        field_type: interactionData.field_type,
                        input_count: interactionData.input_count,
                        value_changes: interactionData.value_changes,
                        has_value: !!element.value,
                        value_length: element.value?.length || 0,
                        timestamp: Date.now()
                    });
                    
                    throttleMap.delete(fieldName);
                }, 1000));
            };
        })(),

        monitorCheckoutAbandonment: function() {
            console.log('🚪 Monitorando abandono de checkout');
            
            // Detectar tentativas de saída
            window.addEventListener('beforeunload', (e) => {
                if (!this.abandonmentTracked && this.isCheckoutPage()) {
                    this.trackCheckoutAbandonment('page_unload');
                }
            });
            
            // Detectar mouse leave (exit intent)
            document.addEventListener('mouseleave', (e) => {
                if (e.clientY <= 0 && !this.abandonmentTracked && this.isCheckoutPage()) {
                    this.track('checkout_exit_intent', {
                        checkout_id: this.checkoutSessionData.checkout_id,
                        step: this.currentStep,
                        time_in_checkout: Date.now() - this.checkoutSessionData.start_time,
                        time_on_current_step: Date.now() - this.checkoutStartTime,
                        form_completion: this.calculateFormCompletion(),
                        timestamp: Date.now()
                    });
                }
            });
            
            // Detectar inatividade prolongada
            let inactivityTimer;
            const resetInactivityTimer = () => {
                clearTimeout(inactivityTimer);
                inactivityTimer = setTimeout(() => {
                    if (this.isCheckoutPage() && !this.abandonmentTracked) {
                        this.track('checkout_inactivity', {
                            checkout_id: this.checkoutSessionData.checkout_id,
                            step: this.currentStep,
                            inactivity_duration: 300000, // 5 minutos
                            timestamp: Date.now()
                        });
                    }
                }, 300000); // 5 minutos
            };
            
            // Reset timer em qualquer atividade
            ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
                document.addEventListener(event, resetInactivityTimer, { passive: true });
            });
            
            resetInactivityTimer();
        },

        trackCheckoutAbandonment: function(reason) {
            if (this.abandonmentTracked) return;
            this.abandonmentTracked = true;
            
            console.log('🚪 Checkout abandonado:', reason);
            
            this.track('checkout_abandonment', {
                checkout_id: this.checkoutSessionData.checkout_id,
                abandonment_reason: reason,
                abandonment_step: this.currentStep,
                time_in_checkout: Date.now() - this.checkoutSessionData.start_time,
                time_on_current_step: Date.now() - this.checkoutStartTime,
                steps_completed: this.checkoutSteps,
                form_completion: this.calculateFormCompletion(),
                cart_value: this.getCartValue(),
                cart_items: this.getCartItemCount(),
                influencer_attribution: this.getInfluencerAttribution(),
                customer_journey: this.getCustomerJourney(),
                device_info: this.getDeviceInfo(),
                performance_metrics: this.getCheckoutPerformanceMetrics(),
                timestamp: Date.now()
            });
            
            // Salvar abandono para possível recovery
            this.saveAbandonmentData();
        },

        monitorCheckoutPerformance: function() {
            // Monitor performance metrics
            if ('PerformanceObserver' in window) {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        if (entry.entryType === 'navigation') {
                            this.checkoutSessionData.performance_metrics.page_load = {
                                load_time: entry.loadEventEnd - entry.loadEventStart,
                                dom_content_loaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                                first_paint: entry.responseEnd - entry.requestStart
                            };
                        }
                    });
                });
                
                observer.observe({ entryTypes: ['navigation'] });
            }
            
            // Monitor network requests durante checkout
            const originalFetch = window.fetch;
            window.fetch = async function(...args) {
                const startTime = Date.now();
                const response = await originalFetch.apply(this, args);
                const endTime = Date.now();
                
                if (args[0] && typeof args[0] === 'string' && args[0].includes('checkout')) {
                    this.track('checkout_api_request', {
                        checkout_id: this.checkoutSessionData.checkout_id,
                        url: args[0],
                        method: args[1]?.method || 'GET',
                        duration: endTime - startTime,
                        status: response.status,
                        step: this.currentStep,
                        timestamp: Date.now()
                    });
                }
                
                return response;
            }.bind(this);
        },

        handlePurchaseCompletion: function() {
            console.log('🎉 Purchase completed - coletando dados finais');
            
            const orderData = this.extractOrderData();
            const checkoutSession = this.getCheckoutSession();
            
            this.track('purchase_completed_detailed', {
                // Dados do pedido
                ...orderData,
                
                // Dados da sessão de checkout
                checkout_session: checkoutSession,
                
                // Jornada completa
                customer_journey: this.getCustomerJourney(),
                influencer_attribution: this.getInfluencerAttribution(),
                
                // Performance
                total_checkout_time: checkoutSession ? Date.now() - checkoutSession.start_time : null,
                
                // Device e contexto
                device_info: this.getDeviceInfo(),
                
                timestamp: Date.now()
            });
            
            // Limpar dados de sessão
            this.clearCheckoutSession();
        },

        // ========== MÉTODOS AUXILIARES ==========

        getStepData: function(step) {
            const data = {};
            
            try {
                switch(step) {
                    case 'contact':
                        data.email = this.getFieldValue('email');
                        data.phone = this.getFieldValue('phone');
                        data.newsletter_signup = this.getCheckboxValue('newsletter');
                        break;
                    case 'shipping':
                        data.shipping_method = this.getSelectedShippingMethod();
                        data.address_country = this.getFieldValue('country');
                        data.address_state = this.getFieldValue('province');
                        data.address_city = this.getFieldValue('city');
                        data.shipping_price = this.getShippingPrice();
                        break;
                    case 'payment':
                        data.payment_method = this.getSelectedPaymentMethod();
                        data.billing_same_as_shipping = this.getCheckboxValue('billing_same_as_shipping');
                        break;
                }
            } catch (e) {
                console.log('Erro ao extrair dados do step:', e);
            }
            
            return data;
        },

        getFieldValue: function(fieldName) {
            const selectors = [
                `input[name="${fieldName}"]`,
                `select[name="${fieldName}"]`,
                `textarea[name="${fieldName}"]`,
                `#${fieldName}`,
                `input[name*="${fieldName}"]`,
                `select[name*="${fieldName}"]`
            ];
            
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    return element.value || null;
                }
            }
            
            return null;
        },

        getCheckboxValue: function(fieldName) {
            const element = document.querySelector(`input[name="${fieldName}"], input[name*="${fieldName}"], #${fieldName}`);
            return element ? element.checked : null;
        },

        getSelectedShippingMethod: function() {
            const selected = document.querySelector('input[name*="shipping"]:checked, select[name*="shipping"] option:checked');
            return selected ? selected.value || selected.textContent : null;
        },

        getSelectedPaymentMethod: function() {
            const selected = document.querySelector('input[name*="payment"]:checked, select[name*="payment"] option:checked');
            return selected ? selected.value || selected.textContent : null;
        },

        getShippingPrice: function() {
            const priceElement = document.querySelector('.shipping-price, [data-shipping-price], .delivery-price');
            if (priceElement) {
                const priceText = priceElement.textContent;
                const price = parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(',', '.'));
                return isNaN(price) ? null : price;
            }
            return null;
        },

        calculateFormCompletion: function() {
            const allFields = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
            const filledFields = Array.from(allFields).filter(field => field.value && field.value.trim() !== '');
            
            return allFields.length > 0 ? Math.round((filledFields.length / allFields.length) * 100) : 0;
        },

        getStepPerformance: function(step) {
            return {
                api_requests: this.checkoutSessionData.performance_metrics.api_requests || 0,
                load_time: this.checkoutSessionData.performance_metrics.load_time || null,
                form_interactions: Object.keys(this.formInteractions[step] || {}).length
            };
        },

        getCheckoutEntryMethod: function() {
            const referrer = document.referrer;
            
            if (referrer.includes('/cart')) return 'cart_page';
            if (referrer.includes('/products/')) return 'product_page';
            if (referrer.includes('/collections/')) return 'collection_page';
            if (referrer.includes('checkout')) return 'direct_checkout';
            if (!referrer) return 'direct_url';
            
            return 'unknown';
        },

        getCartDetails: function() {
            // Tentar obter detalhes do carrinho
            try {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', '/cart.js', false);
                xhr.send();
                
                if (xhr.status === 200) {
                    const cartData = JSON.parse(xhr.responseText);
                    return {
                        items: cartData.items.map(item => ({
                            product_id: item.product_id,
                            variant_id: item.variant_id,
                            quantity: item.quantity,
                            price: item.price / 100,
                            title: item.title
                        })),
                        total_discount: cartData.total_discount / 100,
                        currency: cartData.currency
                    };
                }
            } catch (e) {
                console.log('Erro ao obter detalhes do carrinho:', e);
            }
            
            return null;
        },

        getDeviceInfo: function() {
            return {
                user_agent: navigator.userAgent,
                screen_resolution: `${screen.width}x${screen.height}`,
                viewport_size: `${window.innerWidth}x${window.innerHeight}`,
                device_pixel_ratio: window.devicePixelRatio,
                connection: navigator.connection ? {
                    effective_type: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink
                } : null,
                touch_support: 'ontouchstart' in window
            };
        },

        getCheckoutPerformanceMetrics: function() {
            return this.checkoutSessionData.performance_metrics || {};
        },

        extractOrderData: function() {
            // Tentar extrair dados do pedido da thank you page
            const orderData = {};
            
            // Shopify checkout object
            if (window.Shopify?.checkout) {
                orderData.order_id = window.Shopify.checkout.order_id;
                orderData.order_number = window.Shopify.checkout.order_number;
                orderData.total_price = window.Shopify.checkout.total_price / 100;
                orderData.currency = window.Shopify.checkout.currency;
                orderData.customer_id = window.Shopify.checkout.customer_id;
            }
            
            // Fallback: extrair do DOM
            if (!orderData.order_id) {
                const orderElement = document.querySelector('.order-number, [data-order-number], .order-id');
                if (orderElement) {
                    orderData.order_number = orderElement.textContent?.trim();
                }
            }
            
            return orderData;
        },

        getElementLocation: function(element) {
            const rect = element.getBoundingClientRect();
            return {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
                viewport_position: {
                    x_percent: Math.round((rect.left / window.innerWidth) * 100),
                    y_percent: Math.round((rect.top / window.innerHeight) * 100)
                }
            };
        },

        // ========== SESSION MANAGEMENT ==========

        saveCheckoutSession: function() {
            try {
                sessionStorage.setItem('checkout_session', JSON.stringify(this.checkoutSessionData));
            } catch (e) {
                console.log('Erro ao salvar sessão de checkout:', e);
            }
        },

        getCheckoutSession: function() {
            try {
                return JSON.parse(sessionStorage.getItem('checkout_session') || 'null');
            } catch (e) {
                return null;
            }
        },

        clearCheckoutSession: function() {
            try {
                sessionStorage.removeItem('checkout_session');
            } catch (e) {
                console.log('Erro ao limpar sessão de checkout:', e);
            }
        },

        saveAbandonmentData: function() {
            const abandonmentData = {
                checkout_id: this.checkoutSessionData.checkout_id,
                abandonment_time: Date.now(),
                step: this.currentStep,
                cart_value: this.getCartValue(),
                form_completion: this.calculateFormCompletion(),
                influencer_attribution: this.getInfluencerAttribution()
            };
            
            try {
                localStorage.setItem('checkout_abandonment', JSON.stringify(abandonmentData));
            } catch (e) {
                console.log('Erro ao salvar dados de abandono:', e);
            }
        },


        // ========== RECOVERY DE CHECKOUT ABANDONADO ==========

        checkForAbandonedCheckout: function() {
            try {
                const abandonmentData = JSON.parse(localStorage.getItem('checkout_abandonment') || 'null');
                
                if (abandonmentData) {
                    const timeSinceAbandonment = Date.now() - abandonmentData.abandonment_time;
                    
                    // Se abandono foi há menos de 24 horas
                    if (timeSinceAbandonment < 24 * 60 * 60 * 1000) {
                        this.track('checkout_recovery_opportunity', {
                            original_checkout_id: abandonmentData.checkout_id,
                            time_since_abandonment: timeSinceAbandonment,
                            abandoned_step: abandonmentData.step,
                            abandoned_cart_value: abandonmentData.cart_value,
                            recovery_page: window.location.href,
                            timestamp: Date.now()
                        });
                        
                        // Se voltou ao checkout, track como recovery attempt
                        if (this.isCheckoutPage()) {
                            this.track('checkout_recovery_attempt', {
                                original_checkout_id: abandonmentData.checkout_id,
                                time_since_abandonment: timeSinceAbandonment,
                                timestamp: Date.now()
                            });
                            
                            // Limpar dados de abandono
                            localStorage.removeItem('checkout_abandonment');
                        }
                    } else {
                        // Limpar dados antigos
                        localStorage.removeItem('checkout_abandonment');
                    }
                }
            } catch (e) {
                console.log('Erro ao verificar checkout abandonado:', e);
            }
        },




    };

    // ========== EXPOR GLOBALMENTE ==========
    window.shopifyAdapter = HybridShopifyTracker;
    
    console.log('🔄 Hybrid Shopify Tracker carregado');

})(window, document);

/* === src/ai/ai-data-collector.js === */
/*!
 * AI Data Collector - Integração com customer_sessions existente
 */

(function (window, document) {
    'use strict';

    const AISessionAnalyzer = {
        sessionStart: Date.now(),
        behaviorMetrics: {
            pageViews: 0,
            productViews: 0,
            cartActions: 0,
            totalClicks: 0,
            scrollDepth: [],
            timeOnPages: []
        },

        // Analisar comportamento baseado nos eventos já coletados
        analyzeBehavior: function () {
            const sessionDuration = Date.now() - this.sessionStart;
            const metrics = this.behaviorMetrics;

            return {
                behavioral_segment: this.getBehavioralSegment(metrics, sessionDuration),
                conversion_probability: this.getConversionProbability(metrics, sessionDuration),
                engagement_quality: this.getEngagementQuality(metrics, sessionDuration),
                device_tier: this.getDeviceTier(),
                attribution_confidence: this.getAttributionConfidence()
            };
        },

        getBehavioralSegment: function (metrics, duration) {
            // Lógica baseada nos eventos já coletados
            if (metrics.cartActions > 0 && duration < 300000) return 'decisive_buyer';
            if (metrics.cartActions > 2) return 'hesitant_buyer';
            if (metrics.productViews > 5 && metrics.cartActions === 0) return 'researcher';
            if (metrics.totalClicks > 10) return 'price_conscious';
            return 'casual_browser';
        },

        getConversionProbability: function (metrics, duration) {
            let score = 0;

            if (metrics.cartActions > 0) score += 40;
            if (metrics.productViews > 3) score += 20;
            if (duration > 180000) score += 20; // > 3 min
            if (metrics.totalClicks > 5) score += 10;
            if (metrics.pageViews > 5) score += 10;

            if (score >= 70) return 'high';
            if (score >= 40) return 'medium';
            return 'low';
        },

        getEngagementQuality: function (metrics, duration) {
            const avgScrollDepth = metrics.scrollDepth.length > 0 ?
                metrics.scrollDepth.reduce((a, b) => a + b, 0) / metrics.scrollDepth.length : 0;

            let score = 0;
            score += metrics.pageViews * 5;
            score += (duration / 1000) * 0.1;
            score += metrics.totalClicks * 2;
            score += avgScrollDepth * 0.5;

            if (score >= 100) return 'high';
            if (score >= 50) return 'medium';
            return 'low';
        },

        getDeviceTier: function () {
            const memory = navigator.deviceMemory || 4;
            const cores = navigator.hardwareConcurrency || 4;
            const screen = window.screen;
            const resolution = screen.width * screen.height;

            if (memory >= 8 && cores >= 8 && resolution > 2073600) return 'premium';
            if (memory >= 4 && resolution > 921600) return 'mid_range';
            return 'budget';
        },

        getAttributionConfidence: function () {
            // Calcular confiança baseada nos dados de atribuição
            let confidence = 0.3; // Base

            const urlParams = new URLSearchParams(window.location.search);
            const hasAffiliateCode = urlParams.get('affiliate') || urlParams.get('ref');
            const hasUTM = urlParams.get('utm_source');
            const hasSocialRef = document.referrer &&
                ['instagram.com', 'tiktok.com', 'youtube.com', 'facebook.com'].some(domain =>
                    document.referrer.includes(domain));

            if (hasAffiliateCode) confidence += 0.4;
            if (hasUTM) confidence += 0.2;
            if (hasSocialRef) confidence += 0.1;

            return Math.min(confidence, 1.0);
        },

        // Atualizar métricas baseado nos eventos
        updateMetrics: function (eventType, eventData) {
            switch (eventType) {
                case 'page_view':
                    this.behaviorMetrics.pageViews++;
                    break;
                case 'product_view':
                case 'product_impression': 
                    this.behaviorMetrics.productViews++;
                    break;
                case 'cart_update': 
                    this.behaviorMetrics.cartActions++;
                    break;
                case 'scroll_milestone': 
                    if (eventData && eventData.scroll_percent) {
                        this.behaviorMetrics.scrollDepth.push(eventData.scroll_percent);
                    }
                    break;

                case 'variant_selection':
                case 'product_impression':
                    this.behaviorMetrics.totalClicks++;
                    break;
            }
        },

        // Enviar análise final para atualizar customer_sessions
        sendAnalysis: function () {
            const analysis = this.analyzeBehavior();

            // Usar o sistema existente do InfluencerTracker
            if (window.InfluencerTracker) {
                window.InfluencerTracker.track('ai_session_analysis', {
                    session_analysis: analysis,
                    session_duration: Date.now() - this.sessionStart,
                    total_events: Object.values(this.behaviorMetrics).reduce((sum, val) =>
                        Array.isArray(val) ? sum + val.length : sum + val, 0)
                });
            }
        }
    };

    // Integrar com o InfluencerTracker existente
    if (window.InfluencerTracker) {
        const originalTrack = window.InfluencerTracker.track;

        window.InfluencerTracker.track = function (eventType, properties = {}) {
            // Atualizar métricas de IA
            AISessionAnalyzer.updateMetrics(eventType, properties);

            // Chamar função original
            originalTrack.call(this, eventType, properties);
        };

        // Adicionar método para análise manual
        window.InfluencerTracker.getAIAnalysis = function () {
            return AISessionAnalyzer.analyzeBehavior();
        };
    }

    // Enviar análise periodicamente
    setInterval(() => {
        AISessionAnalyzer.sendAnalysis();
    }, 300000); // A cada 5 minutos

    // Enviar análise final ao sair
    window.addEventListener('beforeunload', () => {
        AISessionAnalyzer.sendAnalysis();
    });

    // Expor globalmente para debug
    window.AISessionAnalyzer = AISessionAnalyzer;

    console.log('🤖 AI Session Analyzer integrated with existing customer_sessions');

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