import { describe, expect, test } from "bun:test";
import { postExample } from "@test/factory/post-example";
import { server } from "@test/msw";
import { render, screen } from "@test/rtl";
import { waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { MessageForm } from "./message-form";

describe("MessageForm", () => {
  test("Includes a textarea", () => {
    render(<MessageForm />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeInTheDocument();
  });

  test("Includes a submit button", () => {
    render(<MessageForm />);
    const submitButton = screen.getByRole("button", { name: "form.submit_button" });
    expect(submitButton).toBeInTheDocument();
  });

  test("shows error on form submission when the message is empty", async () => {
    const user = userEvent.setup();
    render(<MessageForm />);
    const submitButton = screen.getByRole("button", { name: "form.submit_button" });
    await waitFor(() => expect(submitButton).toBeEnabled());
    await user.click(submitButton);
    await screen.findByText("form.errors.messageMinLengthError");
  });

  test("shows error on form submission when the message is too long", async () => {
    const user = userEvent.setup();
    render(<MessageForm />);
    await user.type(screen.getByRole("textbox"), "a".repeat(50));
    const submitButton = screen.getByRole("button", { name: "form.submit_button" });
    await user.click(submitButton);
    await screen.findByText("form.errors.messageMaxLengthError");
  });

  test("submits the form when the message is valid", async () => {
    const NEW_MESSAGE = {
      id: "1",
      message: "hello+world+1234567890",
      postedAt: new Date().toISOString(),
    };
    const user = userEvent.setup();
    server.use(postExample());
    render(<MessageForm />);
    await user.type(
      screen.getByLabelText("form.message_field_label"),
      NEW_MESSAGE.message,
    );
    expect(screen.getByLabelText("form.message_field_label")).toHaveValue(
      NEW_MESSAGE.message,
    );
    await user.click(screen.getByRole("button", { name: "form.submit_button" }));
    expect(screen.getByLabelText("form.message_field_label")).toHaveValue("");
  });
});
