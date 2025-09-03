/*!
 * Influencer Tracker - Utilities Module
 */
(function(window) {
    'use strict';
    
    window.InfluencerTracker = window.InfluencerTracker || {};
    
    window.InfluencerTracker.Utils = {
        // Throttle function
        throttle: function(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        // Debounce function
        debounce: function(func, wait, immediate) {
            let timeout;
            return function() {
                const context = this;
                const args = arguments;
                const later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        },
        
        // Verificar se é mobile
        isMobile: function() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        },
        
        // Verificar se é tablet
        isTablet: function() {
            return /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(navigator.userAgent);
        },
        
        // Obter tipo de dispositivo
        getDeviceType: function() {
            if (this.isMobile()) return 'mobile';
            if (this.isTablet()) return 'tablet';
            return 'desktop';
        },
        
        // Verificar se elemento está visível
        isElementVisible: function(element) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        },
        
        // Calcular porcentagem de scroll
        getScrollPercentage: function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            return Math.round((scrollTop / scrollHeight) * 100);
        },
        
        // Obter parâmetros da URL
        getUrlParams: function() {
            const params = {};
            const urlParams = new URLSearchParams(window.location.search);
            
            for (const [key, value] of urlParams) {
                params[key] = value;
            }
            
            return params;
        },
        
        // Sanitizar string para evitar XSS
        sanitizeString: function(str) {
            if (typeof str !== 'string') return str;
            
            return str
                .replace(/[<>]/g, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+=/gi, '')
                .trim();
        },
        
        // Validar email
        isValidEmail: function(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },
        
        // Gerar timestamp legível
        formatTimestamp: function(timestamp) {
            return new Date(timestamp).toISOString();
        },
        
        // Deep merge de objetos
        deepMerge: function(target, source) {
            const result = Object.assign({}, target);
            
            for (const key in source) {
                if (source.hasOwnProperty(key)) {
                    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                        result[key] = this.deepMerge(result[key] || {}, source[key]);
                    } else {
                        result[key] = source[key];
                    }
                }
            }
            
            return result;
        }
    };
    
    console.log('🔧 Utils module loaded');
    
})(window);