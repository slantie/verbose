import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: string;
  timestamp: string;
  isOwn: boolean;
  sender: string;
  avatar: string;
}

export function ChatMessage({
  message,
  timestamp,
  isOwn,
  sender,
  avatar,
}: ChatMessageProps) {
  return (
    <div
      className={cn("flex items-start gap-2", {
        "flex-row-reverse": isOwn,
      })}
    >
      <Avatar>
        <AvatarImage src={avatar} alt={sender} />
        <AvatarFallback>
          {sender
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn("flex max-w-[75%] flex-col", {
          "items-end": isOwn,
        })}
      >
        <div
          className={cn("rounded-lg px-4 py-2", {
            "bg-primary text-primary-foreground": isOwn,
            "bg-muted": !isOwn,
          })}
        >
          <p>{message}</p>
        </div>
        <span className="mt-1 text-xs text-muted-foreground">{timestamp}</span>
      </div>
    </div>
  );
}