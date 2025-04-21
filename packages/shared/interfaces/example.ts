import { z } from "zod";

export const exampleSchema = ({
  messageMinLengthError = "Message must be at least 5 characters long",
  messageMaxLengthError = "Message must be less than 40 characters long",
}: {
  messageMinLengthError?: string;
  messageMaxLengthError?: string;
}) =>
  z.object({
    id: z.string(),
    message: z.string().min(5, messageMinLengthError).max(40, messageMaxLengthError),
    postedAt: z.string(),
  });

export type Example = z.infer<ReturnType<typeof exampleSchema>>;

export const newExampleSchema = ({
  messageMaxLengthError,
  messageMinLengthError,
}: {
  messageMinLengthError?: string;
  messageMaxLengthError?: string;
}) =>
  exampleSchema({ messageMaxLengthError, messageMinLengthError }).omit({
    id: true,
    postedAt: true,
  });

export type NewExample = z.infer<ReturnType<typeof newExampleSchema>>;
