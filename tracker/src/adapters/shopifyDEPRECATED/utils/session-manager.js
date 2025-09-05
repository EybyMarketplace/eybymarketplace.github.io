/*!
 * Session Manager Module
 */

(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.SessionManager = {
        // Checkout Session Management
        saveCheckoutSession: function (sessionData) {
            try {
                sessionStorage.setItem('checkout_session', JSON.stringify(sessionData));
            } catch (e) {
                console.log('Erro ao salvar sessão de checkout:', e);
            }
        },

        getCheckoutSession: function () {
            try {
                return JSON.parse(sessionStorage.getItem('checkout_session') || 'null');
            } catch (e) {
                return null;
            }
        },

        clearCheckoutSession: function () {
            try {
                sessionStorage.removeItem('checkout_session');
            } catch (e) {
                console.log('Erro ao limpar sessão de checkout:', e);
            }
        },

        // User Journey Management
        saveUserJourney: function (journeyData) {
            try {
                const journey = this.getUserJourney() || [];
                journey.push({
                    timestamp: Date.now(),
                    ...journeyData
                });

                // Manter apenas últimos 100 eventos
                sessionStorage.setItem('user_journey', JSON.stringify(journey.slice(-100)));
            } catch (e) {
                console.log('Erro ao salvar jornada do usuário:', e);
            }
        },

        getUserJourney: function () {
            try {
                return JSON.parse(sessionStorage.getItem('user_journey') || '[]');
            } catch (e) {
                return [];
            }
        },

        // Attribution Management
        saveAttribution: function (attributionData) {
            try {
                sessionStorage.setItem('inf_attribution', JSON.stringify(attributionData));
            } catch (e) {
                console.log('Erro ao salvar atribuição:', e);
            }
        },

        getAttribution: function () {
            try {
                return JSON.parse(sessionStorage.getItem('inf_attribution') || 'null');
            } catch (e) {
                return null;
            }
        },

        // Performance Metrics
        savePerformanceMetric: function (metric, value) {
            try {
                const metrics = this.getPerformanceMetrics();
                metrics[metric] = {
                    value: value,
                    timestamp: Date.now()
                };
                sessionStorage.setItem('performance_metrics', JSON.stringify(metrics));
            } catch (e) {
                console.log('Erro ao salvar métrica de performance:', e);
            }
        },

        getPerformanceMetrics: function () {
            try {
                return JSON.parse(sessionStorage.getItem('performance_metrics') || '{}');
            } catch (e) {
                return {};
            }
        },

        // Generic Storage Methods
        setItem: function (key, value, storage = 'session') {
            try {
                const storageObj = storage === 'local' ? localStorage : sessionStorage;
                storageObj.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.log(`Erro ao salvar ${key}:`, e);
            }
        },

        getItem: function (key, defaultValue = null, storage = 'session') {
            try {
                const storageObj = storage === 'local' ? localStorage : sessionStorage;
                const item = storageObj.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.log(`Erro ao recuperar ${key}:`, e);
                return defaultValue;
            }
        },

        removeItem: function (key, storage = 'session') {
            try {
                const storageObj = storage === 'local' ? localStorage : sessionStorage;
                storageObj.removeItem(key);
            } catch (e) {
                console.log(`Erro ao remover ${key}:`, e);
            }
        },

        // Cleanup Methods
        clearExpiredData: function () {
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            // Limpar dados antigos de abandono
            try {
                const abandonmentData = JSON.parse(localStorage.getItem('checkout_abandonment') || 'null');
                if (abandonmentData && (now - abandonmentData.abandonment_time) > oneDay) {
                    localStorage.removeItem('checkout_abandonment');
                }
            } catch (e) {
                console.log('Erro ao limpar dados de abandono:', e);
            }

            // Limpar métricas antigas
            try {
                const metrics = this.getPerformanceMetrics();
                Object.keys(metrics).forEach(key => {
                    if ((now - metrics[key].timestamp) > oneDay) {
                        delete metrics[key];
                    }
                });
                sessionStorage.setItem('performance_metrics', JSON.stringify(metrics));
            } catch (e) {
                console.log('Erro ao limpar métricas antigas:', e);
            }
        }
    };

    console.log('📦 Session Manager module loaded');

})(window);
