/*!
 * Influencer Tracker - ID Generator Module
 */
(function(window) {
    'use strict';
    
    window.CommerceTracker = window.CommerceTracker || {};
    
    window.CommerceTracker.IdGenerator = {
        // Chaves de armazenamento
        USER_ID_KEY: 'inf_user_id',
        SESSION_KEY: 'inf_session',
        
        // Gerar UUID v4
        generateUUID: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },
        
        // Obter ou criar User ID persistente
        getUserId: function() {
            let userId = localStorage.getItem(this.USER_ID_KEY);
            if (!userId) {
                userId = this.generateUUID();
                localStorage.setItem(this.USER_ID_KEY, userId);
            }
            return userId;
        },
        
        // Obter ou criar Session ID
        getSessionId: function() {
            let sessionData = sessionStorage.getItem(this.SESSION_KEY);
            const config = window.CommerceTracker.Config;
            const sessionTimeout = config.get('sessionTimeout');
            
            if (sessionData) {
                try {
                    const session = JSON.parse(sessionData);
                    const now = Date.now();
                    
                    // Verificar se a sessão não expirou
                    if (now - session.lastActivity < sessionTimeout) {
                        session.lastActivity = now;
                        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
                        return session.id;
                    }
                } catch (error) {
                    console.warn('Invalid session data, creating new session');
                }
            }
            
            // Criar nova sessão
            const newSession = {
                id: this.generateUUID(),
                startTime: Date.now(),
                lastActivity: Date.now()
            };
            
            sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(newSession));
            return newSession.id;
        },
        
        // Obter informações da sessão atual
        getSessionInfo: function() {
            const sessionData = sessionStorage.getItem(this.SESSION_KEY);
            if (sessionData) {
                try {
                    return JSON.parse(sessionData);
                } catch (error) {
                    return null;
                }
            }
            return null;
        },
        
        // Invalidar sessão atual
        invalidateSession: function() {
            sessionStorage.removeItem(this.SESSION_KEY);
        }
    };
    
    console.log('🆔 IdGenerator module loaded');
    
})(window);