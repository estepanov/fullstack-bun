export type MockSession = {
  user: Record<string, unknown>;
  session: Record<string, unknown>;
};

export const authMockState: {
  session: MockSession | null;
  setPasswordStatus: boolean;
} = {
  session: null,
  setPasswordStatus: true,
};
