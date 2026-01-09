import type { RefObject } from "react";
import { EMOJI_LIST } from "../config/emoji";
import type { ChatMessage, Emoji, LastReadMessageType } from "../types/message";

export const isOnlyEmoji = (text: string) => {
  if (text.length <= 2 && EMOJI_LIST.includes(text as Emoji)) {
    return true;
  }

  return false;
};

export const shouldShowHeader = (
  messages: Array<ChatMessage>,
  currentMsg: ChatMessage,
  index: number,
) => {
  if (index === 0) return true;

  const prevMsg = messages[index - 1];
  if (prevMsg.userId !== currentMsg.userId) return true;

  const timeDiff = Number(currentMsg.ts) - Number(prevMsg.ts);
  return timeDiff >= 60 * 1000;
};

export const scrollToBottom = (
  scrollContainerRef: RefObject<HTMLDivElement | null>,
  smooth = true,
) => {
  const container = scrollContainerRef.current;
  if (!container) return;

  const maxScrollTop = container.scrollHeight - container.clientHeight;

  if (smooth) {
    container.scrollTo({
      top: maxScrollTop,
      behavior: "smooth",
    });
  } else {
    container.scrollTop = maxScrollTop;
  }
};

/**
 * 읽은사람 확인하는 함수
 * 내가 보낸 메세지는 제외
 */
export const getLastReaders = (
  message: ChatMessage,
  readStateByUserId: Record<number, LastReadMessageType>,
) => {
  let count = 0;
  const names = [];
  for (const [uidStr, v] of Object.entries(readStateByUserId)) {
    const uid = Number(uidStr);
    if (uid === message.userId) continue; // 보통 나는 제외
    if ((v.lastReadMessageId ?? -1) >= message.id) {
      count += 1;
      names.push(v.name);
    }
  }
  return { count, names };
};

export const getRandomEmoji = (count: number) => {
  if (count <= 0) {
    return [];
  }
  if (count >= EMOJI_LIST.length) {
    return [...EMOJI_LIST];
  }

  const shuffled = [...EMOJI_LIST];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
};
