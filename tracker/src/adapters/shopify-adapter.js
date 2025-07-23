/*!
 * Influencer Tracker - Shopify Adapter
 * Funcionalidades específicas para Shopify
 */

(function(window, document) {
  'use strict';
  
  window.shopifyAdapter = {
    lastCartState: null,
    cartUpdateTimeout: null,
    
    init: function() {
      console.log('🛍️ Inicializando adaptador Shopify');
      
      // Setup tracking específico do Shopify
      this.setupShopifyTracking();
      this.setupCartTracking();
      this.setupProductTracking();
      this.setupCheckoutTracking();
      
      // Estado inicial do carrinho
      this.lastCartState = {
        items: this.getCartItemCount(),
        value: this.getCartValue()
      };
      
      console.log('🛒 Estado inicial do carrinho:', this.lastCartState);
    },
    
    // Enriquecer eventos com dados específicos do Shopify
    enrichEvent: function(eventType, properties) {
      const shopifyData = {
        shop_domain: window.Shopify?.shop || window.shopifyData?.shop?.domain,
        currency: window.shopifyData?.shop?.currency || 'USD',
        customer_id: window.shopifyData?.customer?.id,
        cart_token: this.getCartToken()
      };
      
      // Dados específicos por tipo de evento
      if (eventType === 'cart_update') {
        shopifyData.cart_items = this.getCartItemCount();
        shopifyData.cart_value = this.getCartValue();
      }
      
      if (eventType === 'product_view' && window.shopifyData?.product) {
        shopifyData.product_id = window.shopifyData.product.id;
        shopifyData.product_handle = window.shopifyData.product.handle;
        shopifyData.product_type = window.shopifyData.product.type;
        shopifyData.product_vendor = window.shopifyData.product.vendor;
        shopifyData.product_price = window.shopifyData.product.price;
        shopifyData.product_available = window.shopifyData.product.available;
      }
      
      return shopifyData;
    },
    
    // ========== FUNÇÕES DE CARRINHO ==========
    getCartValue: function() {
      console.log('🛒 getCartValue (Shopify)');
      
      // ESTRATÉGIA 1: Dados do Shopify (mais confiável)
      if (window.shopifyData?.cart?.total_price !== undefined) {
        const value = window.shopifyData.cart.total_price;
        console.log('   ✅ Via Shopify data:', value);
        return value;
      }
      
      // ESTRATÉGIA 2: API do Shopify
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/cart.js', false);
        xhr.send();
        
        if (xhr.status === 200) {
          const cartData = JSON.parse(xhr.responseText);
          const value = cartData.total_price / 100; // Shopify retorna em centavos
          console.log('   ✅ Via API /cart.js:', value);
          return value;
        }
      } catch (e) {
        console.log('   ❌ Erro API:', e);
      }
      
      // ESTRATÉGIA 3: DOM (fallback)
      const selectors = [
        '[data-cart-total]',
        '.cart-total',
        '#cart-total',
        '.basket-total',
        '.cart__total',
        '.drawer-cart__total'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent || element.value || element.getAttribute('data-cart-total');
          if (text) {
            const value = this.parseCartValue(text);
            if (value !== null) {
              console.log('   ✅ Via DOM:', value);
              return value;
            }
          }
        }
      }
      
      console.log('   ⚠️ Fallback para 0');
      return 0;
    },
    
    getCartItemCount: function() {
      // Shopify data primeiro
      if (window.shopifyData?.cart?.item_count !== undefined) {
        return window.shopifyData.cart.item_count;
      }
      
      // API como fallback
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/cart.js', false);
        xhr.send();
        
        if (xhr.status === 200) {
          const cartData = JSON.parse(xhr.responseText);
          return cartData.item_count;
        }
      } catch (e) {
        console.log('Erro ao buscar item count:', e);
      }
      
      // DOM como último recurso
      return document.querySelectorAll('[data-cart-item], .cart-item, .line-item').length;
    },
    
    getCartToken: function() {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/cart.js', false);
        xhr.send();
        
        if (xhr.status === 200) {
          const cartData = JSON.parse(xhr.responseText);
          return cartData.token;
        }
      } catch (e) {
        return null;
      }
    },
    
    parseCartValue: function(text) {
      if (!text) return null;
      
      // Converter para string
      text = String(text).trim();
      
      // Remover símbolos de moeda e espaços
      let cleaned = text.replace(/[^\d.,\-]/g, '');
      
      // Tratar diferentes formatos
      if (cleaned.includes(',') && cleaned.includes('.')) {
        // Formato: 1.234,56 ou 1,234.56
        if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
          // Formato europeu: 1.234,56
          cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else {
          // Formato americano: 1,234.56
          cleaned = cleaned.replace(/,/g, '');
        }
      } else if (cleaned.includes(',')) {
        // Apenas vírgula: pode ser decimal (12,34) ou milhares (1,234)
        const parts = cleaned.split(',');
        if (parts.length === 2 && parts[1].length <= 2) {
          // Decimal: 12,34
          cleaned = cleaned.replace(',', '.');
        } else {
          // Milhares: 1,234
          cleaned = cleaned.replace(/,/g, '');
        }
      }
      
      const value = parseFloat(cleaned);
      
      // Se valor muito alto, pode estar em centavos
      if (value > 10000) {
        return value / 100;
      }
      
      return isNaN(value) ? null : value;
    },
    
    // ========== TRACKING ESPECÍFICO DO SHOPIFY ==========
    setupShopifyTracking: function() {
      const tracker = window.InfluencerTracker;
      
      // 1. TRACKING DE PÁGINA ESPECÍFICA
      if (window.shopifyData?.page?.type === 'product') {
        tracker.trackCustomEvent('product_view', {
          product_id: window.shopifyData.product?.id,
          product_handle: window.shopifyData.product?.handle,
          product_title: window.shopifyData.product?.title,
          product_price: window.shopifyData.product?.price,
          product_type: window.shopifyData.product?.type,
          product_vendor: window.shopifyData.product?.vendor,
          product_available: window.shopifyData.product?.available,
          variants_count: window.shopifyData.product?.variants?.length
        });
      }
      
      if (window.shopifyData?.page?.type === 'collection') {
        tracker.trackCustomEvent('collection_view', {
          collection_id: window.shopifyData.collection?.id,
          collection_handle: window.shopifyData.collection?.handle,
          collection_title: window.shopifyData.collection?.title,
          products_count: window.shopifyData.collection?.products_count
        });
      }
      
      if (window.shopifyData?.page?.type === 'cart') {
        tracker.trackCustomEvent('cart_view', {
          cart_items: window.shopifyData.cart?.item_count || 0,
          cart_total: window.shopifyData.cart?.total_price || 0,
          cart_items_detail: window.shopifyData.cart?.items || []
        });
      }
      
      // 2. TRACKING DE ADD TO CART
      document.addEventListener('submit', (e) => {
        const form = e.target;
        
        // Formulário de produto
        if (form.matches('[action*="/cart/add"], .product-form, form[action*="cart"]')) {
          const formData = new FormData(form);
          const variantId = formData.get('id') || formData.get('variant_id');
          const quantity = formData.get('quantity') || 1;
          
          tracker.trackCustomEvent('add_to_cart_attempt', {
            product_id: window.shopifyData?.product?.id,
            variant_id: variantId,
            quantity: parseInt(quantity),
            product_handle: window.shopifyData?.product?.handle,
            product_title: window.shopifyData?.product?.title,
            form_action: form.action,
            trigger_element: 'form_submit'
          });
          
          // Aguardar resposta e trackear sucesso
          setTimeout(() => {
            this.checkCartChange('add_to_cart');
          }, 1500);
        }
      });
      
      // 3. TRACKING DE BOTÕES ADD TO CART (AJAX)
      document.addEventListener('click', (e) => {
        const button = e.target;
        
        if (button.matches('.btn-add-to-cart, [data-add-to-cart], .product-form__cart-submit, .btn[type="submit"]')) {
          const form = button.closest('form');
          
          if (form && form.matches('[action*="/cart/add"]')) {
            tracker.trackCustomEvent('add_to_cart_click', {
              product_id: window.shopifyData?.product?.id,
              button_text: button.textContent?.trim(),
              button_classes: button.className,
              trigger_element: 'button_click'
            });
          }
        }
        
        // Botões de quantidade no carrinho
        if (button.matches('.qty-btn, .cart-item__quantity-btn, [data-quantity-change]')) {
          const action = button.getAttribute('data-action') || 
                        (button.textContent.includes('+') ? 'increase' : 'decrease');
          
          tracker.trackCustomEvent('shopify_cart_quantity_change', {
            action: action,
            trigger_element: 'quantity_button'
          });
          
          setTimeout(() => {
            this.checkCartChange('quantity_change');
          }, 1000);
        }
        
        // Botões de remoção do carrinho
        if (button.matches('.cart-remove, [data-cart-remove], .cart-item__remove')) {
          tracker.trackCustomEvent('shopify_cart_remove_attempt', {
            trigger_element: 'remove_button'
          });
          
          setTimeout(() => {
            this.checkCartChange('remove_item');
          }, 1000);
        }
      });
    },
    
	setupCartTracking: function() {
		const tracker = window.InfluencerTracker;
		console.log('🛒 Setup cart tracking (sem AJAX interception)');
		
		// ========== MUTATION OBSERVER OTIMIZADO ==========
		const cartObserver = new MutationObserver((mutations) => {
		  let shouldCheck = false;
		  
		  mutations.forEach((mutation) => {
			// Verificar apenas mudanças relevantes
			if (mutation.type === 'childList') {
			  const relevantChanges = [...mutation.addedNodes, ...mutation.removedNodes]
				.some(node => {
				  if (node.nodeType !== Node.ELEMENT_NODE) return false;
				  
				  return (
					node.matches?.('[data-cart-item], .cart-item, .line-item') ||
					node.querySelector?.('[data-cart-item], .cart-item, .line-item') ||
					node.classList?.contains('cart-item')
				  );
				});
			  
			  if (relevantChanges) shouldCheck = true;
			}
			
			// Mudanças em atributos de carrinho
			if (mutation.type === 'attributes') {
			  const cartAttributes = ['data-cart-item', 'data-quantity', 'data-cart-total'];
			  if (cartAttributes.includes(mutation.attributeName)) {
				shouldCheck = true;
			  }
			}
		  });
		  
		  if (shouldCheck) {
			this.checkCartChange('dom_mutation');
		  }
		});
		
		// ========== CONTAINERS PARA OBSERVAR ==========
		const cartContainers = [
		  '[data-cart-container]',
		  '.cart-drawer',
		  '.mini-cart', 
		  '.cart-items',
		  '.cart',
		  '.cart-form'
		];
		
		let observedContainers = 0;
		
		cartContainers.forEach(selector => {
		  const container = document.querySelector(selector);
		  if (container) {
			cartObserver.observe(container, {
			  childList: true,
			  subtree: true,
			  attributes: true,
			  attributeFilter: ['data-cart-item', 'data-quantity', 'data-cart-total']
			});
			observedContainers++;
			console.log(`👀 Observando container: ${selector}`);
		  }
		});
		
		// Fallback: observar body se nenhum container específico
		if (observedContainers === 0) {
		  cartObserver.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['data-cart-item', 'data-quantity', 'data-cart-total']
		  });
		  console.log('👀 Observando body como fallback');
		}
		
		// ========== EVENT LISTENERS ESPECÍFICOS ==========
		
		// 1. Form submits (add to cart, update cart)
		document.addEventListener('submit', (e) => {
		  const form = e.target;
		  
		  if (form.matches('[action*="/cart/add"], [action*="/cart/update"], .cart-form')) {
			console.log('📝 Form submit detectado:', form.action);
			
			// Aguardar processamento e verificar mudanças
			setTimeout(() => {
			  this.checkCartChange('form_submit');
			}, 1500);
		  }
		});
		
		// 2. Quantity input changes
		document.addEventListener('change', (e) => {
		  if (e.target.matches('input[name*="quantity"], .cart-quantity, .qty-input')) {
			console.log('🔢 Quantity change detectado');
			
			// Debounce para evitar múltiplos triggers
			if (this.quantityChangeTimeout) {
			  clearTimeout(this.quantityChangeTimeout);
			}
			
			this.quantityChangeTimeout = setTimeout(() => {
			  this.checkCartChange('quantity_change');
			}, 1000);
		  }
		});
		
		// 3. Button clicks (quantity +/-, remove, etc.)
		document.addEventListener('click', (e) => {
		  const button = e.target;
		  
		  // Botões de quantidade
		  if (button.matches('.qty-btn, [data-quantity-change]')) {
			console.log('🔘 Quantity button clicked');
			setTimeout(() => {
			  this.checkCartChange('quantity_button');
			}, 500);
		  }
		  
		  // Botões de remoção
		  if (button.matches('.cart-remove, [data-cart-remove]')) {
			console.log('🗑️ Remove button clicked');
			setTimeout(() => {
			  this.checkCartChange('item_remove');
			}, 1000);
		  }
		  
		  // Add to cart buttons
		  if (button.matches('.btn-add-to-cart, [data-add-to-cart], .product-form__cart-submit')) {
			console.log('➕ Add to cart button clicked');
			setTimeout(() => {
			  this.checkCartChange('add_to_cart');
			}, 2000);
		  }
		});
		
		// ========== VERIFICAÇÃO PERIÓDICA ==========
		// Como fallback, verificar carrinho periodicamente
		setInterval(() => {
		  this.checkCartChange('periodic_check');
		}, 45000); // A cada 45 segundos
		
		// ========== ESTADO INICIAL ==========
		this.lastCartState = {
		  items: this.getCartItemCount(),
		  value: this.getCartValue()
		};
		
		console.log('🛒 Estado inicial do carrinho:', this.lastCartState);
		console.log(`✅ Cart tracking ativo (${observedContainers} containers observados)`);
	},
    
    setupProductTracking: function() {
      const tracker = window.InfluencerTracker;
      
      // Intersection Observer para produtos visíveis
      const productObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target;
            
            tracker.trackCustomEvent('product_impression', {
              product_id: element.getAttribute('data-product-id'),
              product_handle: element.getAttribute('data-product-handle'),
              product_title: element.getAttribute('data-product-title'),
              product_price: element.getAttribute('data-product-price'),
              visibility_percent: Math.round(entry.intersectionRatio * 100),
              element_position: this.getElementPosition(element)
            });
          }
        });
      }, { threshold: 0.5 });
      
      // Observar produtos na página
      const productSelectors = [
        '[data-product-id]',
        '.product-item',
        '.product-card',
        '.grid-product',
        '.product-grid-item'
      ];
      
      productSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          productObserver.observe(el);
        });
      });
      
      // Tracking de cliques em produtos
      document.addEventListener('click', (e) => {
        const element = e.target;
        const productElement = element.closest('[data-product-id], .product-item, .product-card');
        
        if (productElement) {
          tracker.trackCustomEvent('product_click', {
            product_id: productElement.getAttribute('data-product-id'),
            product_handle: productElement.getAttribute('data-product-handle'),
            product_title: productElement.getAttribute('data-product-title'),
            click_element: element.tagName,
            click_text: element.textContent?.substring(0, 50)
          });
        }
      });
      
      // Tracking de variant selection
      document.addEventListener('change', (e) => {
        if (e.target.matches('select[name="id"], input[name="id"], .product-form__variants select')) {
          const selectedVariant = e.target.value;
          
          tracker.trackCustomEvent('variant_selection', {
            product_id: window.shopifyData?.product?.id,
            variant_id: selectedVariant,
            selection_method: e.target.tagName.toLowerCase()
          });
        }
      });
    },
    
    setupCheckoutTracking: function() {
      const tracker = window.InfluencerTracker;
      
      // Detectar início do checkout
      document.addEventListener('click', (e) => {
        const button = e.target;
        
        if (button.matches('.btn-checkout, [data-checkout], .checkout-button, [href*="/checkout"]')) {
          tracker.trackCustomEvent('checkout_initiated', {
            cart_items: this.getCartItemCount(),
            cart_value: this.getCartValue(),
            checkout_method: button.tagName === 'A' ? 'link' : 'button',
            button_text: button.textContent?.trim()
          });
        }
      });
      
      // Tracking na página de checkout
      if (window.location.pathname.includes('/checkout')) {
        tracker.trackCustomEvent('checkout_page_view', {
          checkout_step: this.getCheckoutStep(),
          cart_items: this.getCartItemCount(),
          cart_value: this.getCartValue()
        });
        
        // Tracking de steps do checkout
        this.setupCheckoutStepTracking();
      }
      
      // Tracking de thank you page
      if (window.location.pathname.includes('/thank_you') || 
          window.location.pathname.includes('/orders/')) {
        this.trackPurchaseCompletion();
      }
    },
    
    setupCheckoutStepTracking: function() {
      const tracker = window.InfluencerTracker;
      
      // Observer para mudanças no checkout
      const checkoutObserver = new MutationObserver(() => {
        const currentStep = this.getCheckoutStep();
        
        if (this.lastCheckoutStep !== currentStep) {
          tracker.trackCustomEvent('shopify_checkout_step_change', {
            previous_step: this.lastCheckoutStep,
            current_step: currentStep,
            cart_items: this.getCartItemCount(),
            cart_value: this.getCartValue()
          });
          
          this.lastCheckoutStep = currentStep;
        }
      });
      
      const checkoutContainer = document.querySelector('.checkout, #checkout, .main-content') || document.body;
      checkoutObserver.observe(checkoutContainer, { childList: true, subtree: true });
    },
    
    // ========== FUNÇÕES AUXILIARES ==========
    checkCartChange: function(trigger) {
      if (this.cartUpdateTimeout) {
        clearTimeout(this.cartUpdateTimeout);
      }
      
      this.cartUpdateTimeout = setTimeout(() => {
        const currentState = {
          items: this.getCartItemCount(),
          value: this.getCartValue()
        };
        
        // Só dispara se houver mudança real
        if (!this.lastCartState || 
            currentState.items !== this.lastCartState.items || 
            Math.abs(currentState.value - this.lastCartState.value) > 0.01) {
          
          console.log('🛒 Cart mudou:', this.lastCartState, '→', currentState);
          
          window.InfluencerTracker.track('cart_update', {
            cart_items: currentState.items,
            cart_value: currentState.value,
            previous_items: this.lastCartState?.items || 0,
            previous_value: this.lastCartState?.value || 0,
            change_trigger: trigger,
            change_type: currentState.items > (this.lastCartState?.items || 0) ? 'add' : 
                        currentState.items < (this.lastCartState?.items || 0) ? 'remove' : 'update'
          });
          
          this.lastCartState = currentState;
        }
      }, 1000);
    },
    
    getCheckoutStep: function() {
      if (document.querySelector('.step-contact, [data-step="contact"]')) return 'contact';
      if (document.querySelector('.step-shipping, [data-step="shipping"]')) return 'shipping';
      if (document.querySelector('.step-payment, [data-step="payment"]')) return 'payment';
      if (document.querySelector('.step-review, [data-step="review"]')) return 'review';
      return 'unknown';
    },
    
    getElementPosition: function(element) {
      const rect = element.getBoundingClientRect();
      return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      };
    },
    
    trackPurchaseCompletion: function() {
      const tracker = window.InfluencerTracker;
      
      // Tentar extrair dados do pedido da página
      const orderData = this.extractOrderData();
      
      tracker.trackCustomEvent('purchase_completed', {
        ...orderData,
        influencer_attribution: JSON.parse(sessionStorage.getItem('inf_attribution') || 'null'),
        page_url: window.location.href
      });
      
      // Também usar o método público do tracker
      if (orderData.order_id) {
        tracker.trackPurchase({
          orderId: orderData.order_id,
          totalValue: orderData.total_value,
          currency: orderData.currency,
          items: orderData.items,
          couponCode: orderData.coupon_code
        });
      }
    },
    
    extractOrderData: function() {
      // Tentar extrair dados do Shopify
      if (window.Shopify?.checkout) {
        return {
          order_id: window.Shopify.checkout.order_id,
          total_value: window.Shopify.checkout.total_price / 100,
          currency: window.Shopify.checkout.currency,
          items: window.Shopify.checkout.line_items,
          coupon_code: window.Shopify.checkout.discount?.code
        };
      }
      
      // Fallback: tentar extrair do DOM
      const orderNumber = document.querySelector('.order-number, [data-order-number]')?.textContent;
      const totalElement = document.querySelector('.total-price, [data-total-price]');
      const total = totalElement ? this.parseCartValue(totalElement.textContent) : 0;
      
      return {
        order_id: orderNumber,
        total_value: total,
        currency: 'USD', // Fallback
        items: [],
        coupon_code: null
      };
    }
  };

})(window, document);