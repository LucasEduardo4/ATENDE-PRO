'use client';

import { useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import './NotificationDropdown.css';

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `${diffMins}min atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays < 7) return `${diffDays}d atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return '✓';
            case 'error': return '✕';
            case 'warning': return '⚠';
            case 'info': return 'ℹ';
            default: return '📋';
        }
    };

    return (
        <div className="notification-dropdown-wrapper">
            <button
                className="notification-trigger"
                onClick={() => setIsOpen(!isOpen)}
            >
                🔔
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="notification-backdrop" onClick={() => setIsOpen(false)} />
                    <div className="notification-dropdown">
                        <div className="notification-header">
                            <h3>Notificações</h3>
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead} className="mark-all-read">
                                    Marcar todas como lidas
                                </button>
                            )}
                        </div>

                        <div className="notification-list">
                            {notifications.length > 0 ? (
                                notifications.slice(0, 10).map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        <div className={`notification-icon ${notification.type}`}>
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="notification-content">
                                            <div className="notification-title">{notification.title}</div>
                                            <div className="notification-message">{notification.message}</div>
                                            <div className="notification-time">{formatTime(notification.created_at)}</div>
                                        </div>
                                        <button
                                            className="notification-delete"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notification.id);
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="notification-empty">
                                    <span className="empty-icon">🔔</span>
                                    <p>Nenhuma notificação</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
