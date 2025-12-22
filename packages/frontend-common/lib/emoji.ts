const emojiRegex = /\p{Extended_Pictographic}/gu;
const emojiJoinerRegex = /[\u200d\uFE0E\uFE0F]/g;

export const isEmojiOnlyMessage = (value: string, maxEmojis: number) => {
  const trimmed = value.trim();
  if (!trimmed) return false;

  const matches = trimmed.match(emojiRegex) ?? [];
  if (matches.length === 0 || matches.length > maxEmojis) return false;

  const withoutEmoji = trimmed
    .replace(emojiRegex, "")
    .replace(emojiJoinerRegex, "")
    .replace(/\s+/g, "");

  return withoutEmoji.length === 0;
};
