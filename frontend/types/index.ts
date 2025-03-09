export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status?: "online" | "offline" | "away";
  lastSeen?: Date;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: Date;
  read: boolean;
}

export interface Chat {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
}