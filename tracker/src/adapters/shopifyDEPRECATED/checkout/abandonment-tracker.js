/*!
 * Abandonment Tracking Module
 */

(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.AbandonmentTracker = {
        init: function (core) {
            this.core = core;
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
                if (!this.core.checkouttracker.abandonmentTracked && this.core.checkouttracker.isCheckoutPage()) {
                    this.trackCheckoutAbandonment('page_unload');
                }
            });
        },

        monitorExitIntent: function () {
            document.addEventListener('mouseleave', (e) => {
                if (e.clientY <= 0 &&
                    !this.core.checkouttracker.abandonmentTracked &&
                    this.core.checkouttracker.isCheckoutPage()) {

                    this.core.track('checkout_exit_intent', {
                        checkout_id: this.core.checkouttracker.checkoutSessionData.checkout_id,
                        step: this.core.checkouttracker.currentStep,
                        time_in_checkout: Date.now() - this.core.checkouttracker.checkoutSessionData.start_time,
                        time_on_current_step: Date.now() - this.core.checkouttracker.checkoutStartTime,
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
                    if (this.core.checkouttracker.isCheckoutPage() && !this.core.checkouttracker.abandonmentTracked) {
                        this.core.track('checkout_inactivity', {
                            checkout_id: this.core.checkouttracker.checkoutSessionData.checkout_id,
                            step: this.core.checkouttracker.currentStep,
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
            if (this.core.checkouttracker.abandonmentTracked) return;
            this.core.checkouttracker.abandonmentTracked = true;

            console.log('🚪 Checkout abandonado:', reason);

            this.core.track('checkout_abandonment', {
                checkout_id: this.core.checkouttracker.checkoutSessionData.checkout_id,
                abandonment_reason: reason,
                abandonment_step: this.core.checkouttracker.currentStep,
                time_in_checkout: Date.now() - this.core.checkouttracker.checkoutSessionData.start_time,
                time_on_current_step: Date.now() - this.core.checkouttracker.checkoutStartTime,
                steps_completed: this.core.checkouttracker.checkoutSteps,
                form_completion: this.calculateFormCompletion(),
                cart_value: this.core.checkouttracker.getCartValue(),
                cart_items: this.core.checkouttracker.getCartItemCount(),
                influencer_attribution: this.core.checkouttracker.getInfluencerAttribution(),
                customer_journey: this.core.checkouttracker.getCustomerJourney(),
                device_info: this.core.checkouttracker.getDeviceInfo(),
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
                checkout_id: this.core.checkouttracker.checkoutSessionData.checkout_id,
                abandonment_time: Date.now(),
                step: this.core.checkouttracker.currentStep,
                cart_value: this.core.checkouttracker.getCartValue(),
                form_completion: this.calculateFormCompletion(),
                influencer_attribution: this.core.checkouttracker.getInfluencerAttribution()
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
