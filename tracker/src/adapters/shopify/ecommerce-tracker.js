import TrackerClient from '../../core/tracker-client';
import PageDataExtractor from './page-data-extractor';

/**
 * @fileoverview Manages universal e-commerce tracking for Shopify.
 */

class EcommerceTracker {
    constructor() {
        this.lastCartState = null;
        this.setupUniversalEcommerce();
    }

    /**
     * Configures universal e-commerce tracking.
     */
    setupUniversalEcommerce() {
        console.log('🛒 Configurando tracking de ecommerce universal');

        this.interceptShopifyAPIs();
        this.listenToShopifyEvents();
        this.setupSmartPolling();
    }

    /**
     * Intercepts Fetch and XMLHttpRequest to capture Shopify API calls for cart and product data.
     */
    interceptShopifyAPIs() {
        const self = this;

        // Intercept Fetch API
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

                    // Checkout APIs (handled more deeply in CheckoutTracker, but basic data capture here)
                    if (url.includes('/checkout') || url.includes('/orders')) {
                        const contentType = response.headers.get('content-type');
                        if (contentType && contentType.includes('application/json')) {
                            const data = await clonedResponse.json();
                            self.handleCheckoutData(data, url);
                        }
                    }
                } catch (e) {
                    console.warn('🔄 Erro ao processar resposta da API:', e);
                }
            }
            return response;
        };

        // Intercept XMLHttpRequest
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
                            // Not valid JSON, ignore
                        }
                    }
                });
            }
            return originalOpen.apply(this, [method, url, ...rest]);
        };

        console.log('✅ Interceptação de APIs configurada');
    }

    /**
     * Listens to native Shopify and jQuery cart events.
     */
    listenToShopifyEvents() {
        const shopifyEvents = [
            'cart:updated', 'cart:added', 'cart:removed', 'cart:changed',
            'product:added-to-cart', 'ajaxCart:updated', 'drawer:updated'
        ];

        shopifyEvents.forEach(eventName => {
            document.addEventListener(eventName, (e) => {
                console.log(`🛒 Evento Shopify detectado: ${eventName}`);
                // Small delay to ensure cart state is updated
                setTimeout(() => {
                    this.refreshCartState('shopify_event', eventName, e.detail);
                }, 300);
            });
        });

        if (window.jQuery) {
            window.jQuery(document).on('cart.requestComplete', (event, cart) => {
                console.log('🛒 Evento jQuery cart.requestComplete');
                this.handleCartData(cart, 'jquery_event');
            });
        }
    }

    /**
     * Sets up intelligent polling for cart state as a fallback.
     */
    setupSmartPolling() {
        let pollInterval = 30000; // Initial 30 seconds

        const checkCartState = async () => {
            try {
                const response = await fetch('/cart.js');
                if (response.ok) {
                    const cartData = await response.json();
                    this.handleCartData(cartData, 'polling');
                }
            } catch (e) {
                console.warn('🔄 Erro no polling:', e);
            }
        };

        setInterval(() => {
            const isActive = document.hasFocus() && !document.hidden;
            pollInterval = isActive ? 20000 : 60000; // More frequent if active
            checkCartState();
        }, pollInterval);

        console.log('✅ Polling inteligente configurado');
    }

    /**
     * Handles 'cart/add' API response.
     * @param {object} data - The cart add response data.
     * @param {string} url - The URL of the API request.
     */
    handleCartAdd(data, url) {
        console.log('🛒 Produto adicionado ao carrinho:', data);

        TrackerClient.track('cart_add', {
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

        setTimeout(() => this.refreshCartState('cart_add'), 500);
    }

    /**
     * Handles 'cart/update' or 'cart/change' API response.
     * @param {object} data - The cart update response data.
     * @param {string} url - The URL of the API request.
     */
    handleCartUpdate(data, url) {
        console.log('🛒 Carrinho atualizado (ação direta):', data);

        TrackerClient.track('cart_update_action', {
            updates: data.updates || data,
            api_endpoint: url,
            timestamp: Date.now()
        });

        setTimeout(() => this.refreshCartState('cart_update'), 500);
    }

    /**
     * Handles 'cart/clear' API response.
     * @param {string} url - The URL of the API request.
     */
    handleCartClear(url) {
        console.log('🛒 Carrinho limpo');

        TrackerClient.track('cart_clear', {
            api_endpoint: url,
            timestamp: Date.now()
        });

        setTimeout(() => this.refreshCartState('cart_clear'), 500);
    }

    /**
     * Processes cart data to detect changes and track cart updates.
     * @param {object} data - The current cart data.
     * @param {string} source - The source of the cart data (e.g., 'polling', 'shopify_event', 'api').
     */
    handleCartData(data, source) {
        const currentState = {
            items: data.item_count || 0,
            total: data.total_price ? data.total_price / 100 : 0,
            currency: data.currency || 'USD',
            token: data.token
        };

        if (!this.lastCartState ||
            currentState.items !== this.lastCartState.items ||
            Math.abs(currentState.total - this.lastCartState.total) > 0.01) {

            console.log('🛒 Estado do carrinho mudou:', this.lastCartState, '→', currentState);

            const changeType = this.determineChangeType(this.lastCartState, currentState);

            TrackerClient.track('cart_update', {
                cart_items: currentState.items,
                cart_value: currentState.total,
                cart_currency: currentState.currency,
                cart_token: currentState.token,

                previous_items: this.lastCartState?.items || 0,
                previous_value: this.lastCartState?.total || 0,
                change_type: changeType,
                change_trigger: source,

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

                total_discount: data.total_discount ? data.total_discount / 100 : 0,
                discounts: data.cart_level_discount_applications || [],

                cart_note: data.note,
                cart_attributes: data.attributes || {},

                timestamp: Date.now()
            });

            this.lastCartState = currentState;
        }
    }

    /**
     * Handles product data loaded from API calls (e.g., /products/handle.js).
     * @param {object} data - The product data.
     * @param {string} url - The URL of the API request.
     */
    handleProductData(data, url) {
        console.log('📦 Dados de produto carregados:', data);

        TrackerClient.track('product_data_loaded', {
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
    }

    /**
     * Handles general checkout data loaded from API calls.
     * @param {object} data - The checkout data.
     * @param {string} url - The URL of the API request.
     */
    handleCheckoutData(data, url) {
        console.log('💳 Dados de checkout (API):', data);
        TrackerClient.track('checkout_data', {
            checkout_data: data,
            api_endpoint: url,
            timestamp: Date.now()
        });
    }

    /**
     * Refreshes the cart state by fetching the latest /cart.js data.
     * @param {string} trigger - The event or action that triggered the refresh.
     */
    async refreshCartState(trigger) {
        try {
            const response = await fetch('/cart.js');
            if (response.ok) {
                const cartData = await response.json();
                this.handleCartData(cartData, trigger);
            }
        } catch (e) {
            console.error('🔄 Erro ao atualizar estado do carrinho:', e);
        }
    }

    /**
     * Determines the type of change in cart state (add, remove, update, initial).
     * @param {object|null} previous - The previous cart state.
     * @param {object} current - The current cart state.
     * @returns {string} The type of change.
     */
    determineChangeType(previous, current) {
        if (!previous) return 'initial';
        if (current.items > previous.items) return 'add';
        if (current.items < previous.items) return 'remove';
        if (Math.abs(current.total - previous.total) > 0.01) return 'update';
        return 'unknown';
    }

    /**
     * Initializes the cart state by fetching current cart data.
     */
    async initializeCartState() {
        try {
            const response = await fetch('/cart.js');
            if (response.ok) {
                const cartData = await response.json();
                this.lastCartState = {
                    items: cartData.item_count || 0,
                    total: cartData.total_price ? cartData.total_price / 100 : 0,
                    currency: cartData.currency || 'USD',
                    token: cartData.token
                };
                console.log('🛒 Estado inicial do carrinho:', this.lastCartState);
            }
        } catch (e) {
            console.warn('⚠️ Erro ao carregar estado inicial do carrinho:', e);
            this.lastCartState = { items: 0, total: 0, currency: 'USD', token: null };
        }
    }
}

export default EcommerceTracker;