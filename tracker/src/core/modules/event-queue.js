/*!
 * Influencer Tracker - Event Queue Module
 */
(function(window) {
    'use strict';
    
    window.InfluencerTracker = window.InfluencerTracker || {};
    
    window.InfluencerTracker.EventQueue = {
        // Propriedades da fila
        queue: [],
        flushTimer: null,
        isOnline: navigator.onLine,
        
        // Chaves de armazenamento
        FAILED_EVENTS_KEY: 'inf_failed_events',
        
        // Inicializar
        init: function() {
            this.setupNetworkListeners();
            this.retryFailedEvents();
        },
        
        // Configurar listeners de rede
        setupNetworkListeners: function() {
            const self = this;
            
            window.addEventListener('online', function() {
                self.isOnline = true;
                self.retryFailedEvents();
                if (self.queue.length > 0) {
                    self.flush();
                }
            });
            
            window.addEventListener('offline', function() {
                self.isOnline = false;
            });
        },
        
        // Adicionar evento à fila
        add: function(event) {
            this.queue.push(event);
            
            const config = window.InfluencerTracker.Config;
            const batchSize = config.get('batchSize');
            
            if (this.queue.length >= batchSize) {
                this.flush();
            } else {
                this.scheduleFlush();
            }
        },
        
        // Agendar flush automático
        scheduleFlush: function() {
            if (this.flushTimer) {
                clearTimeout(this.flushTimer);
            }
            
            const config = window.InfluencerTracker.Config;
            const batchTimeout = config.get('batchTimeout');
            
            this.flushTimer = setTimeout(() => {
                this.flush();
            }, batchTimeout);
        },
        
        // Enviar eventos para API
        flush: function() {
            if (this.queue.length === 0) return Promise.resolve();
            
            const config = window.InfluencerTracker.Config;
            const apiEndpoint = config.get('apiEndpoint');
            const projectId = config.get('projectId');
            
            if (!apiEndpoint) {
                console.warn('Influencer Tracker: API endpoint not configured');
                return Promise.reject(new Error('API endpoint not configured'));
            }
            
            const events = this.queue.splice(0, config.get('batchSize'));
            
            const payload = {
                project_id: projectId,
                events: events,
                version: config.get('version'),
                timestamp: Date.now()
            };
            
            return this.sendEvents(payload, events);
        },
        
        // Enviar eventos via fetch
        sendEvents: function(payload, originalEvents) {
            const config = window.InfluencerTracker.Config;
            
            return fetch(config.get('apiEndpoint'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .catch(error => {
                console.warn('Influencer Tracker: Failed to send events', error);
                this.saveFailedEvents(originalEvents);
                throw error;
            });
        },
        
        // Salvar eventos que falharam
        saveFailedEvents: function(events) {
            try {
                const stored = JSON.parse(localStorage.getItem(this.FAILED_EVENTS_KEY) || '[]');
                stored.push(...events);
                
                // Manter apenas os últimos 100 eventos para evitar overflow
                const limited = stored.slice(-100);
                localStorage.setItem(this.FAILED_EVENTS_KEY, JSON.stringify(limited));
            } catch (error) {
                console.warn('Failed to save failed events:', error);
            }
        },
        
        // Tentar reenviar eventos que falharam
        retryFailedEvents: function() {
            if (!this.isOnline) return;
            
            try {
                const failedEvents = JSON.parse(localStorage.getItem(this.FAILED_EVENTS_KEY) || '[]');
                
                if (failedEvents.length > 0) {
                    console.log(`Retrying ${failedEvents.length} failed events`);
                    
                    // Adicionar de volta à fila
                    this.queue.unshift(...failedEvents);
                    
                    // Limpar storage
                    localStorage.removeItem(this.FAILED_EVENTS_KEY);
                    
                    // Tentar enviar
                    this.flush();
                }
            } catch (error) {
                console.warn('Error retrying failed events:', error);
            }
        },
        
        // Obter tamanho da fila
        getQueueSize: function() {
            return this.queue.length;
        },
        
        // Limpar fila
        clear: function() {
            this.queue = [];
            if (this.flushTimer) {
                clearTimeout(this.flushTimer);
                this.flushTimer = null;
            }
        },
        
        // Forçar flush imediato
        forceFlush: function() {
            if (this.flushTimer) {
                clearTimeout(this.flushTimer);
                this.flushTimer = null;
            }
            return this.flush();
        }
    };
    
    console.log('📤 EventQueue module loaded');
    
})(window);