import { signIn } from "@frontend/lib/auth-client";

const getSocialRedirectUrls = (origin: string) => ({
  callbackURL: `${origin}/dashboard`,
  newUserCallbackURL: `${origin}/dashboard`,
  errorCallbackURL: `${origin}/auth/login`,
});

type SocialProvider = Parameters<typeof signIn.social>[0]["provider"];

export const signInWithSocialProvider = async (provider: SocialProvider) => {
  const origin = window.location.origin;
  return signIn.social({
    provider,
    ...getSocialRedirectUrls(origin),
  });
};
