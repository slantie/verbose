"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatListProps {
  onSelectChat?: () => void;
}

export function ChatList({ onSelectChat }: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const chats = [
    {
      id: "1",
      name: "John Doe",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      lastMessage: "Hello there! How are you doing today?",
      timestamp: "10:30 AM",
      unread: 2,
      isActive: true,
    },
    {
      id: "2",
      name: "Jane Smith",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      lastMessage: "Can we meet tomorrow?",
      timestamp: "Yesterday",
      unread: 0,
      isActive: false,
    },
    {
      id: "3",
      name: "Mike Johnson",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      lastMessage: "I'll send you the documents later",
      timestamp: "Yesterday",
      unread: 0,
      isActive: false,
    },
    {
      id: "4",
      name: "Sarah Williams",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      lastMessage: "Thanks for your help!",
      timestamp: "Monday",
      unread: 0,
      isActive: false,
    },
    {
      id: "5",
      name: "David Brown",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      lastMessage: "Let's discuss the project tomorrow",
      timestamp: "Monday",
      unread: 0,
      isActive: false,
    },
  ];

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search chats..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-2">
        <h2 className="text-sm font-semibold">Recent Chats</h2>
        <Button variant="ghost" size="icon">
          <Plus className="h-4 w-4" />
          <span className="sr-only">New chat</span>
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {filteredChats.map((chat) => (
            <button
              key={chat.id}
              className={`flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-left ${
                chat.isActive
                  ? "bg-accent"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
              onClick={onSelectChat}
            >
              <div className="relative">
                <Avatar>
                  <AvatarImage src={chat.avatar} alt={chat.name} />
                  <AvatarFallback>
                    {chat.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                {chat.unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {chat.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 truncate">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{chat.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {chat.timestamp}
                  </span>
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {chat.lastMessage}
                </p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}