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
            
            // 4. INICIALIZAÇÃO DE ESTADO
            this.initializeState();
            
            this.initialized = true;
            console.log('✅ Hybrid Shopify Tracker inicializado');
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
                        this.track('scroll_milestone', {
                            scroll_percent: scrollPercent,
                            scroll_depth: window.scrollY,
                            page_height: document.body.scrollHeight,
                            viewport_height: window.innerHeight,
                            timestamp: Date.now()
                        });
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
                
                this.track('click_event', {
                    click_type: clickType,
                    element_tag: element.tagName,
                    element_class: element.className,
                    element_id: element.id,
                    element_text: element.textContent?.substring(0, 100),
                    href: element.href,
                    position_x: e.clientX,
                    position_y: e.clientY,
                    timestamp: Date.now()
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
            // Dados específicos da página de produto
            const productData = this.extractProductData();
            
            if (productData) {
                this.track('product_view', {
                    ...productData,
                    timestamp: Date.now()
                });
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
            // Inicializar estado do carrinho
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
        }
    };

    // ========== EXPOR GLOBALMENTE ==========
    window.shopifyAdapter = HybridShopifyTracker;
    
    console.log('🔄 Hybrid Shopify Tracker carregado');

})(window, document);