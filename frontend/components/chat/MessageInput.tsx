"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SendHorizontal, X } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isDisabled?: boolean;
  isSending?: boolean;
  onTyping?: (isTyping: boolean) => void;
  editMode?: boolean;
  editContent?: string;
  onCancelEdit?: () => void;
  onEditMessage?: (content: string) => void;
}

export function MessageInput({
  onSendMessage,
  isDisabled = false,
  isSending = false,
  onTyping,
  editMode = false,
  editContent = "",
  onCancelEdit,
  onEditMessage,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Set message to editContent when in edit mode
  useEffect(() => {
    if (editMode && editContent) {
      setMessage(editContent);
      
      // Focus on textarea when editing
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.value.length;
      }
    }
  }, [editMode, editContent]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAction();
    }

    // Notify about typing (only when not editing)
    if (onTyping && message.trim() && !editMode) {
      onTyping(true);
    }

    // Close edit mode with Escape key
    if (e.key === "Escape" && editMode && onCancelEdit) {
      onCancelEdit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }

    // Notify about typing (only when not editing)
    if (onTyping && !editMode) {
      onTyping(!!value.trim());
    }
  };

  const handleAction = () => {
    if (message.trim() && !isDisabled) {
      if (editMode && onEditMessage) {
        onEditMessage(message);
      } else {
        onSendMessage(message);
      }
      
      setMessage("");

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  return (
    <div className="border-t p-2 bg-background flex items-end gap-2">
      {editMode && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-50 dark:bg-yellow-900/20 p-2 text-sm border-b">
          <div className="flex justify-between items-center">
            <span>Editing message</span>
            <button 
              onClick={onCancelEdit}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      
      <textarea
        ref={textareaRef}
        value={message}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={editMode ? "Edit your message..." : "Type a message..."}
        className="flex-1 resize-none max-h-32 min-h-[40px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        disabled={isDisabled}
        rows={1}
      />
      
      <Button
        onClick={handleAction}
        disabled={!message.trim() || isDisabled}
        size="icon"
        variant={editMode ? "outline" : "default"}
      >
        {isSending ? (
          <Spinner size="sm" />
        ) : (
          <SendHorizontal className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
