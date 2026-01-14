export interface User {
  id: string;
  name: string;
  avatar?: string;
  status?: "online" | "offline" | "away";
}

export interface Message {
  id: string;
  content: string;
  sender: User;
  timestamp: Date;
  status?: "sending" | "sent" | "delivered" | "read";
}

export interface Conversation {
  id: string;
  name?: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
  isGroup?: boolean;
}
