/*!
 * API Interceptor Module
 */

(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.APIInterceptor = {
        init: function (core) {
            this.core = core;
            this.cartTracker = window.ShopifyAdapterModules.CartTracker;
            this.productTracker = window.ShopifyAdapterModules.ProductTracker;
            this.checkoutTracker = window.ShopifyAdapterModules.CheckoutTracker;
            this.interceptAPIs();
        },

        interceptAPIs: function () {
            console.log('🔌 Configurando interceptação de APIs');
            this.interceptFetch();
            this.interceptXHR();
        },

        interceptFetch: function () {
            const self = this;
            const originalFetch = window.fetch;

            window.fetch = async function (...args) {
                const response = await originalFetch.apply(this, args);

                if (response.ok) {
                    const url = typeof args[0] === 'string' ? args[0] : args[0].url;

                    try {
                        if (url.includes('/cart')) {
                            const clonedResponse = response.clone();

                            if (url.includes('/cart/add')) {
                                const data = await clonedResponse.json();
                                self.cartTracker.handleCartAdd(data, url);
                            } else if (url.includes('/cart/update') || url.includes('/cart/change')) {
                                const data = await clonedResponse.json();
                                self.cartTracker.handleCartUpdate(data, url);
                            } else if (url.includes('/cart/clear')) {
                                self.cartTracker.handleCartClear(url);
                            } else if (url.includes('/cart.js') || url.endsWith('/cart')) {
                                const data = await clonedResponse.json();
                                self.cartTracker.handleCartData(data, url);
                            }
                        }

                        if (url.includes('/products/') && url.includes('.js')) {
                            const data = await clonedResponse.json();
                            self.productTracker.handleProductData(data, url);
                        }

                        if (url.includes('/checkout') || url.includes('/orders')) {
                            const contentType = response.headers.get('content-type');
                            if (contentType && contentType.includes('application/json')) {
                                const data = await clonedResponse.json();
                                self.checkoutTracker.handleCheckoutData(data, url);
                            }
                        }

                    } catch (e) {
                        console.log('🔄 Erro ao processar resposta:', e);
                    }
                }

                return response;
            };
        },

        interceptXHR: function () {
            const self = this;
            const originalOpen = XMLHttpRequest.prototype.open;

            XMLHttpRequest.prototype.open = function (method, url, ...rest) {
                if (url.includes('/cart')) {
                    this.addEventListener('load', function () {
                        if (this.status >= 200 && this.status < 300) {
                            try {
                                const data = JSON.parse(this.responseText);

                                if (url.includes('/cart/add')) {
                                    self.cartTracker.handleCartAdd(data, url);
                                } else if (url.includes('/cart/update') || url.includes('/cart/change')) {
                                    self.cartTracker.handleCartUpdate(data, url);
                                } else if (url.includes('/cart.js')) {
                                    self.cartTracker.handleCartData(data, url);
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
        }
    };

    console.log('🔌 API Interceptor module loaded');

})(window);
