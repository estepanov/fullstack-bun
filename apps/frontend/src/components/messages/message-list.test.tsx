import { describe, expect, test } from "bun:test";
import { getExamples } from "@test/factory/get-example";
import { server } from "@test/msw";
import { render, screen } from "@test/rtl";
import { MessageList } from "./message-list";

describe("MessageList", () => {
  test("renders returned messages", async () => {
    const ITEM_ONE = {
      id: "1",
      message: "hi!!2!!!3!4!5!6!",
      postedAt: new Date().toISOString(),
    };
    const ITEM_TWO = {
      id: "2",
      message: `ilovethis${new Date().toISOString()}`,
      postedAt: new Date().toISOString(),
    };
    server.use(
      getExamples({
        list: [ITEM_ONE, ITEM_TWO],
      }),
    );
    render(<MessageList />);
    await screen.findByText(ITEM_ONE.message);
    screen.getByText(ITEM_TWO.message);
    expect(
      screen.getAllByText(new Date(ITEM_TWO.postedAt).toLocaleTimeString()),
    ).toHaveLength(2);
  });
});
