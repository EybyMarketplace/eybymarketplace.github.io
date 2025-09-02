import TrackerClient from '../../core/tracker-client';
import PageDataExtractor from './page-data-extractor';
import SessionManager from '../session/SessionManager';

/**
 * @fileoverview Handles tracking specific to the Shopify platform.
 */

class ShopifySpecificTracker {
    constructor() {
        this.setupShopifySpecific();
    }

    /**
     * Sets up all Shopify-specific tracking functionalities.
     */
    setupShopifySpecific() {
        console.log('🛍️ Configurando tracking específico do Shopify');

        this.trackPageType();
        this.trackCustomerData();
        this.trackShopData();
        this.trackVariantSelections();
    }

    /**
     * Tracks the current page type and dispatches specific view events (product, collection).
     */
    trackPageType() {
        const pageType = PageDataExtractor.detectPageType();
        const path = window.location.pathname;

        TrackerClient.track('page_view_detailed', {
            page_type: pageType,
            page_path: path,
            page_title: document.title,
            referrer: document.referrer,
            timestamp: Date.now(),
            // Enrich with shop and customer data for context
            ...PageDataExtractor.extractShopData(),
            ...PageDataExtractor.extractCustomerData()
        });

        // Trigger specific view events based on page type
        if (pageType === 'product') {
            this.trackProductView();
        } else if (pageType === 'collection') {
            this.trackCollectionView();
        }
    }

    /**
     * Tracks a product view event if product data is available.
     */
    trackProductView() {
        const productData = PageDataExtractor.extractProductData();
        if (productData) {
            TrackerClient.track('product_view', {
                ...productData,
                timestamp: Date.now()
            });
            SessionManager.saveProductView(productData);
        }
    }

    /**
     * Tracks a collection view event if collection data is available.
     */
    trackCollectionView() {
        const collectionData = PageDataExtractor.extractCollectionData();
        if (collectionData) {
            TrackerClient.track('collection_view', {
                ...collectionData,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Tracks customer data if available (e.g., for logged-in customers).
     */
    trackCustomerData() {
        const customerData = PageDataExtractor.extractCustomerData();
        if (customerData) {
            TrackerClient.track('customer_data', {
                ...customerData,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Tracks general shop data.
     */
    trackShopData() {
        const shopData = PageDataExtractor.extractShopData();
        TrackerClient.track('shop_data', {
            ...shopData,
            timestamp: Date.now()
        });
    }

    /**
     * Monitors and tracks changes in product variant selections.
     */
    trackVariantSelections() {
        const variantSelectors = [
            'input[name="id"]', // Common for radio buttons or hidden inputs for variant ID
            'select[name="id"]', // Common for dropdowns
            '[data-variant-id]', // Custom data attributes
            '.product-variant-id', // Common class names
            'input[type="radio"][name*="variant"]' // More specific for radio groups
        ];

        variantSelectors.forEach(selector => {
            // Use event delegation for dynamically added elements
            document.body.addEventListener('change', (e) => {
                const element = e.target;
                if (element.matches(selector)) {
                    TrackerClient.track('variant_selection', {
                        product_id: PageDataExtractor.getProductId(),
                        variant_id: element.value || element.dataset.variantId,
                        product_handle: PageDataExtractor.getProductHandle(),
                        selection_method: element.tagName.toLowerCase(),
                        timestamp: Date.now()
                    });
                    SessionManager.saveInteraction({
                        type: 'variant_selection',
                        product_id: PageDataExtractor.getProductId(),
                        variant_id: element.value || element.dataset.variantId
                    });
                }
            });
        });
    }
}

export default ShopifySpecificTracker;