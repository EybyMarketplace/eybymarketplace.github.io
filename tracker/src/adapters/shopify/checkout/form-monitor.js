/*!
 * Form Monitor Module for Checkout
 */

(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.FormMonitor = {
        formInteractions: {},

        init: function (core) {
            this.core = core;
            this.checkoutTracker = core.checkoutTracker;
            this.setupFormMonitoring();
        },

        setupFormMonitoring: function () {
            console.log('📝 Configurando monitoramento de formulários');

            const formElements = document.querySelectorAll('input, select, textarea');
            formElements.forEach(element => {
                this.setupFieldMonitoring(element);
            });

            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const newFields = node.querySelectorAll('input, select, textarea');
                            newFields.forEach(field => this.setupFieldMonitoring(field));
                        }
                    });
                });
            });

            observer.observe(document.body, { childList: true, subtree: true });
        },

        setupFieldMonitoring: function (element) {
            if (element.dataset.trackerMonitored) return;
            element.dataset.trackerMonitored = 'true';

            const fieldName = element.name || element.id || element.placeholder || 'unknown';
            const fieldType = element.type || element.tagName.toLowerCase();

            let interactionData = {
                field_name: fieldName,
                field_type: fieldType,
                focus_count: 0,
                input_count: 0,
                total_focus_time: 0,
                value_changes: 0,
                focus_start: null,
                initial_value: element.value,
                error_count: 0
            };

            // Focus events
            element.addEventListener('focus', () => {
                interactionData.focus_count++;
                interactionData.focus_start = Date.now();

                this.core.track('checkout_field_focus', {
                    checkout_id: this.checkoutTracker.checkoutSessionData.checkout_id,
                    step: this.checkoutTracker.currentStep,
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

                    this.core.track('checkout_field_blur', {
                        checkout_id: this.checkoutTracker.checkoutSessionData.checkout_id,
                        step: this.checkoutTracker.currentStep,
                        field_name: fieldName,
                        field_type: fieldType,
                        focus_time: focusTime,
                        total_focus_time: interactionData.total_focus_time,
                        has_value: !!element.value,
                        timestamp: Date.now()
                    });
                }
            });

            // Input events
            element.addEventListener('input', () => {
                interactionData.input_count++;

                if (element.value !== interactionData.initial_value) {
                    interactionData.value_changes++;
                }

                this.throttledTrackInput(element, interactionData);
            });

            // Change events
            element.addEventListener('change', () => {
                this.core.track('checkout_field_change', {
                    checkout_id: this.checkoutTracker.checkoutSessionData.checkout_id,
                    step: this.checkoutTracker.currentStep,
                    field_name: fieldName,
                    field_type: fieldType,
                    new_value: fieldType === 'select-one' ? element.value : '[hidden]',
                    timestamp: Date.now()
                });
            });

            // Error detection
            const checkForErrors = () => {
                const hasError = element.classList.contains('error') ||
                    element.classList.contains('invalid') ||
                    element.getAttribute('aria-invalid') === 'true' ||
                    element.closest('.error, .invalid, [data-error]');

                if (hasError) {
                    interactionData.error_count++;

                    this.core.track('checkout_field_error', {
                        checkout_id: this.checkoutTracker.checkoutSessionData.checkout_id,
                        step: this.checkoutTracker.currentStep,
                        field_name: fieldName,
                        field_type: fieldType,
                        error_count: interactionData.error_count,
                        timestamp: Date.now()
                    });
                }
            };

            setInterval(checkForErrors, 2000);

            // Salvar dados de interação
            if (!this.formInteractions[this.checkoutTracker.currentStep]) {
                this.formInteractions[this.checkoutTracker.currentStep] = {};
            }
            this.formInteractions[this.checkoutTracker.currentStep][fieldName] = interactionData;
        },

        throttledTrackInput: (() => {
            const throttleMap = new Map();

            return function (element, interactionData) {
                const fieldName = interactionData.field_name;

                if (throttleMap.has(fieldName)) {
                    clearTimeout(throttleMap.get(fieldName));
                }

                throttleMap.set(fieldName, setTimeout(() => {
                    this.core.track('checkout_field_input', {
                        checkout_id: this.checkoutTracker.checkoutSessionData.checkout_id,
                        step: this.checkoutTracker.currentStep,
                        field_name: fieldName,
                        field_type: interactionData.field_type,
                        input_count: interactionData.input_count,
                        value_changes: interactionData.value_changes,
                        has_value: !!element.value,
                        value_length: element.value?.length || 0,
                        timestamp: Date.now()
                    });

                    throttleMap.delete(fieldName);
                }, 1000));
            }.bind(this);
        })()
    };
    console.log('📝 FormMonitor module loaded');
})(window);