/*!
 * Interaction Tracking Module
 */
(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.InteractionTracker = {
        init: function (core) {
            this.core = core;
            this.setupInteractionTracking();
        },

        setupInteractionTracking: function () {
            console.log('👆 Configurando tracking de interações');
            this.trackClickBehavior();
            this.trackFormInteractions();
            this.trackPageVisibility();
        },

        trackClickBehavior: function () {
            document.addEventListener('click', window.InfluencerTracker.Utils.throttle((e) => {
                const element = e.target;

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

                this.core.track('click_event', clickData);
                this.saveInteraction({
                    type: 'click',
                    ...clickData
                });
            }, 500));
        },

        trackFormInteractions: function () {
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

                this.core.track('form_submit', {
                    form_type: formType,
                    form_action: form.action,
                    form_method: form.method,
                    fields_count: form.elements.length,
                    timestamp: Date.now()
                });
            });
        },

        trackPageVisibility: function () {
            document.addEventListener('visibilitychange', () => {
                this.core.track('page_visibility_change', {
                    is_visible: !document.hidden,
                    time_on_page: Date.now() - this.core.startTime,
                    timestamp: Date.now()
                });
            });
        },

        saveInteraction: function (interactionData) {
            try {
                const interactions = this.getInteractionHistory();
                interactions.push({
                    timestamp: Date.now(),
                    page: window.location.href,
                    ...interactionData
                });

                sessionStorage.setItem('interaction_history', JSON.stringify(interactions.slice(-200)));
            } catch (e) {
                console.log('Erro ao salvar interação:', e);
            }
        },

        getInteractionHistory: function () {
            try {
                return JSON.parse(sessionStorage.getItem('interaction_history') || '[]');
            } catch (e) {
                return [];
            }
        }
    };

    console.log('🔒 InteractionTracker module loaded');

})(window);