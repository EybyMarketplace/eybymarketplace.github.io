import ShopifyTracker from './shopify-tracker'; 
import PageDataExtractor from './page-data-extractor'; 
import EcommerceTracker from './ecommerce-tracker'; 
import BehavioralTracker from './behavioral-tracker'; 
import ShopifySpecificTracker from './shopify-specific-tracker'; 
import CheckoutTracker from './checkout-tracker'; 
import Utils from '../../utils/helpers'; 

// Re-exporting for consistency if needed, but not strictly necessary for this entry point's goal
export { ShopifyTracker, PageDataExtractor, EcommerceTracker, BehavioralTracker, ShopifySpecificTracker, CheckoutTracker, Utils };

// Initialize the Shopify adapter
const shopifyTrackerInstance = new ShopifyTracker();

// Global exposure wrapper for Rollup bundle output
(function(global) {
    if (!global.shopifyTracker) { // Existing global name from your original script
        global.shopifyTracker = shopifyTrackerInstance;

        // Ensure it initializes after the DOM is ready, and ideally after Core Influencer Tracker
        document.addEventListener('DOMContentLoaded', () => {
            // Check if core tracker is available and initialized, then init adapter
            if (global.InfluencerTracker && global.InfluencerTracker.isInitialized) {
                shopifyTrackerInstance.init();
            } else {
                console.warn('Influencer Tracker Core not found or not initialized. Shopify Adapter might not function correctly.');
                // Fallback init for adapter if core isn't there, or delay/retry
                shopifyTrackerInstance.init();
            }
        });
    }
})(typeof window !== 'undefined' ? window : this);