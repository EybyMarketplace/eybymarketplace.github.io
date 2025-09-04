/*!
 * Product Tracking Module
 */

(function (window) {
    'use strict';

    window.ShopifyAdapterModules = window.ShopifyAdapterModules || {};

    window.ShopifyAdapterModules.ProductTracker = {
        init: function (core) {
            this.core = core;
            this.dataExtractors = window.ShopifyAdapterModules.DataExtractors;
            this.setupProductTracking();
        },

        setupProductTracking: function () {
            console.log('📦 Configurando tracking de produtos');
            this.trackPageType();
            this.trackVariantSelections();
        },

        trackPageType: function () {
            const path = window.location.pathname;
            let pageType = 'other';

            if (path.includes('/products/')) {
                pageType = 'product';
                this.trackProductView();
            } else if (path.includes('/collections/')) {
                pageType = 'collection';
                this.trackCollectionView();
            } else if (path.includes('/cart')) {
                pageType = 'cart';
            } else if (path.includes('/checkout')) {
                pageType = 'checkout';
            } else if (path === '/' || path === '') {
                pageType = 'home';
            }

            this.core.track('page_view_detailed', {
                page_type: pageType,
                page_path: path,
                page_title: document.title,
                referrer: document.referrer,
                timestamp: Date.now()
            });
        },

        trackProductView: function () {
            const productData = this.dataExtractors.extractProductData();

            if (productData) {
                this.core.track('product_view', {
                    ...productData,
                    timestamp: Date.now()
                });

                this.saveProductView(productData);
            }
        },

        trackCollectionView: function () {
            const collectionData = this.dataExtractors.extractCollectionData();

            if (collectionData) {
                this.core.track('collection_view', {
                    ...collectionData,
                    timestamp: Date.now()
                });
            }
        },

        trackVariantSelections: function () {
            const variantSelectors = [
                'input[name="id"]',
                'select[name="id"]',
                '[data-variant-id]',
                '.product-variant-id'
            ];

            variantSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    element.addEventListener('change', () => {
                        this.core.track('variant_selection', {
                            product_id: this.dataExtractors.getProductId(),
                            variant_id: element.value || element.dataset.variantId,
                            product_handle: this.dataExtractors.getProductHandle(),
                            selection_method: element.tagName.toLowerCase(),
                            timestamp: Date.now()
                        });
                    });
                });
            });
        },

        handleProductData: function (data, url) {
            console.log('📦 Dados de produto carregados:', data);

            this.core.track('product_data_loaded', {
                product_id: data.id,
                product_handle: data.handle,
                product_title: data.title,
                product_type: data.product_type,
                vendor: data.vendor,
                price_min: data.price_min / 100,
                price_max: data.price_max / 100,
                available: data.available,
                variants_count: data.variants ? data.variants.length : 0,
                images_count: data.images ? data.images.length : 0,
                tags: data.tags || [],
                api_endpoint: url,
                timestamp: Date.now()
            });
        },

        saveProductView: function (productData) {
            try {
                const products = this.getProductsViewed();
                products.push({
                    timestamp: Date.now(),
                    ...productData
                });

                sessionStorage.setItem('products_viewed', JSON.stringify(products.slice(-20)));
            } catch (e) {
                console.log('Erro ao salvar visualização de produto:', e);
            }
        },

        getProductsViewed: function () {
            try {
                return JSON.parse(sessionStorage.getItem('products_viewed') || '[]');
            } catch (e) {
                return [];
            }
        }
    };

    console.log('📦 Product Tracker module loaded');

})(window);

