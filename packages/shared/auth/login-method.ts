export const LoginMethod = {
  MAGIC_LINK: "magic-link",
} as const;

export type LoginMethod = (typeof LoginMethod)[keyof typeof LoginMethod];
