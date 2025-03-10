"use client";

import { MoreVertical, Phone, Video } from "lucide-react";
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

interface ChatUser {
  id: string;
  username: string;
  email: string;
  isOnline?: boolean;
}

interface UserHeaderProps {
  user: ChatUser | null;
}

export function UserHeader({ user }: UserHeaderProps) {
  const { toast } = useToast();

  if (!user) {
    return (
      // Add shrink-0 to prevent the header from shrinking in flex layout
      <div className="flex items-center justify-between border-b p-4 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-muted-foreground">
            Select a chat to start messaging
          </h2>
        </div>
      </div>
    );
  }

  return (
    // Add shrink-0 to prevent the header from shrinking in flex layout
    <div className="flex items-center justify-between border-b p-4 shrink-0">
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
          onClick={() =>
            toast({
              description: "Video call feature coming soon",
            })
          }
          variant="ghost"
          size="icon"
        >
          <Video className="h-4 w-4" />
          <span className="sr-only">Video Call</span>
        </Button>
        <Button
          onClick={() =>
            toast({
              description: "Voice call feature coming soon",
            })
          }
          variant="ghost"
          size="icon"
        >
          <Phone className="h-4 w-4" />
          <span className="sr-only">Voice Call</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Contact</DropdownMenuItem>
            <DropdownMenuItem>Search in Conversation</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500">Block</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
