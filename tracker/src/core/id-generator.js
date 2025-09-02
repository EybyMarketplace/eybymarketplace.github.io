import { CONFIG } from './config.js';

export class IdGenerator {
    static generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    static getUserId() {
        let userId = localStorage.getItem('inf_user_id');
        if (!userId) {
            userId = this.generateUUID();
            localStorage.setItem('inf_user_id', userId);
        }
        return userId;
    }
    
    static getSessionId() {
        let sessionData = sessionStorage.getItem('inf_session');
        
        if (sessionData) {
            const session = JSON.parse(sessionData);
            const now = Date.now();
            
            // Verifica se a sessão não expirou
            if (now - session.lastActivity < CONFIG.sessionTimeout) {
                session.lastActivity = now;
                sessionStorage.setItem('inf_session', JSON.stringify(session));
                return session.id;
            }
        }
        
        // Cria nova sessão
        const newSession = {
            id: this.generateUUID(),
            startTime: Date.now(),
            lastActivity: Date.now()
        };
        
        sessionStorage.setItem('inf_session', JSON.stringify(newSession));
        return newSession.id;
    }
}