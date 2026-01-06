import { EMOJI_LIST } from "../config/emoji";
import type { Emoji } from "../types/message";

export const isOnlyEmoji = (text: string) => {
  if (text.length <= 2 && EMOJI_LIST.includes(text as Emoji)) {
    return true;
  }

  return false;
};
