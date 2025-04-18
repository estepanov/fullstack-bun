import { Card } from "@/components/ui/card";
import { MessageScrollProvider } from "./message-context";
import { MessageForm } from "./message-form";
import { MessageList } from "./message-list";
export const MessagesContainer = () => {
  return (
    <MessageScrollProvider>
      <Card className="p-2">
        <MessageList />
      </Card>
      <MessageForm />
    </MessageScrollProvider>
  );
};
