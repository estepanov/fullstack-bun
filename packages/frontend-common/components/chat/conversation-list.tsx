"use client";

import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Conversation, Message, User } from "../../lib/chat-types";
import { cn } from "../../lib/utils";
import { Button } from "../ui";
import { Input } from "../ui";
import { ConversationItem } from "./conversation-item";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  currentUserId: string;
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
  isAdmin = false,
  onSelectConversation,
  onNewConversation,
  className,
}: ConversationListProps) {
  const { t } = useTranslation("messages");
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
            {t("conversation_list.title")}
          </h2>
          {currentUserId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewConversation}
              className="text-sidebar-foreground"
            >
              <Plus className="h-5 w-5" />
              <span className="sr-only">{t("conversation_list.new_button_label")}</span>
            </Button>
          )}
        </div>
        {currentUserId && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("conversation_list.search_placeholder")}
              className="pl-9 bg-sidebar-accent border-0"
            />
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <p className="text-sm">{t("conversation_list.empty")}</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
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
