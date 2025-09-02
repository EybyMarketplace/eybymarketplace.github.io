/*!
 * Influencer Tracker - FULL Build
 * Version: 2.1.0 with AI Analytics
 * Built: 2025-09-02T17:52:49.121Z
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
    timestamp: '2025-09-02T17:52:49.122Z',
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
 * Influencer Tracker - Shopify Adapter
 * Funcionalidades específicas para Shopify
 */

(function (window, document) {
	'use strict';

	window.shopifyAdapter = {
		lastCartState: null,
		cartUpdateTimeout: null,

		init: function () {
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
		enrichEvent: function (eventType, properties) {
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
		getCartValue: function () {
			console.log('🛒 getCartValue (Shopify - API First)');

			// ESTRATÉGIA 1: API do Shopify (PRIORIDADE)
			try {
				const xhr = new XMLHttpRequest();
				xhr.open('GET', '/cart.js', false); // Síncrono para garantir valor atualizado
				xhr.send();

				if (xhr.status === 200) {
					const cartData = JSON.parse(xhr.responseText);
					const value = cartData.total_price / 100; // Shopify retorna em centavos
					console.log('   ✅ Via API /cart.js:', value);

					// Atualizar shopifyData se existir
					if (window.shopifyData && window.shopifyData.cart) {
						window.shopifyData.cart.total_price = value;
						window.shopifyData.cart.item_count = cartData.item_count;
					}

					return value;
				}
			} catch (e) {
				console.log('   ❌ Erro API:', e);
			}

			// ESTRATÉGIA 2: Shopify data (fallback)
			if (window.shopifyData?.cart?.total_price !== undefined) {
				const value = window.shopifyData.cart.total_price;
				console.log('   ⚠️ Via Shopify data (pode estar desatualizado):', value);
				return value;
			}

			console.log('   ⚠️ Fallback para 0');
			return 0;
		},

		getCartItemCount: function () {
			console.log('🛒 getCartItemCount (API First)');

			// API primeiro
			try {
				const xhr = new XMLHttpRequest();
				xhr.open('GET', '/cart.js', false);
				xhr.send();

				if (xhr.status === 200) {
					const cartData = JSON.parse(xhr.responseText);
					console.log('   ✅ Via API /cart.js:', cartData.item_count);

					// Atualizar shopifyData se existir
					if (window.shopifyData && window.shopifyData.cart) {
						window.shopifyData.cart.item_count = cartData.item_count;
					}

					return cartData.item_count;
				}
			} catch (e) {
				console.log('   ❌ Erro API:', e);
			}

			// Shopify data como fallback
			if (window.shopifyData?.cart?.item_count !== undefined) {
				return window.shopifyData.cart.item_count;
			}

			return 0;
		},

		getCartToken: function () {
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

		parseCartValue: function (text) {
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
		setupShopifyTracking: function () {
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
		},

		setupCartTracking: function () {
			const tracker = window.InfluencerTracker;
			console.log('🛒 Setup cart tracking - Fase 1');

			// ========== APENAS INTERCEPTAÇÃO AJAX ==========
			this.interceptShopifyAjax();

			// ========== EVENTOS SHOPIFY NATIVOS ==========
			const shopifyEvents = ['cart:updated', 'cart:changed', 'cart:added', 'cart:removed'];

			shopifyEvents.forEach(eventName => {
				document.addEventListener(eventName, (e) => {
					console.log(`🛒 Evento ${eventName} detectado`);
					setTimeout(() => this.checkCartChange(`shopify_${eventName}`), 300);
				});
			});

			// ========== VERIFICAÇÃO PERIÓDICA LEVE ==========
			setInterval(() => {
				this.checkCartChange('periodic_check');
			}, 30000); // A cada 30 segundos

			// ========== ESTADO INICIAL ==========
			this.lastCartState = {
				items: this.getCartItemCount(),
				value: this.getCartValue()
			};

			console.log('🛒 Estado inicial:', this.lastCartState);
			console.log('✅ Cart tracking Fase 1 ativo');
		},

		// Adicione este método
		interceptShopifyAjax: function () {
			const self = this;

			// Interceptar fetch
			const originalFetch = window.fetch;
			window.fetch = async function (...args) {
				const [url, options] = args;
				const response = await originalFetch.apply(this, args);

				if (typeof url === 'string' && url.includes('/cart')) {
					console.log('🛒 Fetch detectado:', url);
					setTimeout(() => self.checkCartChange('ajax_fetch'), 500);
				}

				return response;
			};

			// Interceptar XMLHttpRequest
			const originalOpen = XMLHttpRequest.prototype.open;
			XMLHttpRequest.prototype.open = function (method, url, ...rest) {
				if (url.includes('/cart')) {
					console.log('🛒 XHR detectado:', url);

					this.addEventListener('load', function () {
						if (this.status >= 200 && this.status < 300) {
							setTimeout(() => self.checkCartChange('ajax_xhr'), 500);
						}
					});
				}

				return originalOpen.apply(this, [method, url, ...rest]);
			};

			console.log('✅ AJAX interception ativo');
		},

		setupProductTracking: function () {
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

		setupCheckoutTracking: function () {
			const tracker = window.InfluencerTracker;

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

		setupCheckoutStepTracking: function () {
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
		checkCartChange: function (trigger) {
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

		getCheckoutStep: function () {
			if (document.querySelector('.step-contact, [data-step="contact"]')) return 'contact';
			if (document.querySelector('.step-shipping, [data-step="shipping"]')) return 'shipping';
			if (document.querySelector('.step-payment, [data-step="payment"]')) return 'payment';
			if (document.querySelector('.step-review, [data-step="review"]')) return 'review';
			return 'unknown';
		},

		getElementPosition: function (element) {
			const rect = element.getBoundingClientRect();
			return {
				x: rect.left,
				y: rect.top,
				width: rect.width,
				height: rect.height
			};
		},

		trackPurchaseCompletion: function () {
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

		extractOrderData: function () {
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