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
    // Use h-full instead of h-[100dvh] since it will be inside the layout container
    <div className="flex h-full overflow-hidden">
      <div className="hidden w-80 border-r md:block overflow-hidden">
        <UserList onSelectUser={setSelectedUser} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <UserHeader user={selectedUser} />
        <ChatWindow selectedUser={selectedUser} />
      </div>
    </div>
  );
}
