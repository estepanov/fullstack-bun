"use client";

import { Plus, Search } from "lucide-react";
import { useState } from "react";
import type { Conversation, Message, User } from "../../lib/chat-types";
import { cn } from "../../lib/utils";
import { Button } from "../ui";
import { Input } from "../ui";
import { ConversationItem, type ConversationItemCopy } from "./conversation-item";

export interface ConversationListCopy {
  title: string;
  newButtonLabel: string;
  searchPlaceholder: string;
  emptyLabel: string;
  itemCopy: ConversationItemCopy;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  currentUserId: string;
  copy: ConversationListCopy;
  isAdmin?: boolean;
  onSelectConversation?: (conversation: Conversation) => void;
  onNewConversation?: () => void;
  onEditMessage?: (message: Message, conversation: Conversation) => void;
  onDeleteMessage?: (message: Message, conversation: Conversation) => void;
  onBanUser?: (user: User, conversation: Conversation) => void;
  className?: string;
}

export function ConversationList({
  conversations,
  activeConversationId,
  currentUserId,
  copy,
  isAdmin = false,
  onSelectConversation,
  onNewConversation,
  className,
}: ConversationListProps) {
  const [search, setSearch] = useState("");

  const filteredConversations = conversations.filter((conv) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const name =
      conv.name ||
      conv.participants
        .filter((p) => p.id !== currentUserId)
        .map((p) => p.name)
        .join(", ");
    return name.toLowerCase().includes(searchLower);
  });

  return (
    <div className={cn("flex flex-col h-full bg-sidebar", className)}>
      <div className="p-4 border-b border-sidebar-border">
        <div className={cn("flex items-center justify-between", currentUserId && "mb-4")}>
          <h2 className="text-xl font-bold text-sidebar-foreground">
            {copy.title}
          </h2>
          {currentUserId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewConversation}
              className="text-sidebar-foreground"
            >
              <Plus className="h-5 w-5" />
              <span className="sr-only">{copy.newButtonLabel}</span>
            </Button>
          )}
        </div>
        {currentUserId && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={copy.searchPlaceholder}
              className="pl-9 bg-sidebar-accent border-0"
            />
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <p className="text-sm">{copy.emptyLabel}</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              copy={copy.itemCopy}
              isActive={conversation.id === activeConversationId}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onClick={() => onSelectConversation?.(conversation)}
            />
          ))
        )}
      </div>
    </div>
  );
}
