import type { EMOJI_LIST } from "../config/emoji";

export type ReactedUserNamesMap = Record<string, string[]>;
export type ReactionMap = Record<string, number>; // { "👍": 2 }
export type ReactedUsersMap = Record<string, number[]>; // { "👍": [1,2] }
export type Emoji = (typeof EMOJI_LIST)[number];
export interface ReplyMessageType {
  deleted: number;
  messageId: number;
  name: string;
  text: string;
  ts: string;
  userId: number;
}
export interface ChatMessage {
  id: number;
  roomId: string;
  text: string;
  ts: string;
  userId: number;
  name: string;
  avatarUrl?: string | null;
  reactions: ReactionMap;
  reactedUsers: ReactedUsersMap;
  reactedUserNames: ReactedUserNamesMap;
  reply?: ReplyMessageType;
  type?: string;
  meta?: {
    canvasRoomId: string;
    inviteId: string;
    invitedUserIds: Array<number>;
    title: string;
  };
}
export interface LastReadMessageType {
  name: string | null;
  lastReadMessageId: number | null;
  lastReadAt: number | null;
}
export interface FavoriteReaction {
  emoji: string;
  count: number;
}

export type ChatSideType = "both" | "left";
export type ChatScreenType = "narrow" | "wide";
