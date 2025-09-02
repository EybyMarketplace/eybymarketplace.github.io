import EcommerceTracker from './ecommerce-tracker';
import BehavioralTracker from './behavioral-tracker';
import ShopifySpecificTracker from './shopify-specific-tracker';
import CheckoutTracker from './checkout-tracker';
import SessionManager from '../session/SessionManager';
import PageDataExtractor from './page-data-extractor';

/**
 * @fileoverview Main orchestration class for the Hybrid Shopify Tracker.
 * Initializes and integrates all tracking modules.
 */

class ShopifyTracker {
    constructor() {
        if (ShopifyTracker.instance) {
            return ShopifyTracker.instance; // Singleton pattern
        }

        this.initialized = false;
        this.startTime = Date.now(); // Global session start time

        // Initialize core components/trackers
        this.ecommerceTracker = null;
        this.behavioralTracker = null;
        this.shopifySpecificTracker = null;
        this.checkoutTracker = null;

        ShopifyTracker.instance = this;
    }

    /**
     * Initializes all tracking functionalities.
     * Ensures only one instance is initialized.
     */
    async init() {
        if (this.initialized) {
            console.warn('Shopify Tracker já inicializado.');
            return;
        }

        console.log('🔄 Inicializando Shopify Tracker');

        // 1. Initialize E-commerce Tracking
        this.ecommerceTracker = new EcommerceTracker();
        await this.ecommerceTracker.initializeCartState(); // Load initial cart state

        // 2. Initialize Behavioral Tracking
        this.behavioralTracker = new BehavioralTracker(this.startTime);

        // 3. Initialize Shopify Specific Tracking
        this.shopifySpecificTracker = new ShopifySpecificTracker();

        // 4. Initialize Advanced Checkout Tracking
        this.checkoutTracker = new CheckoutTracker(this.startTime);

        // Initial state saving (e.g., first page visit)
        SessionManager.savePageVisit({
            page_type: PageDataExtractor.detectPageType(),
            referrer: document.referrer
        });

        this.initialized = true;
        console.log('✅ Shopify Tracker inicializado com checkout tracking');
    }

    // You can add public methods here if you want to expose certain functionalities
    // from the sub-trackers, e.g.:
    // getCartState() {
    //     return this.ecommerceTracker?.lastCartState;
    // }
    // getCurrentCheckoutStep() {
    //     return this.checkoutTracker?.currentStep;
    // }
}

export default ShopifyTracker;