/*!
 * Shopify Adapter - Main Entry Point
 */

(function(window, document) {
    'use strict';

    const ShopifyAdapter = {
        initialized: false,
        
        init: function() {
            if (this.initialized) {
                console.log('⚠️ Shopify Adapter já foi inicializado');
                return this;
            }

            console.log('�� Inicializando Shopify Adapter');

            if (!window.ShopifyAdapterModules) {
                console.error('❌ ShopifyAdapterModules namespace não encontrado');
                return this;
            }

            const modules = window.ShopifyAdapterModules;

            if (!modules.AdapterCore) {
                console.error('❌ AdapterCore não encontrado');
                return this;
            }

            try {
                // Add module references to AdapterCore
                Object.entries(modules).forEach(([name, module]) => {
                    if (name !== 'AdapterCore') {
                        modules.AdapterCore[name.toLowerCase()] = module;
                    }
                });

                // Initialize
                modules.AdapterCore.init({
                    stateManager: modules.StateManager,
                    cartTracker: modules.CartTracker,
                    productTracker: modules.ProductTracker,
                    apiInterceptor: modules.APIInterceptor,
                    interactionTracker: modules.InteractionTracker,
                    checkoutTracker: modules.CheckoutTracker,
                    formMonitor: modules.FormMonitor,
                    abandonmentTracker: modules.AbandonmentTracker,
                    dataExtractors: modules.DataExtractors,
                    helpers: modules.Helpers,
                    sessionManager: modules.SessionManager
                });

                this.initialized = true;
                console.log('✅ Shopify Adapter inicializado');
                
            } catch (error) {
                console.error('❌ Erro ao inicializar:', error);
            }

            return this;
        },

        // Direct access to core
        getCore: function() {
            return window.ShopifyAdapterModules?.AdapterCore || null;
        }
    };

    // Expose globally
    window.shopifyAdapter = ShopifyAdapter;
    
    // Auto-initialize
    function autoInit() {
        if (!window.ShopifyAdapterModules) {
            setTimeout(autoInit, 100);
            return;
        }
        ShopifyAdapter.init();
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }
    
    console.log('🔄 Shopify Adapter carregado');

})(window, document);