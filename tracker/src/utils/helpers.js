/*!
 * Influencer Tracker - Utility Functions
 * Funções auxiliares compartilhadas
 */

(function (window) {
  'use strict';

  window.InfluencerTrackerUtils = {

    // Debounce function
    debounce: function (func, wait, immediate) {
      let timeout;
      return function executedFunction() {
        const context = this;
        const args = arguments;

        const later = function () {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };

        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);

        if (callNow) func.apply(context, args);
      };
    },

    // Throttle function
    throttle: function (func, limit) {
      let inThrottle;
      return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    // Get element position
    getElementPosition: function (element) {
      const rect = element.getBoundingClientRect();
      return {
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };
    },

    // Parse currency values
    parseCurrency: function (text) {
      if (!text) return null;

      text = String(text).trim();
      let cleaned = text.replace(/[^\d.,\-]/g, '');

      if (cleaned.includes(',') && cleaned.includes('.')) {
        if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
          cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else {
          cleaned = cleaned.replace(/,/g, '');
        }
      } else if (cleaned.includes(',')) {
        const parts = cleaned.split(',');
        if (parts.length === 2 && parts[1].length <= 2) {
          cleaned = cleaned.replace(',', '.');
        } else {
          cleaned = cleaned.replace(/,/g, '');
        }
      }

      const value = parseFloat(cleaned);

      if (value > 10000) {
        return value / 100;
      }

      return isNaN(value) ? null : value;
    },

    // Check if element is visible
    isElementVisible: function (element) {
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    },

    // Get scroll percentage
    getScrollPercentage: function () {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      return Math.round((scrollTop / scrollHeight) * 100);
    },

    // Cookie utilities
    setCookie: function (name, value, days) {
      const expires = days ? `; expires=${new Date(Date.now() + days * 864e5).toUTCString()}` : '';
      document.cookie = `${name}=${value}${expires}; path=/`;
    },

    getCookie: function (name) {
      return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name ? decodeURIComponent(parts[1]) : r;
      }, '');
    },

    // Local storage with fallback
    setStorage: function (key, value, useSession = false) {
      try {
        const storage = useSession ? sessionStorage : localStorage;
        storage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.warn('Storage not available, using cookie fallback');
        this.setCookie(key, JSON.stringify(value), useSession ? null : 30);
        return false;
      }
    },

    getStorage: function (key, useSession = false) {
      try {
        const storage = useSession ? sessionStorage : localStorage;
        const item = storage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        const cookieValue = this.getCookie(key);
        return cookieValue ? JSON.parse(cookieValue) : null;
      }
    }
  };

})(window);