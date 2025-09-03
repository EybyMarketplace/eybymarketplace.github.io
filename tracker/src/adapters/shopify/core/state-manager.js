/*!
 * State Manager for Shopify Adapter
 */

(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.StateManager = {
        lastCartState: null,
        lastScrollPercent: 0,
        timeOnPage: 0,
        exitTracked: false,

        init: function (core) {
            this.core = core;
            this.initializeCartState();
            this.initializePageState();
        },

        initializeCartState: function () {
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

        initializePageState: function () {
            this.savePageVisit({
                page_type: this.detectPageType(),
                referrer: document.referrer
            });
        },

        detectPageType: function () {
            const path = window.location.pathname;

            if (path.includes('/products/')) return 'product';
            if (path.includes('/collections/')) return 'collection';
            if (path.includes('/cart')) return 'cart';
            if (path.includes('/checkout')) return 'checkout';
            if (path.includes('/thank_you') || path.includes('/orders/')) return 'thank_you';
            if (path === '/' || path === '') return 'home';

            return 'other';
        },

        savePageVisit: function (pageData) {
            try {
                const pages = this.getPagesVisited();
                pages.push({
                    url: window.location.href,
                    title: document.title,
                    timestamp: Date.now(),
                    ...pageData
                });

                sessionStorage.setItem('pages_visited', JSON.stringify(pages.slice(-50)));
            } catch (e) {
                console.log('Erro ao salvar visita de página:', e);
            }
        },

        getPagesVisited: function () {
            try {
                return JSON.parse(sessionStorage.getItem('pages_visited') || '[]');
            } catch (e) {
                return [];
            }
        }
    };

    console.log('🛒 StateManager module loaded');

})(window);
