import type { EMOJI_LIST } from "../config/emoji";

export type ReactionMap = Record<string, number>; // { "👍": 2 }
export type ReactedUsersMap = Record<string, number[]>; // { "👍": [1,2] }
export type Emoji = (typeof EMOJI_LIST)[number];
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
}
