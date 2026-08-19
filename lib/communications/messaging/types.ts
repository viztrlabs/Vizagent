// M16: In-App Messaging Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'user' | 'admin' | 'system' | 'agent';
  content: string;
  messageType: 'text' | 'file' | 'system' | 'approval_request';
  metadata?: Record<string, unknown>;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'project' | 'support' | 'team';
  title?: string;
  projectId?: string;
  participantIds: string[];
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
}

export interface CreateConversationParams {
  type: Conversation['type'];
  participantIds: string[];
  projectId?: string;
  title?: string;
  initialMessage?: string;
}

export interface SendMessageParams {
  conversationId: string;
  senderId: string;
  senderType: Message['senderType'];
  content: string;
  messageType?: Message['messageType'];
  metadata?: Record<string, unknown>;
}