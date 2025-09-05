/*!
 * Influencer Tracker - Configuration Module
 */
(function(window) {
    'use strict';
    
    // Criar namespace se não existir
    window.CommerceTracker = window.CommerceTracker || {};
    
    // Módulo de Configuração
    window.CommerceTracker.Config = {
        // Configurações padrão
        defaults: {
            apiEndpoint: '',
            projectId: '',
            enableConsentCheck: true,
            platform: '',
            batchSize: 10,
            batchTimeout: 3000,
            sessionTimeout: 30 * 60 * 1000, // 30 minutos
            version: '2.0.0'
        },
        
        // Configurações atuais
        current: {},
        
        // Inicializar com valores padrão
        init: function() {
            this.current = Object.assign({}, this.defaults);
        },
        
        // Atualizar configurações
        update: function(options = {}) {
            Object.assign(this.current, options);
        },
        
        // Obter configuração específica
        get: function(key) {
            return this.current[key];
        },
        
        // Obter todas as configurações
        getAll: function() {
            return Object.assign({}, this.current);
        },
        
        // Verificar se está configurado corretamente
        isValid: function() {
            return !!(this.current.apiEndpoint && this.current.projectId);
        }
    };
    
    // Auto-inicializar
    window.CommerceTracker.Config.init();
    
    console.log('📋 Config module loaded');
    
})(window);