"use client";

import { useState, useRef, useEffect } from "react";
import { Edit2, Trash2, MoreVertical } from "lucide-react";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
}

interface MessageActionsProps {
  message: Message;
  onEdit: () => void;
  onDelete: () => void;
}

export function MessageActions({
  message,
  onEdit,
  onDelete,
}: MessageActionsProps) {
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        actionsRef.current &&
        !actionsRef.current.contains(event.target as Node)
      ) {
        setShowActions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleEdit = () => {
    onEdit();
    setShowActions(false);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      onDelete();
    }
    setShowActions(false);
  };

  // Calculate how old the message is
  const isOlderThan24Hours = () => {
    const messageTime = new Date(message.createdAt).getTime();
    const currentTime = new Date().getTime();
    const hoursSinceCreation = (currentTime - messageTime) / (1000 * 60 * 60);
    return hoursSinceCreation > 24;
  };

  const tooOld = isOlderThan24Hours();

  return (
    <div ref={actionsRef} className="relative">
      <button
        onClick={() => setShowActions(!showActions)}
        className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 bg-gray-200 dark:bg-gray-700 rounded-full p-1 transition-opacity"
      >
        <MoreVertical size={14} />
      </button>

      {showActions && (
        <div className="absolute right-0 top-6 z-10 bg-white dark:bg-gray-800 shadow-md rounded-md overflow-hidden">
          <button
            onClick={handleEdit}
            disabled={tooOld}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Edit2 size={14} />
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={tooOld}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left text-sm text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={14} />
            Delete
          </button>
          {tooOld && (
            <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700">
              Can't edit/delete messages older than 24 hours
            </div>
          )}
        </div>
      )}
    </div>
  );
}
