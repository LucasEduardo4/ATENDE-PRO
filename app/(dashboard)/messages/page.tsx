'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import './messages.css';

interface Conversation {
    id: string;
    other_user: {
        id: string;
        name: string;
        business_name: string;
        avatar_url: string;
    };
    last_message: string;
    last_message_at: string;
    unread_count: number;
}

interface Message {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
    read: boolean;
}

export default function MessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        if (activeConversation) {
            loadMessages(activeConversation);
        }
    }, [activeConversation]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadConversations = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setCurrentUserId(user.id);

        // Get conversations
        const { data: convData } = await supabase
            .from('conversations')
            .select('*')
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
            .order('last_message_at', { ascending: false });

        if (!convData) {
            setLoading(false);
            return;
        }

        // Get other users' profiles
        const otherUserIds = convData.map(c =>
            c.user1_id === user.id ? c.user2_id : c.user1_id
        );

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, business_name, avatar_url')
            .in('id', otherUserIds);

        // Get last messages and unread counts
        const conversationsWithDetails: Conversation[] = await Promise.all(
            convData.map(async (conv) => {
                const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
                const otherUser = profiles?.find(p => p.id === otherUserId) || {
                    id: otherUserId,
                    name: 'Usuário',
                    business_name: '',
                    avatar_url: '',
                };

                const { data: lastMsg } = await supabase
                    .from('messages')
                    .select('content')
                    .eq('conversation_id', conv.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                const { count } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('conversation_id', conv.id)
                    .eq('read', false)
                    .neq('sender_id', user.id);

                return {
                    id: conv.id,
                    other_user: otherUser,
                    last_message: lastMsg?.content || '',
                    last_message_at: conv.last_message_at,
                    unread_count: count || 0,
                };
            })
        );

        setConversations(conversationsWithDetails);
        setLoading(false);
    };

    const loadMessages = async (conversationId: string) => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        setMessages(data || []);

        // Mark messages as read
        await supabase
            .from('messages')
            .update({ read: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', currentUserId);

        // Update unread count
        setConversations(prev =>
            prev.map(c => c.id === conversationId ? { ...c, unread_count: 0 } : c)
        );
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !activeConversation || !currentUserId) return;
        setSending(true);

        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: activeConversation,
                sender_id: currentUserId,
                content: newMessage,
            })
            .select()
            .single();

        if (!error && data) {
            setMessages([...messages, data]);
            setNewMessage('');

            await supabase
                .from('conversations')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', activeConversation);

            setConversations(prev =>
                prev.map(c => c.id === activeConversation
                    ? { ...c, last_message: newMessage, last_message_at: new Date().toISOString() }
                    : c
                ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
            );
        }

        setSending(false);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

        if (diffDays === 0) {
            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Ontem';
        } else if (diffDays < 7) {
            return date.toLocaleDateString('pt-BR', { weekday: 'short' });
        }
        return date.toLocaleDateString('pt-BR');
    };

    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
    };

    const activeConv = conversations.find(c => c.id === activeConversation);

    return (
        <div className="messages-page">
            {/* Conversations List */}
            <div className="conversations-panel">
                <div className="panel-header">
                    <h2>Mensagens</h2>
                </div>
                <div className="conversations-list">
                    {loading ? (
                        <div className="loading">Carregando...</div>
                    ) : conversations.length > 0 ? (
                        conversations.map(conv => (
                            <button
                                key={conv.id}
                                className={`conversation-item ${activeConversation === conv.id ? 'active' : ''}`}
                                onClick={() => setActiveConversation(conv.id)}
                            >
                                <div className="conv-avatar">
                                    {conv.other_user.avatar_url ? (
                                        <img src={conv.other_user.avatar_url} alt="" />
                                    ) : (
                                        getInitials(conv.other_user.business_name || conv.other_user.name)
                                    )}
                                </div>
                                <div className="conv-info">
                                    <div className="conv-name">
                                        {conv.other_user.business_name || conv.other_user.name}
                                    </div>
                                    <div className="conv-preview">{conv.last_message}</div>
                                </div>
                                <div className="conv-meta">
                                    <div className="conv-time">{formatTime(conv.last_message_at)}</div>
                                    {conv.unread_count > 0 && (
                                        <div className="conv-badge">{conv.unread_count}</div>
                                    )}
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="empty-conversations">
                            <span className="empty-icon">💬</span>
                            <p>Nenhuma conversa ainda</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Panel */}
            <div className="chat-panel">
                {activeConv ? (
                    <>
                        <div className="chat-header">
                            <div className="chat-avatar">
                                {activeConv.other_user.avatar_url ? (
                                    <img src={activeConv.other_user.avatar_url} alt="" />
                                ) : (
                                    getInitials(activeConv.other_user.business_name || activeConv.other_user.name)
                                )}
                            </div>
                            <div className="chat-info">
                                <h3>{activeConv.other_user.business_name || activeConv.other_user.name}</h3>
                            </div>
                        </div>

                        <div className="chat-messages">
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`message ${msg.sender_id === currentUserId ? 'sent' : 'received'}`}
                                >
                                    <div className="message-content">{msg.content}</div>
                                    <div className="message-time">{formatTime(msg.created_at)}</div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="chat-input">
                            <input
                                type="text"
                                placeholder="Digite sua mensagem..."
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && sendMessage()}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={sendMessage}
                                disabled={sending || !newMessage.trim()}
                            >
                                {sending ? '...' : '➤'}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="empty-chat">
                        <span className="empty-icon">💬</span>
                        <h3>Selecione uma conversa</h3>
                        <p>Escolha uma conversa da lista para ver as mensagens</p>
                    </div>
                )}
            </div>
        </div>
    );
}
