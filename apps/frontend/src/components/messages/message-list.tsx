import { useGetExamplesQuery } from "@/hooks/api/useGetExamplesQuery";
import { useEffect } from "react";
import { useMesageScrollContext } from "./message-context";

export const MessageList = () => {
  const exampleGetQuery = useGetExamplesQuery();
  const { scrollContainerRef, scrollAnchorRef, scrollToBottom } =
    useMesageScrollContext();

  useEffect(() => {
    if (exampleGetQuery.data) {
      scrollToBottom();
    }
  }, [exampleGetQuery.data, scrollToBottom]);

  return (
    <div className="space-y-3">
      {exampleGetQuery?.data && exampleGetQuery.data.list?.length ? (
        <ul className="space-y-2 max-h-[200px] overflow-y-auto" ref={scrollContainerRef}>
          {exampleGetQuery.data.list.map((item) => (
            <li className="py-1 px-1.5" key={item.id}>
              <span className="text-muted-foreground text-xs font-mono block">
                {new Date(item.postedAt).toLocaleTimeString()}
              </span>
              {item.message}
            </li>
          ))}
          <li ref={scrollAnchorRef} />
        </ul>
      ) : null}
    </div>
  );
};
