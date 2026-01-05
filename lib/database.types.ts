export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    graphql_public: {
        Tables: Record<string, never>
        Views: Record<string, never>
        Functions: {
            graphql: {
                Args: {
                    operationName?: string
                    query?: string
                    variables?: Json
                    extensions?: Json
                }
                Returns: Json
            }
        }
        Enums: Record<string, never>
        CompositeTypes: Record<string, never>
    }
    public: {
        Tables: {
            appointments: {
                Row: {
                    id: string
                    user_id: string
                    client_id: string | null
                    service_id: string | null
                    start_time: string
                    end_time: string
                    status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
                    price: number | null
                    notes: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    client_id?: string | null
                    service_id?: string | null
                    start_time: string
                    end_time: string
                    status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
                    price?: number | null
                    notes?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    client_id?: string | null
                    service_id?: string | null
                    start_time?: string
                    end_time?: string
                    status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
                    price?: number | null
                    notes?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "appointments_client_id_fkey"
                        columns: ["client_id"]
                        isOneToOne: false
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "appointments_service_id_fkey"
                        columns: ["service_id"]
                        isOneToOne: false
                        referencedRelation: "services"
                        referencedColumns: ["id"]
                    }
                ]
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    message: string
                    type: 'success' | 'error' | 'warning' | 'info'
                    read: boolean
                    action_type: string | null
                    action_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    message: string
                    type?: 'success' | 'error' | 'warning' | 'info'
                    read?: boolean
                    action_type?: string | null
                    action_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    message?: string
                    type?: 'success' | 'error' | 'warning' | 'info'
                    read?: boolean
                    action_type?: string | null
                    action_id?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            clients: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    email: string | null
                    phone: string | null
                    notes: string | null
                    last_visit: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    email?: string | null
                    phone?: string | null
                    notes?: string | null
                    last_visit?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    email?: string | null
                    phone?: string | null
                    notes?: string | null
                    last_visit?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            services: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    description: string | null
                    price: number
                    duration_minutes: number
                    active: boolean
                    category: string | null
                    images: string[] | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    description?: string | null
                    price?: number
                    duration_minutes?: number
                    active?: boolean
                    category?: string | null
                    images?: string[] | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    description?: string | null
                    price?: number
                    duration_minutes?: number
                    active?: boolean
                    category?: string | null
                    images?: string[] | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            profiles: {
                Row: {
                    id: string
                    name: string | null
                    email: string | null
                    phone: string | null
                    avatar_url: string | null
                    business_name: string | null
                    bio: string | null
                    address: string | null
                    website: string | null
                    instagram: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    name?: string | null
                    email?: string | null
                    phone?: string | null
                    avatar_url?: string | null
                    business_name?: string | null
                    bio?: string | null
                    address?: string | null
                    website?: string | null
                    instagram?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    name?: string | null
                    email?: string | null
                    phone?: string | null
                    avatar_url?: string | null
                    business_name?: string | null
                    bio?: string | null
                    address?: string | null
                    website?: string | null
                    instagram?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            business_settings: {
                Row: {
                    id: string
                    user_id: string
                    business_hours: Json
                    notification_email: boolean
                    notification_whatsapp: boolean
                    notification_sms: boolean
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    business_hours?: Json
                    notification_email?: boolean
                    notification_whatsapp?: boolean
                    notification_sms?: boolean
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    business_hours?: Json
                    notification_email?: boolean
                    notification_whatsapp?: boolean
                    notification_sms?: boolean
                    updated_at?: string | null
                }
                Relationships: []
            }
        }
        Views: Record<string, never>
        Functions: Record<string, never>
        Enums: Record<string, never>
        CompositeTypes: Record<string, never>
    }
}

// Helper types for easier use
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export type BusinessSettings = Database['public']['Tables']['business_settings']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type ServiceInsert = Database['public']['Tables']['services']['Insert']
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
