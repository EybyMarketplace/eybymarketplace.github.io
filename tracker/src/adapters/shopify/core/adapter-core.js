/*!
 * Shopify Adapter Core
 */

(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.AdapterCore = {
        initialized: false,
        startTime: Date.now(),

        init: function (modules = {}) {
            if (this.initialized) return;

            console.log('🔄 Inicializando Shopify Adapter Core');

            // Initialize all provided modules
            Object.entries(modules).forEach(([name, module]) => {
                if (module && typeof module.init === 'function') {
                    try {
                        module.init(this);
                        console.log(`✅ Módulo ${name} inicializado`);
                    } catch (error) {
                        console.error(`❌ Erro ao inicializar módulo ${name}:`, error);
                    }
                }
            });

            console.log('🔄 AdapterCore: ', this);

            this.initialized = true;
            console.log('✅ Shopify Adapter Core inicializado');
        },

        track: function (eventType, properties = {}) {
            // Use the main tracker
            if (window.CommerceTracker && window.CommerceTracker.track) {
                window.CommerceTracker.track(eventType, properties);
            } else {
                console.log('📊 Evento rastreado:', eventType, properties);
            }
        }
    };

    console.log('🔄 Shopify Adapter Core loaded');

})(window);