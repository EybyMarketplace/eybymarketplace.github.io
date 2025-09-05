/*!
 * Data Extractors Utility Module
 */

(function (window) {
    'use strict';

    window.CommerceTracker = window.CommerceTracker || {};

    window.CommerceTracker.ShopifyDataExtractors = {
   // Helper function to extract product data
        extractProductData(product) {
            if (!product) return null;

            return {
                id: product.id,
                title: product.title,
                handle: product.handle,
                vendor: product.vendor,
                type: product.type,
                price: product.price ? parseFloat(product.price.amount) : null,
                currency: product.price ? product.price.currencyCode : null,
                available: product.available,
                tags: product.tags || [],
                created_at: product.createdAt,
                updated_at: product.updatedAt
            };
        },

        // Helper function to extract variant data
        extractVariantData(variant) {
            if (!variant) return null;

            return {
                id: variant.id,
                title: variant.title,
                price: parseFloat(variant.price.amount),
                currency: variant.price.currencyCode,
                compare_at_price: variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount) : null,
                available: variant.available,
                inventory_quantity: variant.inventoryQuantity,
                sku: variant.sku,
                barcode: variant.barcode,
                weight: variant.weight,
                weight_unit: variant.weightUnit,
                product: extractProductData(variant.product)
            };
        },

        // Helper function to extract cart line items
        extractLineItems(lineItems) {
            if (!lineItems) return [];

            return lineItems.map(item => ({
                id: item.id,
                quantity: item.quantity,
                title: item.title,
                variant: extractVariantData(item.variant),
                line_price: parseFloat(item.variant.price.amount) * item.quantity,
                discounts: item.discounts || [],
                properties: item.properties || {}
            }));
        }
    };

    console.log('📦 Shopify Data Extractors module loaded');

})(window);

