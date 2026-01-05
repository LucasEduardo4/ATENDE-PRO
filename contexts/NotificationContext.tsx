'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    read: boolean;
    action_type?: string;
    action_id?: string;
    created_at: string;
}

export interface Toast {
    id: string;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    toasts: Toast[];
    showToast: (title: string, message: string, type?: Toast['type']) => void;
    addNotification: (title: string, message: string, type?: Notification['type'], actionType?: string, actionId?: string) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    loadNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const supabase = createClient();

    const loadNotifications = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (!error && data) {
            setNotifications(data);
        }
    }, [supabase]);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const showToast = useCallback((title: string, message: string, type: Toast['type'] = 'success') => {
        const id = Date.now().toString();
        const toast: Toast = { id, title, message, type };

        setToasts(prev => [...prev, toast]);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const addNotification = useCallback(async (
        title: string,
        message: string,
        type: Notification['type'] = 'success',
        actionType?: string,
        actionId?: string
    ) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: user.id,
                title,
                message,
                type,
                action_type: actionType,
                action_id: actionId,
            } as any)
            .select()
            .single();

        if (!error && data) {
            setNotifications(prev => [data, ...prev]);
        }

        // Also show a toast
        showToast(title, message, type);
    }, [supabase, showToast]);

    const markAsRead = useCallback(async (id: string) => {
        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);

        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    }, [supabase]);

    const markAllAsRead = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false);

        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, [supabase]);

    const deleteNotification = useCallback(async (id: string) => {
        await supabase
            .from('notifications')
            .delete()
            .eq('id', id);

        setNotifications(prev => prev.filter(n => n.id !== id));
    }, [supabase]);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            toasts,
            showToast,
            addNotification,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            loadNotifications,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
