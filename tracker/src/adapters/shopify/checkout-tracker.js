import TrackerClient from '../../core/tracker-client';
import PageDataExtractor from './page-data-extractor';
import SessionManager from '../session/SessionManager';
import Utils from '../../utils/Utils';

/**
 * @fileoverview Implements advanced tracking for the Shopify checkout process.
 */

class CheckoutTracker {
    constructor(startTime) {
        this.startTime = startTime; // Session start time from main tracker
        this.checkoutStartTime = null; // Start time of the current checkout session
        this.checkoutSteps = []; // History of completed steps
        this.currentStep = null; // Current step of the checkout
        this.checkoutSessionData = {}; // Data for the current checkout session
        this.formInteractions = {}; // Detailed data on form field interactions per step
        this.abandonmentTracked = false; // Flag to prevent duplicate abandonment events

        this.throttledTrackInput = Utils.throttle(this._trackFieldInput, 1000).bind(this);
        this.setupAdvancedCheckoutTracking();
    }

    /**
     * Initializes advanced checkout tracking.
     */
    setupAdvancedCheckoutTracking() {
        console.log('💳 Configurando checkout tracking avançado');

        // Check immediately if we are on a checkout or thank you page on load
        if (this.isCheckoutPage()) {
            this.initCheckoutTracking();
        } else if (this.isThankYouPage()) {
            this.handlePurchaseCompletion();
        }

        this.monitorCheckoutNavigation();
        this.checkForAbandonedCheckoutRecovery();
    }

    /**
     * Determines if the current page is a Shopify checkout page.
     * @returns {boolean} True if it's a checkout page.
     */
    isCheckoutPage() {
        return window.location.pathname.includes('/checkout') ||
            window.location.pathname.includes('/checkouts/') ||
            document.querySelector('.checkout, #checkout, [data-checkout-container]') || // More robust selectors
            document.querySelector('body.checkout, body[class*="checkout"]');
    }

    /**
     * Determines if the current page is a Shopify thank you (order confirmation) page.
     * @returns {boolean} True if it's a thank you page.
     */
    isThankYouPage() {
        return window.location.pathname.includes('/thank_you') ||
            window.location.pathname.includes('/orders/') ||
            document.querySelector('.order-confirmation, .thank-you, [data-order-confirmation-info]');
    }

    /**
     * Monitors navigation to detect entry into the checkout process.
     */
    monitorCheckoutNavigation() {
        // Monitor clicks on buttons that lead to checkout
        document.addEventListener('click', (e) => {
            const element = e.target.closest('a, button'); // Check the element itself or its closest ancestor that is a link or button
            if (element && this.isCheckoutButton(element)) {
                TrackerClient.track('checkout_button_clicked', {
                    button_text: element.textContent?.trim(),
                    button_location: PageDataExtractor.getElementLocation(element),
                    cart_value: PageDataExtractor.getCartValue(),
                    cart_items: PageDataExtractor.getCartItemCount(),
                    influencer_attribution: PageDataExtractor.getInfluencerAttribution(),
                    timestamp: Date.now()
                });
            }
        });

        // Monitor URL changes to detect entry into checkout dynamically (SPA-like navigation)
        let lastUrl = window.location.href;
        const urlObserver = new MutationObserver(() => {
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                if (this.isCheckoutPage() && !lastUrl.includes('/checkout')) {
                    // Entered checkout from a non-checkout page
                    setTimeout(() => this.initCheckoutTracking(), 500);
                } else if (!this.isCheckoutPage() && lastUrl.includes('/checkout')) {
                    // Exited checkout without completing (abandonment or back button)
                    if (!this.abandonmentTracked && !this.isThankYouPage()) {
                        this.trackCheckoutAbandonment('checkout_exit');
                    }
                }
                lastUrl = currentUrl;
            }
        });
        // Observe body for URL changes that might not trigger a full page reload
        urlObserver.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Checks if a given HTML element is likely a checkout button.
     * @param {HTMLElement} element - The element to check.
     * @returns {boolean} True if the element is a checkout button.
     */
    isCheckoutButton(element) {
        const text = element.textContent?.toLowerCase() || '';
        const classes = element.className?.toLowerCase() || '';
        const id = element.id?.toLowerCase() || '';

        const checkoutKeywords = ['checkout', 'finalizar', 'comprar agora', 'buy now', 'purchase', 'pagar', 'continue'];

        return checkoutKeywords.some(keyword =>
            text.includes(keyword) ||
            classes.includes(keyword) ||
            id.includes(keyword)
        ) || element.matches('[href*="/checkout"], [data-checkout], .checkout-btn, .btn-checkout, .button--checkout');
    }

    /**
     * Initializes the checkout tracking session.
     * Prevents re-initialization if already active.
     */
    initCheckoutTracking() {
        if (this.checkoutStartTime) {
            console.log('💳 Checkout tracking já inicializado.');
            return;
        }

        console.log('💳 Inicializando tracking de checkout');

        this.checkoutStartTime = Date.now();
        this.checkoutSteps = [];
        this.currentStep = this.detectCheckoutStep();
        this.checkoutSessionData = this._createCheckoutSessionData();
        this.abandonmentTracked = false;

        TrackerClient.track('checkout_started', {
            checkout_id: this.checkoutSessionData.checkout_id,
            cart_value: PageDataExtractor.getCartValue(),
            cart_items: PageDataExtractor.getCartItemCount(),
            cart_details: PageDataExtractor.getCartDetails(),
            influencer_attribution: PageDataExtractor.getInfluencerAttribution(),
            customer_journey: SessionManager.getCustomerJourney(this.startTime),
            entry_method: this.getCheckoutEntryMethod(),
            device_info: PageDataExtractor.getDeviceInfo(),
            initial_step: this.currentStep,
            timestamp: Date.now()
        });

        SessionManager.saveCheckoutSession(this.checkoutSessionData);

        this.monitorCheckoutSteps();
        this.monitorCheckoutForms();
        this.monitorCheckoutAbandonment();
        this.monitorCheckoutPerformance();

        console.log('✅ Checkout tracking ativo para step:', this.currentStep);
    }

    /**
     * Creates the initial checkout session data object.
     * @returns {object} The new checkout session data.
     */
    _createCheckoutSessionData() {
        return {
            checkout_id: `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            start_time: Date.now(),
            steps_data: {}, // Data collected for each step
            form_interactions: {}, // Form interaction details
            performance_metrics: {}, // Performance data
            user_behavior: { // Aggregated behavior within checkout
                scroll_events: [],
                click_events: [],
                focus_events: []
            }
        };
    }

    /**
     * Detects the current checkout step using various strategies (data attributes, CSS classes, URL, DOM content).
     * @returns {string} The detected checkout step (e.g., 'contact', 'shipping', 'payment', 'review', 'unknown').
     */
    detectCheckoutStep() {
        // Strategy 1: Specific data attributes (most reliable)
        if (document.querySelector('[data-step="contact"], [data-checkout-step="contact"]')) return 'contact';
        if (document.querySelector('[data-step="shipping"], [data-checkout-step="shipping"]')) return 'shipping';
        if (document.querySelector('[data-step="payment"], [data-checkout-step="payment"]')) return 'payment';
        if (document.querySelector('[data-step="review"], [data-checkout-step="review"]')) return 'review';
        if (document.querySelector('[data-step="processing"]')) return 'processing'; // For payment processing screens

        // Strategy 2: Common CSS classes
        if (document.querySelector('.step-contact, .checkout-step-contact, .section--contact-information')) return 'contact';
        if (document.querySelector('.step-shipping, .checkout-step-shipping, .section--shipping-method')) return 'shipping';
        if (document.querySelector('.step-payment, .checkout-step-payment, .section--payment-method')) return 'payment';
        if (document.querySelector('.step-review, .checkout-step-review')) return 'review';

        // Strategy 3: URL path segments
        const url = window.location.href;
        if (url.includes('/contact_information') || url.includes('/information')) return 'contact';
        if (url.includes('/shipping_method') || url.includes('/shipping')) return 'shipping';
        if (url.includes('/payment_method') || url.includes('/payment')) return 'payment';
        if (url.includes('/review_order') || url.includes('/review')) return 'review';

        // Strategy 4: Form fields specific to a step
        if (document.querySelector('input[name="checkout[email]"], #checkout_email')) return 'contact';
        if (document.querySelector('select[name="checkout[shipping_address][country]"], #checkout_shipping_address_address1')) return 'shipping';
        if (document.querySelector('input[name="checkout[payment_gateway]"], [data-payment-methods]')) return 'payment';

        // Strategy 5: Breadcrumbs or navigation elements
        const activeStepEl = document.querySelector('.breadcrumb .active, .checkout-nav .active, .step.active, .main__header__step');
        if (activeStepEl) {
            const text = activeStepEl.textContent?.toLowerCase() || '';
            if (text.includes('contact') || text.includes('information')) return 'contact';
            if (text.includes('shipping') || text.includes('delivery')) return 'shipping';
            if (text.includes('payment') || text.includes('billing')) return 'payment';
            if (text.includes('review') || text.includes('confirm')) return 'review';
        }

        return 'unknown';
    }

    /**
     * Monitors changes in checkout steps using a MutationObserver.
     */
    monitorCheckoutSteps() {
        const observer = new MutationObserver(() => {
            const newStep = this.detectCheckoutStep();

            if (newStep && newStep !== this.currentStep && newStep !== 'unknown') {
                const stepDuration = Date.now() - this.checkoutStartTime;
                const previousStep = this.currentStep;

                console.log(`💳 Step changed: ${previousStep} → ${newStep}`);

                // Track completion of the previous step
                if (previousStep && previousStep !== 'unknown') {
                    const stepData = this.getStepData(previousStep);
                    this.checkoutSessionData.steps_data[previousStep] = stepData; // Store collected data for the step

                    TrackerClient.track('checkout_step_completed', {
                        checkout_id: this.checkoutSessionData.checkout_id,
                        step: previousStep,
                        next_step: newStep,
                        time_on_step: stepDuration,
                        step_data: stepData,
                        form_interactions: this.formInteractions[previousStep] || {},
                        step_performance: this.getStepPerformance(previousStep),
                        timestamp: Date.now()
                    });

                    this.checkoutSteps.push({
                        step: previousStep,
                        time_spent: stepDuration,
                        completed: true,
                        data: stepData
                    });
                }

                // Track start of the new step
                TrackerClient.track('checkout_step_started', {
                    checkout_id: this.checkoutSessionData.checkout_id,
                    step: newStep,
                    previous_step: previousStep,
                    total_time_in_checkout: Date.now() - this.checkoutSessionData.start_time,
                    timestamp: Date.now()
                });

                this.currentStep = newStep;
                this.checkoutStartTime = Date.now(); // Reset timer for the new step

                // Reset form interactions for the new step
                this.formInteractions[newStep] = {};

                SessionManager.saveCheckoutSession(this.checkoutSessionData); // Save progress
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'data-step', 'data-checkout-step', 'id'] // Listen for relevant attribute changes
        });
    }

    /**
     * Monitors form field interactions (focus, blur, input, change, error) within the checkout.
     */
    monitorCheckoutForms() {
        console.log('📝 Monitorando interações com formulários');

        // Monitor existing form elements
        const formElements = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
        formElements.forEach(element => this._setupFieldMonitoring(element));

        // Monitor dynamically added form elements (e.g., during step transitions)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const newFields = node.querySelectorAll('input:not([type="hidden"]), select, textarea');
                        newFields.forEach(field => this._setupFieldMonitoring(field));
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Sets up monitoring for a single form field.
     * @param {HTMLElement} element - The form input, select, or textarea element.
     * @private
     */
    _setupFieldMonitoring(element) {
        if (element.dataset.trackerMonitored) return; // Prevent duplicate monitoring
        element.dataset.trackerMonitored = 'true';

        const fieldName = element.name || element.id || element.placeholder || 'unknown_field';
        const fieldType = element.type || element.tagName.toLowerCase();

        // Initialize interaction data for this field and current step
        if (!this.formInteractions[this.currentStep]) {
            this.formInteractions[this.currentStep] = {};
        }
        if (!this.formInteractions[this.currentStep][fieldName]) {
            this.formInteractions[this.currentStep][fieldName] = {
                field_name: fieldName,
                field_type: fieldType,
                focus_count: 0,
                input_count: 0,
                total_focus_time: 0,
                value_changes: 0,
                focus_start: null,
                initial_value: element.value,
                error_count: 0,
                last_error: null
            };
        }
        const interactionData = this.formInteractions[this.currentStep][fieldName];

        // Focus events
        element.addEventListener('focus', () => {
            interactionData.focus_count++;
            interactionData.focus_start = Date.now();

            TrackerClient.track('checkout_field_focus', {
                checkout_id: this.checkoutSessionData.checkout_id,
                step: this.currentStep,
                field_name: fieldName,
                field_type: fieldType,
                focus_count: interactionData.focus_count,
                timestamp: Date.now()
            });
        });

        // Blur events
        element.addEventListener('blur', () => {
            if (interactionData.focus_start) {
                const focusTime = Date.now() - interactionData.focus_start;
                interactionData.total_focus_time += focusTime;
                interactionData.focus_start = null;

                TrackerClient.track('checkout_field_blur', {
                    checkout_id: this.checkoutSessionData.checkout_id,
                    step: this.currentStep,
                    field_name: fieldName,
                    field_type: fieldType,
                    focus_time: focusTime,
                    total_focus_time: interactionData.total_focus_time,
                    has_value: !!element.value,
                    value_length: element.value?.length || 0,
                    timestamp: Date.now()
                });
            }
        });

        // Input events (for text/number inputs)
        element.addEventListener('input', () => {
            interactionData.input_count++;
            if (element.value !== interactionData.initial_value) {
                interactionData.value_changes++;
            }
            // Use throttled tracking for input events to avoid spamming
            this.throttledTrackInput(element, interactionData);
        });

        // Change events (useful for select/checkbox/radio, also for inputs on blur)
        element.addEventListener('change', () => {
            TrackerClient.track('checkout_field_change', {
                checkout_id: this.checkoutSessionData.checkout_id,
                step: this.currentStep,
                field_name: fieldName,
                field_type: fieldType,
                new_value: (fieldType === 'password' || fieldType.includes('email') || fieldType.includes('tel')) ? '[redacted]' : element.value, // Redact sensitive info
                timestamp: Date.now()
            });
        });

        // Error detection (using MutationObserver for changes to class names or attributes indicating error)
        const errorObserver = new MutationObserver(() => {
            const hasError = element.classList.contains('field--error') ||
                element.classList.contains('input-error') ||
                element.getAttribute('aria-invalid') === 'true' ||
                element.closest('.field--error, .input-error, [data-error-for]'); // Look for common error indicators

            if (hasError && !interactionData.last_error) { // Only track on first error detection for this state
                interactionData.error_count++;
                interactionData.last_error = Date.now();

                const errorTextElement = element.nextElementSibling?.matches('.field__message--error') ? element.nextElementSibling : null;
                const errorMessage = errorTextElement ? errorTextElement.textContent?.trim() : null;

                TrackerClient.track('checkout_field_error', {
                    checkout_id: this.checkoutSessionData.checkout_id,
                    step: this.currentStep,
                    field_name: fieldName,
                    field_type: fieldType,
                    error_count: interactionData.error_count,
                    error_message: errorMessage,
                    timestamp: Date.now()
                });
            } else if (!hasError && interactionData.last_error) {
                // Error resolved
                interactionData.last_error = null;
            }
        });

        errorObserver.observe(element, { attributes: true, attributeFilter: ['class', 'aria-invalid'] });
        // Also observe parent for error classes
        if (element.parentElement) {
            errorObserver.observe(element.parentElement, { attributes: true, attributeFilter: ['class'] });
        }
    }

    /**
     * Internal method to track field input events, throttled.
     * @param {HTMLElement} element - The input element.
     * @param {object} interactionData - The interaction data for the field.
     * @private
     */
    _trackFieldInput(element, interactionData) {
        TrackerClient.track('checkout_field_input', {
            checkout_id: this.checkoutSessionData.checkout_id,
            step: this.currentStep,
            field_name: interactionData.field_name,
            field_type: interactionData.field_type,
            input_count: interactionData.input_count,
            value_changes: interactionData.value_changes,
            has_value: !!element.value,
            value_length: element.value?.length || 0,
            timestamp: Date.now()
        });
        SessionManager.saveCheckoutSession(this.checkoutSessionData); // Save updated interaction data
    }

    /**
     * Monitors for various abandonment signals during checkout.
     */
    monitorCheckoutAbandonment() {
        console.log('🚪 Monitorando abandono de checkout');

        // Detect page unload/close (most common abandonment signal)
        window.addEventListener('beforeunload', () => {
            if (!this.abandonmentTracked && this.isCheckoutPage() && !this.isThankYouPage()) {
                this.trackCheckoutAbandonment('page_unload');
            }
        });

        // Detect exit intent (mouse leaving top of the window)
        document.addEventListener('mouseleave', (e) => {
            if (e.clientY <= 0 && !this.abandonmentTracked && this.isCheckoutPage() && !this.isThankYouPage()) {
                TrackerClient.track('checkout_exit_intent', {
                    checkout_id: this.checkoutSessionData.checkout_id,
                    step: this.currentStep,
                    time_in_checkout: Date.now() - this.checkoutSessionData.start_time,
                    time_on_current_step: Date.now() - this.checkoutStartTime,
                    form_completion: PageDataExtractor.calculateFormCompletion(),
                    timestamp: Date.now()
                });
                // Optionally, track immediate abandonment if this is critical
                // this.trackCheckoutAbandonment('exit_intent');
            }
        });

        // Detect prolonged inactivity
        let inactivityTimer;
        const INACTIVITY_TIMEOUT_MS = 300000; // 5 minutes

        const resetInactivityTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                if (this.isCheckoutPage() && !this.abandonmentTracked && !this.isThankYouPage()) {
                    this.trackCheckoutAbandonment('inactivity');
                }
            }, INACTIVITY_TIMEOUT_MS);
        };

        // Reset timer on any user activity
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'visibilitychange'].forEach(event => {
            document.addEventListener(event, resetInactivityTimer, { passive: true });
        });

        resetInactivityTimer(); // Start the timer on initialization
    }

    /**
     * Tracks a checkout abandonment event.
     * @param {string} reason - The reason for abandonment (e.g., 'page_unload', 'inactivity').
     */
    trackCheckoutAbandonment(reason) {
        if (this.abandonmentTracked) return; // Ensure it's tracked only once per session
        this.abandonmentTracked = true;

        console.log('🚪 Checkout abandonado:', reason);

        TrackerClient.track('checkout_abandonment', {
            checkout_id: this.checkoutSessionData.checkout_id,
            abandonment_reason: reason,
            abandonment_step: this.currentStep,
            time_in_checkout: Date.now() - this.checkoutSessionData.start_time,
            time_on_current_step: Date.now() - this.checkoutStartTime,
            steps_completed: this.checkoutSteps,
            form_completion: PageDataExtractor.calculateFormCompletion(),
            cart_value: PageDataExtractor.getCartValue(),
            cart_items: PageDataExtractor.getCartItemCount(),
            influencer_attribution: PageDataExtractor.getInfluencerAttribution(),
            customer_journey: SessionManager.getCustomerJourney(this.startTime),
            device_info: PageDataExtractor.getDeviceInfo(),
            performance_metrics: this.getCheckoutPerformanceMetrics(),
            timestamp: Date.now()
        });

        SessionManager.saveAbandonmentData({ // Save to localStorage for potential recovery tracking
            checkout_id: this.checkoutSessionData.checkout_id,
            abandonment_time: Date.now(),
            step: this.currentStep,
            cart_value: PageDataExtractor.getCartValue(),
            form_completion: PageDataExtractor.calculateFormCompletion(),
            influencer_attribution: PageDataExtractor.getInfluencerAttribution()
        });
    }

    /**
     * Monitors checkout performance metrics like page load times and API requests.
     */
    monitorCheckoutPerformance() {
        // Measure initial page load performance
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.entryType === 'navigation' && entry.name === window.location.href) {
                        this.checkoutSessionData.performance_metrics.page_load = {
                            load_time: entry.duration, // Navigation timing API uses 'duration'
                            dom_content_loaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                            first_contentful_paint: window.performance.getEntriesByName('first-contentful-paint')[0]?.startTime || null,
                            // Add more metrics like LCP, CLS etc. if needed and available
                        };
                        SessionManager.saveCheckoutSession(this.checkoutSessionData);
                    }
                });
            });
            observer.observe({ entryTypes: ['navigation', 'paint'] }); // Observe paint for FCP
        }

        // Monitor network requests during checkout (e.g., API calls for shipping rates)
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const startTime = Date.now();
            const response = await originalFetch.apply(this, args);
            const endTime = Date.now();

            const url = typeof args[0] === 'string' ? args[0] : args[0].url;

            // Only track relevant checkout API requests
            if (url.includes('/checkout') || url.includes('/shopify_payments')) {
                const requestData = {
                    checkout_id: this.checkoutSessionData.checkout_id,
                    url: url,
                    method: args[1]?.method || 'GET',
                    duration: endTime - startTime,
                    status: response.status,
                    step: this.currentStep,
                    timestamp: Date.now()
                };
                TrackerClient.track('checkout_api_request', requestData);
                if (!this.checkoutSessionData.performance_metrics.api_requests) {
                    this.checkoutSessionData.performance_metrics.api_requests = [];
                }
                this.checkoutSessionData.performance_metrics.api_requests.push(requestData);
                SessionManager.saveCheckoutSession(this.checkoutSessionData);
            }
            return response;
        }.bind(this); // Bind 'this' to the CheckoutTracker instance
    }

    /**
     * Handles the completion of a purchase on the thank you page.
     * Collects all final data and cleans up the session.
     */
    handlePurchaseCompletion() {
        console.log('🎉 Purchase completed - coletando dados finais');

        const orderData = PageDataExtractor.extractOrderData();
        const checkoutSession = SessionManager.getCheckoutSession(); // Retrieve the session data

        TrackerClient.track('purchase_completed_detailed', {
            ...orderData, // Details of the completed order
            checkout_session: checkoutSession, // Full checkout session history
            customer_journey: SessionManager.getCustomerJourney(this.startTime), // Overall journey
            influencer_attribution: PageDataExtractor.getInfluencerAttribution(),
            total_checkout_time: checkoutSession ? Date.now() - checkoutSession.start_time : null,
            device_info: PageDataExtractor.getDeviceInfo(),
            timestamp: Date.now()
        });

        SessionManager.clearCheckoutSession(); // Clear session data after successful purchase
        SessionManager.clearAbandonmentData(); // Clear any pending abandonment data
    }

    /**
     * Retrieves specific data collected for a given checkout step.
     * @param {string} step - The name of the checkout step.
     * @returns {object} Collected data for the step.
     */
    getStepData(step) {
        const data = {};
        try {
            switch (step) {
                case 'contact':
                    data.email = PageDataExtractor.getFieldValue('checkout[email]');
                    data.phone = PageDataExtractor.getFieldValue('checkout[phone]');
                    data.newsletter_signup = PageDataExtractor.getCheckboxValue('checkout[buyer_accepts_marketing]');
                    break;
                case 'shipping':
                    data.shipping_method = PageDataExtractor.getSelectedShippingMethod();
                    data.address_country = PageDataExtractor.getFieldValue('checkout[shipping_address][country]');
                    data.address_state = PageDataExtractor.getFieldValue('checkout[shipping_address][province]');
                    data.address_city = PageDataExtractor.getFieldValue('checkout[shipping_address][city]');
                    data.shipping_price = PageDataExtractor.getShippingPrice();
                    break;
                case 'payment':
                    data.payment_method = PageDataExtractor.getSelectedPaymentMethod();
                    data.billing_same_as_shipping = PageDataExtractor.getCheckboxValue('checkout[billing_address_same_as_shipping]');
                    // Note: Sensitive payment info should NOT be collected
                    break;
                case 'review':
                    // Data from review step might include final order summary before purchase
                    break;
            }
        } catch (e) {
            console.error(`Error extracting data for step '${step}':`, e);
        }
        return data;
    }

    /**
     * Calculates performance metrics for a specific checkout step.
     * @param {string} step - The checkout step.
     * @returns {object} Performance metrics for the step.
     */
    getStepPerformance(step) {
        // Placeholder for more granular step-specific performance metrics
        return {
            api_requests_count: this.checkoutSessionData.performance_metrics.api_requests?.filter(req => req.step === step).length || 0,
            // Could add form interaction timings, specific rendering times here
        };
    }

    /**
     * Determines how the user entered the checkout process.
     * @returns {string} The entry method (e.g., 'cart_page', 'product_page', 'direct_checkout').
     */
    getCheckoutEntryMethod() {
        const referrer = document.referrer;
        if (referrer.includes('/cart')) return 'cart_page';
        if (referrer.includes('/products/')) return 'product_page';
        if (referrer.includes('/collections/')) return 'collection_page';
        if (referrer.includes('/checkout')) return 'direct_checkout'; // Came from another checkout page (e.g., a reload)
        if (!referrer) return 'direct_url';
        return 'unknown';
    }

    /**
     * Retrieves overall checkout performance metrics from the session data.
     * @returns {object} Performance metrics.
     */
    getCheckoutPerformanceMetrics() {
        return this.checkoutSessionData.performance_metrics || {};
    }

    /**
     * Checks for a previously abandoned checkout session in local storage.
     * If found, tracks recovery opportunities or attempts.
     */
    checkForAbandonedCheckoutRecovery() {
        const abandonmentData = SessionManager.getAbandonmentData();

        if (abandonmentData) {
            const timeSinceAbandonment = Date.now() - abandonmentData.abandonment_time;
            const ONE_DAY_MS = 24 * 60 * 60 * 1000;

            if (timeSinceAbandonment < ONE_DAY_MS) { // Consider recent abandonments
                TrackerClient.track('checkout_recovery_opportunity', {
                    original_checkout_id: abandonmentData.checkout_id,
                    time_since_abandonment: timeSinceAbandonment,
                    abandoned_step: abandonmentData.step,
                    abandoned_cart_value: abandonmentData.cart_value,
                    recovery_page: window.location.href,
                    timestamp: Date.now()
                });

                if (this.isCheckoutPage()) {
                    TrackerClient.track('checkout_recovery_attempt', {
                        original_checkout_id: abandonmentData.checkout_id,
                        time_since_abandonment: timeSinceAbandonment,
                        timestamp: Date.now()
                    });
                    // Clear data as a recovery attempt has been made
                    SessionManager.clearAbandonmentData();
                }
            } else {
                SessionManager.clearAbandonmentData(); // Clear old abandonment data
            }
        }
    }
}

export default CheckoutTracker;