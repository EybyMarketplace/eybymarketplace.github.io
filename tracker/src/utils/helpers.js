/**
 * @fileoverview Utility functions for the Hybrid Shopify Tracker.
 */

class Utils {
    /**
     * Throttles a function to limit how often it can be called.
     * Useful for events like scroll or resize.
     * @param {Function} func - The function to throttle.
     * @param {number} limit - The time in milliseconds to wait before allowing the function to be called again.
     * @returns {Function} - The throttled function.
     */
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    
}

export default Utils;