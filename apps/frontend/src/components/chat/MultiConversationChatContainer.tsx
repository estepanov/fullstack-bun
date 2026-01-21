import { useMultiConversationChat } from "@frontend/hooks/api/useMultiConversationChat";
import { useSession } from "@frontend/lib/auth-client";
import { isAdminSession } from "frontend-common/auth";
import { ConversationList } from "frontend-common/components/chat/conversation-list";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EnhancedChatView } from "./EnhancedChatView";

interface MultiConversationChatContainerProps {
  roomId?: string;
  className?: string;
}

export const MultiConversationChatContainer = ({
  roomId = "global",
  className,
}: MultiConversationChatContainerProps) => {
  const { t } = useTranslation("messages");
  const {
    conversations,
    messagesByConversation,
    activeConversationId,
    setActiveConversationId,
    messages: chatMessages, // Original ChatMessage[] for admin operations
    sendMessage,
    sendTypingStatus,
    connectionStatus,
    error,
    isAuthenticated,
    profileIncomplete,
    throttle,
    onlineCounts,
    typingUsersByConversation,
    // connectedUserId,
  } = useMultiConversationChat({ roomId });

  const { data: session } = useSession();
  const isAdmin = isAdminSession(session);
  const currentUserId = session?.user?.id;
  const conversationItemCopy = {
    timeNowLabel: t("conversation_item.time_now"),
    minutesLabel: (count: number) => t("conversation_item.minutes", { count }),
    hoursLabel: (count: number) => t("conversation_item.hours", { count }),
    daysLabel: (count: number) => t("conversation_item.days", { count }),
    youPrefix: t("conversation_item.you_prefix"),
    menuLabel: t("actions.menu_label"),
    editLabel: t("actions.edit"),
    deleteLabel: t("actions.delete"),
    banUserLabel: t("actions.ban_user"),
    formatUnreadCount: (count: number) =>
      count > 99 ? t("conversation_item.unread_overflow") : String(count),
  };
  const conversationListCopy = {
    title: t("conversation_list.title"),
    newButtonLabel: t("conversation_list.new_button_label"),
    searchPlaceholder: t("conversation_list.search_placeholder"),
    emptyLabel: t("conversation_list.empty"),
    itemCopy: conversationItemCopy,
  };

  const [showMobileChat, setShowMobileChat] = useState(false);

  // Get active conversation
  const activeConversation = conversations.find(
    (conv) => conv.id === activeConversationId,
  );

  // Get messages for active conversation
  const activeMessages = messagesByConversation[activeConversationId] || [];
  const activeTypingUsers = typingUsersByConversation[activeConversationId] || [];

  // Handle conversation selection
  const handleSelectConversation = (conversation: { id: string }) => {
    setActiveConversationId(conversation.id);
    setShowMobileChat(true);
  };

  // Handle sending messages
  const handleSendMessage = (message: string) => {
    sendMessage(message);
  };

  // Handle new conversation (future feature)
  const handleNewConversation = () => {
    // Future: implement new conversation creation
    console.log("New conversation - not yet implemented");
  };

  // Render custom layout with ConversationList and EnhancedChatView
  return (
    <div className={`flex h-screen overflow-hidden ${className || ""}`}>
      {/* Sidebar - hidden on mobile when chat is active */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-border shrink-0 ${
          showMobileChat ? "hidden md:block" : ""
        }`}
      >
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          currentUserId={currentUserId || ""}
          copy={conversationListCopy}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
        />
      </div>

      {/* Main chat area */}
      <div className={`flex-1 min-w-0 ${!showMobileChat ? "hidden md:block" : ""}`}>
        {activeConversation ? (
          <EnhancedChatView
            conversation={activeConversation}
            messages={activeMessages}
            chatMessages={chatMessages} // Pass original messages for admin ops
            currentUserId={currentUserId || ""}
            isAdmin={isAdmin}
            onSendMessage={handleSendMessage}
            onTypingStatus={sendTypingStatus}
            onBack={() => setShowMobileChat(false)}
            connectionStatus={connectionStatus}
            error={error}
            isAuthenticated={isAuthenticated}
            profileIncomplete={profileIncomplete}
            session={session}
            throttle={throttle}
            onlineCounts={onlineCounts}
            typingUsers={activeTypingUsers}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">{t("chat_layout.empty_title")}</p>
            <p className="text-sm">{t("chat_layout.empty_subtitle")}</p>
          </div>
        )}
      </div>
    </div>
  );
};
