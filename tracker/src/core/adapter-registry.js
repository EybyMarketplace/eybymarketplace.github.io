import ShopifyTracker from '../adapters/shopify/shopify-tracker.js';
// Import other adapters as needed

export const ADAPTER_REGISTRY = {
    'shopify': ShopifyTracker,
    'vtex': null, // Not implemented yet
    'nuvemshop': null, // Not implemented yet
    'generic': null // No adapter needed
};

export function getAdapter(platform) {
    const AdapterClass = ADAPTER_REGISTRY[platform];
    return AdapterClass ? new AdapterClass() : null;
}