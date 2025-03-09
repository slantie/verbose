"use client";

import { useState } from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { UserHeader } from "@/components/chat/UserHeader";
import { UserList } from "@/components/chat/UserList";

interface ChatUser {
  id: string;
  username: string;
  email: string;
  isOnline?: boolean;
}

export default function ChatPage() {
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden w-80 border-r md:block">
        <UserList onSelectUser={setSelectedUser} />
      </div>
      <div className="flex flex-1 flex-col">
        <UserHeader user={selectedUser} />
        <ChatWindow selectedUser={selectedUser} />
      </div>
    </div>
  );
}
