/*!
 * Influencer Tracker - Utilities Module
 */
(function(window) {
    'use strict';
    
    window.CommerceTracker = window.CommerceTracker || {};
    
    window.CommerceTracker.Utils = {
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
        
        // Calcular porcentagem de scroll
        getScrollPercentage: function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            return Math.round((scrollTop / scrollHeight) * 100);
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