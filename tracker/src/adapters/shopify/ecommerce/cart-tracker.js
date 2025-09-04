/*!
 * Cart Tracking Module
 */

(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.CartTracker = {
        init: function (core) {
            this.core = core;
            this.stateManager = window.ShopifyAdapterModules.StateManager;
            this.setupCartTracking();
        },

        setupCartTracking: function () {
            console.log('🛒 Configurando tracking de carrinho');
            this.setupSmartPolling();
            this.listenToShopifyEvents();
        },

        setupSmartPolling: function () {
            let pollInterval = 30000;

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

            setInterval(() => {
                const isActive = document.hasFocus() && !document.hidden;
                pollInterval = isActive ? 20000 : 60000;
                checkCartState();
            }, pollInterval);

            console.log('✅ Polling inteligente configurado');
        },

        listenToShopifyEvents: function () {
            const shopifyEvents = [
                'cart:updated', 'cart:added', 'cart:removed', 'cart:changed',
                'product:added-to-cart', 'ajaxCart:updated', 'drawer:updated'
            ];

            shopifyEvents.forEach(eventName => {
                document.addEventListener(eventName, (e) => {
                    console.log(`🛒 Evento Shopify detectado: ${eventName}`);
                    setTimeout(() => {
                        this.refreshCartState('shopify_event', eventName, e.detail);
                    }, 300);
                });
            });

            if (window.jQuery) {
                const $ = window.jQuery;
                $(document).on('cart.requestComplete', (event, cart) => {
                    console.log('🛒 Evento jQuery cart.requestComplete');
                    this.handleCartData(cart, 'jquery_event');
                });
            }
        },

        handleCartAdd: function (data, url) {
            console.log('🛒 Produto adicionado ao carrinho:', data);

            this.core.track('cart_add', {
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
        },

        handleCartUpdate: function (data, url) {
            console.log('🛒 Carrinho atualizado:', data);

            this.core.track('cart_update_action', {
                updates: data.updates || data,
                api_endpoint: url,
                timestamp: Date.now()
            });

            setTimeout(() => this.refreshCartState('cart_update'), 500);
        },

        handleCartClear: function (url) {
            console.log('🛒 Carrinho limpo');

            this.core.track('cart_clear', {
                api_endpoint: url,
                timestamp: Date.now()
            });

            setTimeout(() => this.refreshCartState('cart_clear'), 500);
        },

        handleCartData: function (data, source) {
            const currentState = {
                items: data.item_count || 0,
                total: data.total_price ? data.total_price / 100 : 0,
                currency: data.currency || 'USD',
                token: data.token
            };

            const lastState = this.stateManager.lastCartState;

            if (!lastState ||
                currentState.items !== lastState.items ||
                Math.abs(currentState.total - lastState.total) > 0.01) {

                console.log('🛒 Estado do carrinho mudou:', lastState, '→', currentState);

                const changeType = this.determineChangeType(lastState, currentState);

                this.core.track('cart_update', {
                    cart_items: currentState.items,
                    cart_value: currentState.total,
                    cart_currency: currentState.currency,
                    cart_token: currentState.token,
                    previous_items: lastState?.items || 0,
                    previous_value: lastState?.total || 0,
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

                this.stateManager.lastCartState = currentState;
            }
        },

        refreshCartState: function (trigger, eventName = null, eventDetail = null) {
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

        determineChangeType: function (previous, current) {
            if (!previous) return 'initial';
            if (current.items > previous.items) return 'add';
            if (current.items < previous.items) return 'remove';
            if (Math.abs(current.total - previous.total) > 0.01) return 'update';
            return 'unknown';
        }
    };

    console.log('🛒 Cart Tracker module loaded');

})(window);
