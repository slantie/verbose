"use client";

import { MoreVertical, Phone, Video } from "lucide-react";

interface ChatUser {
  id: string;
  username: string;
  email: string;
  isOnline?: boolean;
}

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface UserHeaderProps {
  user: ChatUser | null;
}

export function UserHeader({ user }: UserHeaderProps) {
  const { toast } = useToast();

  if (!user) {
    return (
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-muted-foreground">
            Select a chat to start messaging
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src="" alt={user.username} />
          <AvatarFallback>
            {user.username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold">{user.username}</h2>
          <p className="text-xs text-muted-foreground">
            {user.isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          onClick={() => {
            toast({
              title: "Feature coming soon",
              description: "Voice calls will be available in a future update",
            });
          }}
        >
          <Phone className="h-5 w-5" />
          <span className="sr-only">Voice call</span>
        </Button>
        <Button
          onClick={() => {
            toast({
              title: "Feature coming soon",
              description: "Video calls will be available in a future update",
            });
          }}
        >
          <Video className="h-5 w-5" />
          <span className="sr-only">Video call</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <MoreVertical className="h-5 w-5" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                toast({
                  title: "User profile",
                  description: "Viewing user profile will be available soon",
                });
              }}
            >
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                toast({
                  title: "Search in conversation",
                  description: "Search functionality will be available soon",
                });
              }}
            >
              Search in Conversation
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                toast({
                  title: "Block user",
                  description: "This feature will be available soon",
                  variant: "destructive",
                });
              }}
            >
              Block User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
