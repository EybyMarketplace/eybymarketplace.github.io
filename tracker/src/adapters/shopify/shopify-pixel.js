// Este código fica no Shopify Web Pixel
(function() {
  // Carrega o script externo
  const script = document.createElement('script');
  script.src = 'https://eybymarketplace.github.io/tracker/dist/commerce-tracker.min.js';
  script.async = true;
  
  script.onload = function() {


      // Inicializa o tracker quando o script carregar
      if (window.CommerceTracker) {
          window.CommerceTracker.Core.init({
              apiEndpoint: 'https://rhino-bursting-cardinal.ngrok-free.app/api/tracking/events',
              projectId: window.CommerceTracker.IdGenerator.getProjectId(),
              enableConsentCheck: false,
              platform: 'shopify',
              batchSize: 5,
              batchTimeout: 3000,
          });
          
          // Configura os event listeners do Shopify
          setupShopifyEvents();
    }
  };
  
  script.onerror = function() {
    console.error('❌ Falha ao carregar Commerce Tracker');
  };
  
  document.head.appendChild(script);

  // Função que usa o objeto analytics (só funciona aqui)
  function setupShopifyEvents() {
    // === CUSTOMER EVENTS ===
    analytics.subscribe('customer_logged_in', (event) => {
      window.CommerceTracker.Core.track('fp_customer_logged_in', {
        customer_id: event.customerId,
        timestamp: event.timestamp
      });
    });

    analytics.subscribe('customer_logged_out', (event) => {
      window.CommerceTracker.Core.track('fp_customer_logged_out', {
        customer_id: event.customerId,
        timestamp: event.timestamp
      });
    });

    // === PRODUCT EVENTS ===
    analytics.subscribe('product_viewed', (event) => {
      window.CommerceTracker.Core.track('fp_product_view', {
        product: window.CommerceTracker.ShopifyDataExtractors.extractProductData(event.data.productVariant.product),
        variant: window.CommerceTracker.ShopifyDataExtractors.extractVariantData(event.data.productVariant),
        timestamp: event.timestamp
      });
    });

    analytics.subscribe('product_added_to_cart', (event) => {
      window.CommerceTracker.Core.track('fp_add_to_cart', {
        product: window.CommerceTracker.ShopifyDataExtractors.extractProductData(event.data.cartLine.merchandise.product),
        variant: window.CommerceTracker.ShopifyDataExtractors.extractVariantData(event.data.cartLine.merchandise),
        quantity: event.data.cartLine.quantity,
        line_price: parseFloat(event.data.cartLine.merchandise.price.amount) * event.data.cartLine.quantity,
        cart_token: event.data.cartLine.cart?.id,
        timestamp: event.timestamp
      });
    });

    analytics.subscribe('product_removed_from_cart', (event) => {
      window.CommerceTracker.Core.track('fp_remove_from_cart', {
        product: window.CommerceTracker.ShopifyDataExtractors.extractProductData(event.data.cartLine.merchandise.product),
        variant: window.CommerceTracker.ShopifyDataExtractors.extractVariantData(event.data.cartLine.merchandise),
        quantity: event.data.cartLine.quantity,
        line_price: parseFloat(event.data.cartLine.merchandise.price.amount) * event.data.cartLine.quantity,
        cart_token: event.data.cartLine.cart?.id,
        timestamp: event.timestamp
      });
    });
    
    analytics.subscribe('product_variant_changed', (event) => {
      window.CommerceTracker.Core.track('fp_variant_changed', {
        from_variant: window.CommerceTracker.ShopifyDataExtractors.extractVariantData(event.data.previousProductVariant),
        to_variant: window.CommerceTracker.ShopifyDataExtractors.extractVariantData(event.data.productVariant),
        product: window.CommerceTracker.ShopifyDataExtractors.extractProductData(event.data.productVariant.product),
        timestamp: event.timestamp
      });
    });
    
    // === CART EVENTS ===
    
    analytics.subscribe('cart_viewed', (event) => {
      window.CommerceTracker.Core.track('fp_cart_view', {
        cart_token: event.data.cart.id,
        total_price: parseFloat(event.data.cart.cost.totalAmount.amount),
        currency: event.data.cart.cost.totalAmount.currencyCode,
        item_count: event.data.cart.lines.length,
        items: window.CommerceTracker.ShopifyDataExtractors.extractLineItems(event.data.cart.lines),
        timestamp: event.timestamp
      });
    });
    
    analytics.subscribe('cart_updated', (event) => {
      window.CommerceTracker.Core.track('fp_cart_updated', {
        cart_token: event.data.cart.id,
        total_price: parseFloat(event.data.cart.cost.totalAmount.amount),
        currency: event.data.cart.cost.totalAmount.currencyCode,
        item_count: event.data.cart.lines.length,
        items: window.CommerceTracker.ShopifyDataExtractors.extractLineItems(event.data.cart.lines),
        timestamp: event.timestamp
      });
    });
    
    // === CHECKOUT EVENTS ===
    
    analytics.subscribe('checkout_started', (event) => {
      window.CommerceTracker.Core.track('fp_checkout_started', {
        checkout_token: event.data.checkout.token,
        order_id: event.data.checkout.order?.id,
        total_price: parseFloat(event.data.checkout.totalPrice.amount),
        currency: event.data.checkout.currencyCode,
        item_count: event.data.checkout.lineItems.length,
        items: event.data.checkout.lineItems.map(item => ({
          id: item.variant.id,
          product_id: item.variant.product.id,
          variant_id: item.variant.id,
          quantity: item.quantity,
          price: parseFloat(item.variant.price.amount),
          line_price: parseFloat(item.variant.price.amount) * item.quantity,
          title: item.title,
          handle: item.variant.product.handle
        })),
        customer_id: event.customerId,
        timestamp: event.timestamp
      });
    });
    
    analytics.subscribe('checkout_completed', (event) => {
      window.CommerceTracker.Core.track('fp_purchase', {
        order_id: event.data.checkout.order?.id,
        checkout_token: event.data.checkout.token,
        total_price: parseFloat(event.data.checkout.totalPrice.amount),
        subtotal_price: parseFloat(event.data.checkout.subtotalPrice.amount),
        total_tax: parseFloat(event.data.checkout.totalTax.amount),
        currency: event.data.checkout.currencyCode,
        customer_id: event.customerId,
        email: event.data.checkout.email,
        phone: event.data.checkout.phone,
        items: event.data.checkout.lineItems.map(item => ({
          id: item.variant.id,
          product_id: item.variant.product.id,
          variant_id: item.variant.id,
          quantity: item.quantity,
          price: parseFloat(item.variant.price.amount),
          line_price: parseFloat(item.variant.price.amount) * item.quantity,
          title: item.title,
          handle: item.variant.product.handle
        })),
        shipping_address: event.data.checkout.shippingAddress,
        billing_address: event.data.checkout.billingAddress,
        discounts: event.data.checkout.discountApplications || [],
        timestamp: event.timestamp
      });
    });
    
    analytics.subscribe('checkout_address_info_submitted', (event) => {
      window.CommerceTracker.Core.track('fp_checkout_address_submitted', {
        checkout_token: event.data.checkout.token,
        shipping_address: event.data.checkout.shippingAddress,
        billing_address: event.data.checkout.billingAddress,
        timestamp: event.timestamp
      });
    });
    
    analytics.subscribe('checkout_contact_info_submitted', (event) => {
      window.CommerceTracker.Core.track('fp_checkout_contact_submitted', {
        checkout_token: event.data.checkout.token,
        email: event.data.checkout.email,
        phone: event.data.checkout.phone,
        timestamp: event.timestamp
      });
    });
    
    analytics.subscribe('checkout_shipping_info_submitted', (event) => {
      window.CommerceTracker.Core.track('fp_checkout_shipping_submitted', {
        checkout_token: event.data.checkout.token,
        shipping_rate: event.data.checkout.shippingLine,
        timestamp: event.timestamp
      });
    });
    
    // === PAYMENT EVENTS ===
    
    analytics.subscribe('payment_info_submitted', (event) => {
      window.CommerceTracker.Core.track('fp_payment_info_submitted', {
        checkout_token: event.data.checkout.token,
        payment_method: event.data.checkout.transactions?.[0]?.gateway,
        total_price: parseFloat(event.data.checkout.totalPrice.amount),
        currency: event.data.checkout.currencyCode,
        timestamp: event.timestamp
      });
    });
    
    // === SEARCH EVENTS ===
    
    analytics.subscribe('search_submitted', (event) => {
      window.CommerceTracker.Core.track('fp_search', {
        search_query: event.data.searchResult.query,
        results_count: event.data.searchResult.productVariants?.length || 0,
        timestamp: event.timestamp
      });
    });
    
    // === COLLECTION EVENTS ===
    
    analytics.subscribe('collection_viewed', (event) => {
      window.CommerceTracker.Core.track('fp_collection_view', {
        collection_id: event.data.collection.id,
        collection_title: event.data.collection.title,
        collection_handle: event.data.collection.handle,
        products_count: event.data.collection.productVariants?.length || 0,
        timestamp: event.timestamp
      });
    });
    
    // === FORM EVENTS ===
    
    analytics.subscribe('form_submitted', (event) => {
      window.CommerceTracker.Core.track('fp_form_submitted', {
        form_id: event.data.form?.id,
        form_type: event.data.form?.type,
        timestamp: event.timestamp
      });
    });
    
    console.log('🚀 Shopify Analytics Events configurados!');
  }
})();