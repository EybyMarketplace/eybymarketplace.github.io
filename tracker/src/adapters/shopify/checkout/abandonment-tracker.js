/*!
 * Abandonment Tracking Module
 */

(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.AbandonmentTracker = {
        init: function (core) {
            this.core = core;
            this.checkoutTracker = core.checkoutTracker;
            this.sessionManager = core.sessionManager;
            this.setupAbandonmentTracking();
        },

        setupAbandonmentTracking: function () {
            console.log('🚪 Configurando tracking de abandono');
            this.monitorPageUnload();
            this.monitorExitIntent();
            this.monitorInactivity();
        },

        monitorPageUnload: function () {
            window.addEventListener('beforeunload', (e) => {
                if (!this.checkoutTracker.abandonmentTracked && this.checkoutTracker.isCheckoutPage()) {
                    this.trackCheckoutAbandonment('page_unload');
                }
            });
        },

        monitorExitIntent: function () {
            document.addEventListener('mouseleave', (e) => {
                if (e.clientY <= 0 &&
                    !this.checkoutTracker.abandonmentTracked &&
                    this.checkoutTracker.isCheckoutPage()) {

                    this.core.track('checkout_exit_intent', {
                        checkout_id: this.checkoutTracker.checkoutSessionData.checkout_id,
                        step: this.checkoutTracker.currentStep,
                        time_in_checkout: Date.now() - this.checkoutTracker.checkoutSessionData.start_time,
                        time_on_current_step: Date.now() - this.checkoutTracker.checkoutStartTime,
                        form_completion: this.calculateFormCompletion(),
                        timestamp: Date.now()
                    });
                }
            });
        },

        monitorInactivity: function () {
            let inactivityTimer;

            const resetInactivityTimer = () => {
                clearTimeout(inactivityTimer);
                inactivityTimer = setTimeout(() => {
                    if (this.checkoutTracker.isCheckoutPage() && !this.checkoutTracker.abandonmentTracked) {
                        this.core.track('checkout_inactivity', {
                            checkout_id: this.checkoutTracker.checkoutSessionData.checkout_id,
                            step: this.checkoutTracker.currentStep,
                            inactivity_duration: 300000,
                            timestamp: Date.now()
                        });
                    }
                }, 300000); // 5 minutos
            };

            ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
                document.addEventListener(event, resetInactivityTimer, { passive: true });
            });

            resetInactivityTimer();
        },

        trackCheckoutAbandonment: function (reason) {
            if (this.checkoutTracker.abandonmentTracked) return;
            this.checkoutTracker.abandonmentTracked = true;

            console.log('🚪 Checkout abandonado:', reason);

            this.core.track('checkout_abandonment', {
                checkout_id: this.checkoutTracker.checkoutSessionData.checkout_id,
                abandonment_reason: reason,
                abandonment_step: this.checkoutTracker.currentStep,
                time_in_checkout: Date.now() - this.checkoutTracker.checkoutSessionData.start_time,
                time_on_current_step: Date.now() - this.checkoutTracker.checkoutStartTime,
                steps_completed: this.checkoutTracker.checkoutSteps,
                form_completion: this.calculateFormCompletion(),
                cart_value: this.checkoutTracker.getCartValue(),
                cart_items: this.checkoutTracker.getCartItemCount(),
                influencer_attribution: this.checkoutTracker.getInfluencerAttribution(),
                customer_journey: this.checkoutTracker.getCustomerJourney(),
                device_info: this.checkoutTracker.getDeviceInfo(),
                timestamp: Date.now()
            });

            this.saveAbandonmentData();
        },

        calculateFormCompletion: function () {
            const allFields = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
            const filledFields = Array.from(allFields).filter(field => field.value && field.value.trim() !== '');

            return allFields.length > 0 ? Math.round((filledFields.length / allFields.length) * 100) : 0;
        },

        saveAbandonmentData: function () {
            const abandonmentData = {
                checkout_id: this.checkoutTracker.checkoutSessionData.checkout_id,
                abandonment_time: Date.now(),
                step: this.checkoutTracker.currentStep,
                cart_value: this.checkoutTracker.getCartValue(),
                form_completion: this.calculateFormCompletion(),
                influencer_attribution: this.checkoutTracker.getInfluencerAttribution()
            };

            try {
                localStorage.setItem('checkout_abandonment', JSON.stringify(abandonmentData));
            } catch (e) {
                console.log('Erro ao salvar dados de abandono:', e);
            }
        }
    };

    console.log('🚪 AbandonmentTracker module loaded');

})(window);
