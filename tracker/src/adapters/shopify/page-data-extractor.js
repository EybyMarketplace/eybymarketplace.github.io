
/**
 * @fileoverview Utility for extracting various data from the Shopify page (e.g., product, customer, shop data).
 */

class PageDataExtractor {

    /**
     * Extracts product data from global Shopify objects or meta tags.
     * @returns {object|null} Product data or null if not found.
     */
    static extractProductData() {
        const productData = {};

        // Try multiple sources for product data
        if (window.product) {
            productData.product_id = window.product.id;
            productData.product_handle = window.product.handle;
            productData.product_title = window.product.title;
            productData.product_type = window.product.type;
            productData.vendor = window.product.vendor;
            productData.price = window.product.price / 100;
            productData.available = window.product.available;
            productData.variants_count = window.product.variants?.length || 0;
        } else if (window.meta?.product) {
            productData.product_id = window.meta.product.id;
            productData.product_handle = window.meta.product.handle;
        }

        // Fallback for meta tags if product_id is still missing
        if (!productData.product_id) {
            const metaProduct = document.querySelector('meta[property="product:retailer_item_id"]');
            if (metaProduct) productData.product_id = metaProduct.content;
        }

        return Object.keys(productData).length > 0 ? productData : null;
    }

    /**
     * Extracts collection data from global Shopify objects.
     * @returns {object|null} Collection data or null if not found.
     */
    static extractCollectionData() {
        const collectionData = {};

        if (window.collection) {
            collectionData.collection_id = window.collection.id;
            collectionData.collection_handle = window.collection.handle;
            collectionData.collection_title = window.collection.title;
            collectionData.products_count = window.collection.products_count;
        }

        return Object.keys(collectionData).length > 0 ? collectionData : null;
    }

    /**
     * Extracts customer data from global Shopify objects.
     * @returns {object|null} Customer data or null if not found.
     */
    static extractCustomerData() {
        const customerData = {};

        if (window.customer) {
            customerData.customer_id = window.customer.id;
            customerData.customer_email = window.customer.email;
            customerData.customer_tags = window.customer.tags;
            customerData.orders_count = window.customer.orders_count;
            customerData.total_spent = window.customer.total_spent;
        } else if (window.Shopify?.customer) {
            customerData.customer_id = window.Shopify.customer.id;
            customerData.customer_email = window.Shopify.customer.email;
        }

        return Object.keys(customerData).length > 0 ? customerData : null;
    }

    /**
     * Extracts general shop data from global Shopify objects.
     * @returns {object} Shop data.
     */
    static extractShopData() {
        return {
            shop_domain: window.Shopify?.shop || window.shopifyData?.shop?.domain,
            shop_currency: window.Shopify?.currency?.active || window.shopifyData?.shop?.currency,
            shop_money_format: window.Shopify?.money_format,
            shop_locale: window.Shopify?.locale
        };
    }

    /**
     * Gets the current product ID.
     * @returns {string|null} Product ID.
     */
    static getProductId() {
        if (window.product?.id) return window.product.id;
        if (window.meta?.product?.id) return window.meta.product.id;

        const metaProduct = document.querySelector('meta[property="product:retailer_item_id"]');
        return metaProduct ? metaProduct.content : null;
    }

    /**
     * Gets the current product handle (slug).
     * @returns {string|null} Product handle.
     */
    static getProductHandle() {
        if (window.product?.handle) return window.product.handle;

        const pathParts = window.location.pathname.split('/');
        return pathParts[pathParts.length - 1] || null;
    }

    /**
     * Detects the current page type based on the URL path.
     * @returns {string} The detected page type (e.g., 'product', 'collection', 'cart', 'checkout', 'home', 'other').
     */
    static detectPageType() {
        const path = window.location.pathname;

        if (path.includes('/products/')) return 'product';
        if (path.includes('/collections/')) return 'collection';
        if (path.includes('/cart')) return 'cart';
        if (path.includes('/checkout')) return 'checkout';
        if (path.includes('/thank_you') || path.includes('/orders/')) return 'thank_you';
        if (path === '/' || path === '') return 'home';

        return 'other';
    }

    /**
     * Retrieves the influencer attribution data from session storage.
     * @returns {object|null} Influencer attribution data.
     */
    static getInfluencerAttribution() {
        try {
            return JSON.parse(sessionStorage.getItem('inf_attribution') || 'null');
        } catch (e) {
            console.error('Error parsing influencer attribution from session storage:', e);
            return null;
        }
    }

    /**
     * Gets the value of a form field by name or ID.
     * @param {string} fieldName - The name or ID of the field.
     * @returns {string|null} The field's value or null.
     */
    static getFieldValue(fieldName) {
        const selectors = [
            `input[name="${fieldName}"]`,
            `select[name="${fieldName}"]`,
            `textarea[name="${fieldName}"]`,
            `#${fieldName}`,
            `input[name*="${fieldName}"]`,
            `select[name*="${fieldName}"]`
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.value || null;
            }
        }
        return null;
    }

    /**
     * Gets the checked state of a checkbox.
     * @param {string} fieldName - The name or ID of the checkbox.
     * @returns {boolean|null} True if checked, false if not, null if not found.
     */
    static getCheckboxValue(fieldName) {
        const element = document.querySelector(`input[name="${fieldName}"], input[name*="${fieldName}"], #${fieldName}`);
        return element ? element.checked : null;
    }

    /**
     * Gets the value of the selected shipping method.
     * @returns {string|null} The selected shipping method's value or text.
     */
    static getSelectedShippingMethod() {
        const selected = document.querySelector('input[name*="shipping"]:checked, select[name*="shipping"] option:checked');
        return selected ? selected.value || selected.textContent : null;
    }

    /**
     * Gets the value of the selected payment method.
     * @returns {string|null} The selected payment method's value or text.
     */
    static getSelectedPaymentMethod() {
        const selected = document.querySelector('input[name*="payment"]:checked, select[name*="payment"] option:checked');
        return selected ? selected.value || selected.textContent : null;
    }

    /**
     * Extracts the shipping price from a relevant DOM element.
     * @returns {number|null} The shipping price as a number, or null.
     */
    static getShippingPrice() {
        const priceElement = document.querySelector('.shipping-price, [data-shipping-price], .delivery-price');
        if (priceElement) {
            const priceText = priceElement.textContent;
            // Robust parsing for various currency formats
            const price = parseFloat(priceText.replace(/[^0-9.,-]/g, '').replace(',', '.'));
            return isNaN(price) ? null : price;
        }
        return null;
    }

    /**
     * Calculates the completion percentage of a form based on filled fields.
     * @returns {number} Percentage of fields filled (0-100).
     */
    static calculateFormCompletion() {
        const allFields = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
        const filledFields = Array.from(allFields).filter(field => field.value && field.value.trim() !== '');

        return allFields.length > 0 ? Math.round((filledFields.length / allFields.length) * 100) : 0;
    }

    /**
     * Retrieves current cart value from a synchronous request to /cart.js.
     * Note: Synchronous XHR is generally discouraged, but used here for immediate cart state.
     * @returns {number} Total cart value.
     */
    static getCartValue() {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', '/cart.js', false); // Synchronous
            xhr.send();

            if (xhr.status === 200) {
                const cartData = JSON.parse(xhr.responseText);
                return cartData.total_price ? cartData.total_price / 100 : 0;
            }
        } catch (e) {
            console.error('Error getting cart value synchronously:', e);
        }
        return 0;
    }

    /**
     * Retrieves current cart item count from a synchronous request to /cart.js.
     * @returns {number} Total number of items in the cart.
     */
    static getCartItemCount() {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', '/cart.js', false); // Synchronous
            xhr.send();

            if (xhr.status === 200) {
                const cartData = JSON.parse(xhr.responseText);
                return cartData.item_count || 0;
            }
        } catch (e) {
            console.error('Error getting cart item count synchronously:', e);
        }
        return 0;
    }

    /**
     * Gets detailed cart information from a synchronous request to /cart.js.
     * @returns {object|null} Detailed cart object or null.
     */
    static getCartDetails() {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', '/cart.js', false); // Synchronous
            xhr.send();

            if (xhr.status === 200) {
                const cartData = JSON.parse(xhr.responseText);
                return {
                    items: cartData.items ? cartData.items.map(item => ({
                        product_id: item.product_id,
                        variant_id: item.variant_id,
                        quantity: item.quantity,
                        price: item.price / 100,
                        title: item.title
                    })) : [],
                    total_discount: cartData.total_discount ? cartData.total_discount / 100 : 0,
                    currency: cartData.currency
                };
            }
        } catch (e) {
            console.error('Error getting cart details synchronously:', e);
        }
        return null;
    }

    /**
     * Gets device information.
     * @returns {object} Device information.
     */
    static getDeviceInfo() {
        return {
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            device_pixel_ratio: window.devicePixelRatio,
            connection: navigator.connection ? {
                effective_type: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink
            } : null,
            touch_support: 'ontouchstart' in window
        };
    }

    /**
     * Extracts order data from the Shopify checkout object or DOM on the thank you page.
     * @returns {object} Order data.
     */
    static extractOrderData() {
        const orderData = {};

        // Shopify checkout object
        if (window.Shopify?.checkout) {
            orderData.order_id = window.Shopify.checkout.order_id;
            orderData.order_number = window.Shopify.checkout.order_number;
            orderData.total_price = window.Shopify.checkout.total_price / 100;
            orderData.currency = window.Shopify.checkout.currency;
            orderData.customer_id = window.Shopify.checkout.customer_id;
            orderData.line_items = window.Shopify.checkout.line_items?.map(item => ({
                product_id: item.product_id,
                variant_id: item.variant_id,
                quantity: item.quantity,
                price: item.price / 100,
                title: item.title,
                sku: item.sku
            }));
            orderData.shipping_rate = window.Shopify.checkout.shipping_rate?.price / 100;
            orderData.tax_price = window.Shopify.checkout.tax_price / 100;
            orderData.total_discounts = window.Shopify.checkout.total_discounts / 100;
        }

        // Fallback: extract from DOM if Shopify.checkout is not fully available
        if (!orderData.order_id) {
            const orderElement = document.querySelector('.order-number, [data-order-number], .order-id');
            if (orderElement) {
                orderData.order_number = orderElement.textContent?.trim();
            }
            // Add more DOM-based extraction here if needed
        }

        return orderData;
    }

    /**
     * Gets the precise location and dimensions of an HTML element within the viewport.
     * @param {HTMLElement} element - The HTML element to analyze.
     * @returns {object} Object with x, y, width, height, and viewport_position (percentage).
     */
    static getElementLocation(element) {
        if (!element || typeof element.getBoundingClientRect !== 'function') {
            return null;
        }
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            viewport_position: {
                x_percent: Math.round((rect.left / window.innerWidth) * 100),
                y_percent: Math.round((rect.top / window.innerHeight) * 100)
            }
        };
    }
}

export default PageDataExtractor;