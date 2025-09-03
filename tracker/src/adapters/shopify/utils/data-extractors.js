/*!
 * Data Extractors Utility Module
 */

(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.DataExtractors = {
        init: function (core) {
            this.core = core;
        },

        extractProductData: function () {
            const productData = {};

            // Tentar múltiplas fontes
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

            // Fallback para meta tags
            if (!productData.product_id) {
                const metaProduct = document.querySelector('meta[property="product:retailer_item_id"]');
                if (metaProduct) productData.product_id = metaProduct.content;
            }

            return Object.keys(productData).length > 0 ? productData : null;
        },

        extractCollectionData: function () {
            const collectionData = {};

            if (window.collection) {
                collectionData.collection_id = window.collection.id;
                collectionData.collection_handle = window.collection.handle;
                collectionData.collection_title = window.collection.title;
                collectionData.products_count = window.collection.products_count;
            }

            return Object.keys(collectionData).length > 0 ? collectionData : null;
        },

        extractCustomerData: function () {
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
        },

        extractShopData: function () {
            return {
                shop_domain: window.Shopify?.shop || window.shopifyData?.shop?.domain,
                shop_currency: window.Shopify?.currency?.active || window.shopifyData?.shop?.currency,
                shop_money_format: window.Shopify?.money_format,
                shop_locale: window.Shopify?.locale
            };
        },

        extractOrderData: function () {
            const orderData = {};

            // Shopify checkout object
            if (window.Shopify?.checkout) {
                orderData.order_id = window.Shopify.checkout.order_id;
                orderData.order_number = window.Shopify.checkout.order_number;
                orderData.total_price = window.Shopify.checkout.total_price / 100;
                orderData.currency = window.Shopify.checkout.currency;
                orderData.customer_id = window.Shopify.checkout.customer_id;
            }

            // Fallback: extrair do DOM
            if (!orderData.order_id) {
                const orderElement = document.querySelector('.order-number, [data-order-number], .order-id');
                if (orderElement) {
                    orderData.order_number = orderElement.textContent?.trim();
                }
            }

            return orderData;
        },

        getProductId: function () {
            if (window.product?.id) return window.product.id;
            if (window.meta?.product?.id) return window.meta.product.id;

            const metaProduct = document.querySelector('meta[property="product:retailer_item_id"]');
            return metaProduct ? metaProduct.content : null;
        },

        getProductHandle: function () {
            if (window.product?.handle) return window.product.handle;

            const pathParts = window.location.pathname.split('/');
            return pathParts[pathParts.length - 1] || null;
        }
    };

    console.log('📦 Data Extractors module loaded');

})(window);

