import { type ReactNode, createContext, useContext, useRef } from "react";

interface MessageScrollContextType {
  scrollContainerRef: React.RefObject<HTMLUListElement | null>;
  scrollAnchorRef: React.RefObject<HTMLLIElement | null>;
  scrollToBottom: (options?: { smooth?: boolean }) => void;
}

const MesageScrollContext = createContext<MessageScrollContextType>({
  scrollContainerRef: { current: null },
  scrollAnchorRef: { current: null },
  scrollToBottom: () => {},
});

export const MessageScrollProvider = ({ children }: { children: ReactNode }) => {
  const scrollContainerRef = useRef<HTMLUListElement | null>(null);
  const scrollAnchorRef = useRef<HTMLLIElement | null>(null);

  const scrollToBottom = ({ smooth = true } = {}) => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  return (
    <MesageScrollContext.Provider
      value={{ scrollContainerRef, scrollAnchorRef, scrollToBottom }}
    >
      {children}
    </MesageScrollContext.Provider>
  );
};

export const useMesageScrollContext = () => useContext(MesageScrollContext);
