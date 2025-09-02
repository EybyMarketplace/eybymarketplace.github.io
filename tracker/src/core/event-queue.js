import { CONFIG } from './config.js';

export class EventQueue {
    constructor() {
        this.queue = [];
        this.flushTimer = null;
    }
    
    add(event) {
        this.queue.push(event);
        
        if (this.queue.length >= CONFIG.batchSize) {
            this.flush();
        }
    }
    
    flush() {
        if (this.queue.length === 0 || !CONFIG.apiEndpoint) return;
        
        const events = this.queue.splice(0, CONFIG.batchSize);
        
        // Envia para API
        fetch(CONFIG.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                project_id: CONFIG.projectId,
                events: events,
                version: CONFIG.version
            })
        }).catch(error => {
            console.warn('Influencer Tracker: Failed to send events', error);
            // Salva no localStorage como fallback
            const stored = JSON.parse(localStorage.getItem('inf_failed_events') || '[]');
            stored.push(...events);
            localStorage.setItem('inf_failed_events', JSON.stringify(stored.slice(-100))); // Máximo 100 eventos
        });
    }
    
    scheduleFlush() {
        if (this.flushTimer) clearTimeout(this.flushTimer);
        this.flushTimer = setTimeout(() => this.flush(), CONFIG.batchTimeout);
    }
}