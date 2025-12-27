export const LoginMethod = {
  MAGIC_LINK: "magic-link",
  PASSKEY: "passkey",
  EMAIL: "email",
} as const;

export type LoginMethod = (typeof LoginMethod)[keyof typeof LoginMethod];
