/*!
 * Checkout Tracking Module
 */

(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.CheckoutTracker = {
        isInitialized: false,
        checkoutStartTime: null,
        checkoutSteps: [],
        currentStep: null,
        checkoutSessionData: {},
        abandonmentTracked: false,

        init: function (core) {
            this.core = core;
            this.sessionManager = core.sessionManager;
            this.dataExtractors = core.dataExtractors;
            this.setupCheckoutTracking();
            this.isInitialized = true;
        },

        setupCheckoutTracking: function () {
            console.log('💳 Configurando checkout tracking');

            if (this.isCheckoutPage()) {
                this.initCheckoutTracking();
            }

            this.monitorCheckoutNavigation();

            if (this.isThankYouPage()) {
                this.handlePurchaseCompletion();
            }

            this.checkForAbandonedCheckout();
        },

        isCheckoutPage: function () {
            return window.location.pathname.includes('/checkout') ||
                window.location.pathname.includes('/checkouts/') ||
                document.querySelector('.checkout, #checkout, [data-checkout]') ||
                document.querySelector('body.checkout, body[class*="checkout"]');
        },

        isThankYouPage: function () {
            return window.location.pathname.includes('/thank_you') ||
                window.location.pathname.includes('/orders/') ||
                document.querySelector('.order-confirmation, .thank-you, [data-order-confirmation]');
        },

        monitorCheckoutNavigation: function () {
            document.addEventListener('click', (e) => {
                const element = e.target;

                if (this.isCheckoutButton(element)) {
                    this.core.track('checkout_button_clicked', {
                        button_text: element.textContent?.trim(),
                        button_location: this.getElementLocation(element),
                        cart_value: this.getCartValue(),
                        cart_items: this.getCartItemCount(),
                        influencer_attribution: this.getInfluencerAttribution(),
                        timestamp: Date.now()
                    });
                }
            });

            let lastUrl = window.location.href;
            const urlObserver = new MutationObserver(() => {
                const currentUrl = window.location.href;
                if (currentUrl !== lastUrl) {
                    if (this.isCheckoutPage() && !lastUrl.includes('/checkout')) {
                        setTimeout(() => this.initCheckoutTracking(), 500);
                    }
                    lastUrl = currentUrl;
                }
            });

            urlObserver.observe(document, { subtree: true, childList: true });
        },

        isCheckoutButton: function (element) {
            const text = element.textContent?.toLowerCase() || '';
            const classes = element.className?.toLowerCase() || '';
            const id = element.id?.toLowerCase() || '';

            const checkoutKeywords = ['checkout', 'finalizar', 'comprar', 'buy now', 'purchase'];

            return checkoutKeywords.some(keyword =>
                text.includes(keyword) ||
                classes.includes(keyword) ||
                id.includes(keyword)
            ) || element.matches('[href*="/checkout"], [data-checkout], .checkout-btn, .btn-checkout');
        },

        initCheckoutTracking: function () {
            if (this.checkoutStartTime) return;

            console.log('💳 Inicializando tracking de checkout');

            this.checkoutStartTime = Date.now();
            this.checkoutSteps = [];
            this.currentStep = this.detectCheckoutStep();
            this.checkoutSessionData = this.initCheckoutSession();
            this.abandonmentTracked = false;

            this.core.track('checkout_started', {
                checkout_id: this.generateCheckoutId(),
                cart_value: this.getCartValue(),
                cart_items: this.getCartItemCount(),
                cart_details: this.getCartDetails(),
                influencer_attribution: this.getInfluencerAttribution(),
                customer_journey: this.getCustomerJourney(),
                entry_method: this.getCheckoutEntryMethod(),
                device_info: this.getDeviceInfo(),
                initial_step: this.currentStep,
                timestamp: Date.now()
            });

            this.sessionManager.saveCheckoutSession(this.checkoutSessionData);
            this.monitorCheckoutSteps();

            console.log('✅ Checkout tracking ativo para step:', this.currentStep);
        },

        initCheckoutSession: function () {
            return {
                checkout_id: this.generateCheckoutId(),
                start_time: Date.now(),
                steps_data: {},
                form_interactions: {},
                performance_metrics: {},
                user_behavior: {
                    scroll_events: [],
                    click_events: [],
                    focus_events: []
                }
            };
        },

        generateCheckoutId: function () {
            return 'checkout_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },

        detectCheckoutStep: function () {
            // Estratégia 1: Atributos data
            if (document.querySelector('[data-step="contact"], [data-checkout-step="contact"]')) return 'contact';
            if (document.querySelector('[data-step="shipping"], [data-checkout-step="shipping"]')) return 'shipping';
            if (document.querySelector('[data-step="payment"], [data-checkout-step="payment"]')) return 'payment';
            if (document.querySelector('[data-step="review"], [data-checkout-step="review"]')) return 'review';

            // Estratégia 2: Classes CSS
            if (document.querySelector('.step-contact, .checkout-step-contact')) return 'contact';
            if (document.querySelector('.step-shipping, .checkout-step-shipping')) return 'shipping';
            if (document.querySelector('.step-payment, .checkout-step-payment')) return 'payment';
            if (document.querySelector('.step-review, .checkout-step-review')) return 'review';

            // Estratégia 3: Conteúdo da página
            if (document.querySelector('input[name="email"], #email')) return 'contact';
            if (document.querySelector('select[name="country"], input[name="address1"]')) return 'shipping';
            if (document.querySelector('input[name="number"], [data-payment]')) return 'payment';

            // Estratégia 4: URL
            const url = window.location.href;
            if (url.includes('contact')) return 'contact';
            if (url.includes('shipping')) return 'shipping';
            if (url.includes('payment')) return 'payment';
            if (url.includes('review')) return 'review';

            return 'unknown';
        },

        monitorCheckoutSteps: function () {
            const observer = new MutationObserver(() => {
                const newStep = this.detectCheckoutStep();

                if (newStep !== this.currentStep && newStep !== 'unknown') {
                    const stepTime = Date.now() - this.checkoutStartTime;
                    const previousStep = this.currentStep;

                    console.log(`💳 Step mudou: ${previousStep} → ${newStep}`);

                    if (previousStep && previousStep !== 'unknown') {
                        this.core.track('checkout_step_completed', {
                            checkout_id: this.checkoutSessionData.checkout_id,
                            step: previousStep,
                            next_step: newStep,
                            time_on_step: stepTime,
                            step_data: this.getStepData(previousStep),
                            timestamp: Date.now()
                        });

                        this.checkoutSteps.push({
                            step: previousStep,
                            time_spent: stepTime,
                            completed: true,
                            data: this.getStepData(previousStep)
                        });
                    }

                    this.core.track('checkout_step_started', {
                        checkout_id: this.checkoutSessionData.checkout_id,
                        step: newStep,
                        previous_step: previousStep,
                        total_time_in_checkout: Date.now() - this.checkoutSessionData.start_time,
                        timestamp: Date.now()
                    });

                    this.currentStep = newStep;
                    this.checkoutStartTime = Date.now();
                    this.sessionManager.saveCheckoutSession(this.checkoutSessionData);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'data-step', 'data-checkout-step']
            });
        },

        handleCheckoutData: function (data, url) {
            console.log('💳 Dados de checkout:', data);

            this.core.track('checkout_data', {
                checkout_data: data,
                api_endpoint: url,
                timestamp: Date.now()
            });
        },

        handlePurchaseCompletion: function () {
            console.log('🎉 Purchase completed - coletando dados finais');

            const orderData = this.dataExtractors.extractOrderData();
            const checkoutSession = this.sessionManager.getCheckoutSession();

            this.core.track('purchase_completed_detailed', {
                ...orderData,
                checkout_session: checkoutSession,
                customer_journey: this.getCustomerJourney(),
                influencer_attribution: this.getInfluencerAttribution(),
                total_checkout_time: checkoutSession ? Date.now() - checkoutSession.start_time : null,
                device_info: this.getDeviceInfo(),
                timestamp: Date.now()
            });

            this.sessionManager.clearCheckoutSession();
        },

        checkForAbandonedCheckout: function () {
            try {
                const abandonmentData = JSON.parse(localStorage.getItem('checkout_abandonment') || 'null');

                if (abandonmentData) {
                    const timeSinceAbandonment = Date.now() - abandonmentData.abandonment_time;

                    if (timeSinceAbandonment < 24 * 60 * 60 * 1000) {
                        this.core.track('checkout_recovery_opportunity', {
                            original_checkout_id: abandonmentData.checkout_id,
                            time_since_abandonment: timeSinceAbandonment,
                            abandoned_step: abandonmentData.step,
                            abandoned_cart_value: abandonmentData.cart_value,
                            recovery_page: window.location.href,
                            timestamp: Date.now()
                        });

                        if (this.isCheckoutPage()) {
                            this.core.track('checkout_recovery_attempt', {
                                original_checkout_id: abandonmentData.checkout_id,
                                time_since_abandonment: timeSinceAbandonment,
                                timestamp: Date.now()
                            });

                            localStorage.removeItem('checkout_abandonment');
                        }
                    } else {
                        localStorage.removeItem('checkout_abandonment');
                    }
                }
            } catch (e) {
                console.log('Erro ao verificar checkout abandonado:', e);
            }
        },

        // Métodos auxiliares
        getStepData: function (step) {
            const data = {};

            try {
                switch (step) {
                    case 'contact':
                        data.email = this.getFieldValue('email');
                        data.phone = this.getFieldValue('phone');
                        data.newsletter_signup = this.getCheckboxValue('newsletter');
                        break;
                    case 'shipping':
                        data.shipping_method = this.getSelectedShippingMethod();
                        data.address_country = this.getFieldValue('country');
                        data.address_state = this.getFieldValue('province');
                        data.address_city = this.getFieldValue('city');
                        data.shipping_price = this.getShippingPrice();
                        break;
                    case 'payment':
                        data.payment_method = this.getSelectedPaymentMethod();
                        data.billing_same_as_shipping = this.getCheckboxValue('billing_same_as_shipping');
                        break;
                }
            } catch (e) {
                console.log('Erro ao extrair dados do step:', e);
            }

            return data;
        },

        getFieldValue: function (fieldName) {
            const selectors = [
                `input[name="${fieldName}"]`,
                `select[name="${fieldName}"]`,
                `textarea[name="${fieldName}"]`,
                `#${fieldName}`,
                `input[name*="${fieldName}"]`,
                `select[name*="${fieldName}"]`
            ];

            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    return element.value || null;
                }
            }

            return null;
        },

        getCheckboxValue: function (fieldName) {
            const element = document.querySelector(`input[name="${fieldName}"], input[name*="${fieldName}"], #${fieldName}`);
            return element ? element.checked : null;
        },

        getSelectedShippingMethod: function () {
            const selected = document.querySelector('input[name*="shipping"]:checked, select[name*="shipping"] option:checked');
            return selected ? selected.value || selected.textContent : null;
        },

        getSelectedPaymentMethod: function () {
            const selected = document.querySelector('input[name*="payment"]:checked, select[name*="payment"] option:checked');
            return selected ? selected.value || selected.textContent : null;
        },

        getShippingPrice: function () {
            const priceElement = document.querySelector('.shipping-price, [data-shipping-price], .delivery-price');
            if (priceElement) {
                const priceText = priceElement.textContent;
                const price = parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(',', '.'));
                return isNaN(price) ? null : price;
            }
            return null;
        },

        getElementLocation: function (element) {
            const rect = element.getBoundingClientRect();
            return {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
                viewport_position: {
                    x_percent: Math.round((rect.left / window.innerWidth) * 100),
                    y_percent: Math.round((rect.top / window.innerHeight) * 100)
                }
            };
        },

        getCartValue: function () {
            return this.core.stateManager.lastCartState?.total || 0;
        },

        getCartItemCount: function () {
            return this.core.stateManager.lastCartState?.items || 0;
        },

        getCartDetails: function () {
            try {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', '/cart.js', false);
                xhr.send();

                if (xhr.status === 200) {
                    const cartData = JSON.parse(xhr.responseText);
                    return {
                        items: cartData.items.map(item => ({
                            product_id: item.product_id,
                            variant_id: item.variant_id,
                            quantity: item.quantity,
                            price: item.price / 100,
                            title: item.title
                        })),
                        total_discount: cartData.total_discount / 100,
                        currency: cartData.currency
                    };
                }
            } catch (e) {
                console.log('Erro ao obter detalhes do carrinho:', e);
            }

            return null;
        },

        getCheckoutEntryMethod: function () {
            const referrer = document.referrer;

            if (referrer.includes('/cart')) return 'cart_page';
            if (referrer.includes('/products/')) return 'product_page';
            if (referrer.includes('/collections/')) return 'collection_page';
            if (referrer.includes('checkout')) return 'direct_checkout';
            if (!referrer) return 'direct_url';

            return 'unknown';
        },

        getDeviceInfo: function () {
            return {
                user_agent: navigator.userAgent,
                screen_resolution: `${screen.width}x${screen.height}`,
                viewport_size: `${window.innerWidth}x${window.innerHeight}`,
                device_pixel_ratio: window.devicePixelRatio,
                connection: navigator.connection ? {
                    effective_type: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink
                } : null,
                touch_support: 'ontouchstart' in window
            };
        },

        getInfluencerAttribution: function () {
            try {
                return JSON.parse(sessionStorage.getItem('inf_attribution') || 'null');
            } catch (e) {
                return null;
            }
        },

        getCustomerJourney: function () {
            return {
                session_start: this.core.startTime,
                pages_visited: this.core.stateManager.getPagesVisited(),
                products_viewed: this.core.productTracker.getProductsViewed(),
                time_on_site: Date.now() - this.core.startTime,
                scroll_milestones: this.core.scrollTracker.getScrollMilestones(),
                interactions: this.core.interactionTracker.getInteractionHistory()
            };
        }
    };

    console.log('💳 CheckoutTracker module loaded');

})(window);
