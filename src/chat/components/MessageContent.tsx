import { chatFullTime } from "@/shared/config/utils";
import { isOnlyEmoji } from "../utils/text";
import type {
  ChatMessage,
  Emoji,
  FavoriteReaction,
  ReactedUsersMap,
  ReplyMessageType,
} from "../types/message";
import { EMOJI_LIST } from "../config/emoji";
import { Button } from "@/shared/ui/Button";
import type { RefObject } from "react";
import type { Socket } from "socket.io-client";

interface Props {
  isMine: boolean;
  reply: ReplyMessageType | null;
  message: ChatMessage;
  isDeletedReply: boolean | null;
  showEmojiPicker: number | null;
  renderAsMy: boolean;
  userId: number | null;
  favoriteReactions: Array<FavoriteReaction>;
  pickerUp: boolean;
  handleReaction: (messageId: number, emoji: Emoji) => void;
  reactedUsers: ReactedUsersMap;
  socket: RefObject<Socket | null>;
}

export default function MessageContent(props: Props) {
  const {
    isMine,
    reply,
    message,
    isDeletedReply,
    showEmojiPicker,
    renderAsMy,
    userId,
    favoriteReactions,
    pickerUp,
    handleReaction,
    reactedUsers,
    socket,
  } = props;
  //   console.log(message);
  const acceptInvite = () => {
    if (!socket.current || !message.meta) {
      return;
    }
    const { inviteId } = message.meta;
    socket.current.emit("canvas:invite:accept", { inviteId });
  };
  if (message?.type === "canvas_invite") {
    return (
      <div
        className={`relative rounded-2xl max-w-md break-words ${
          isMine ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
        } ${isOnlyEmoji(message.text) ? "text-[80px]" : ""}`}
      >
        <img
          className="w-100 h-100 mix-blend-screen"
          src="/chat/drawing.png"
          alt=""
        />
        <div className="px-6 py-5">
          <div>캔버스에 초대합니다</div>
          <div className="text-sm text-gray-200">{message.meta?.title}</div>
          <Button onClick={acceptInvite} className="mt-2 w-full text-black">
            방 들어가기
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div
      className={`relative rounded-2xl px-4 py-2 max-w-md break-words ${
        isMine ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
      } ${isOnlyEmoji(message.text) ? "text-[80px]" : ""}`}
    >
      {reply && (
        <div
          onClick={() => {
            if (!isDeletedReply) {
              const item = document.getElementById(
                `message-id-${reply.messageId}`,
              );
              item?.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "center",
              });
            }
          }}
          className={`flex flex-col gap-1 text-xs pb-3 border-b ${isMine ? "hover:text-orange-100" : "hover:text-gray-600 border-gray-400"} cursor-pointer`}
        >
          {isDeletedReply ? (
            <div></div>
          ) : (
            <div className="flex items-center">
              <div className="">{reply.name}</div>
              <div className="ml-1">{chatFullTime(reply.ts)}</div>
            </div>
          )}
          <div>{reply.text}</div>
        </div>
      )}
      <div className={`${reply ? "pt-2" : ""}`}>{message.text}</div>

      {showEmojiPicker === message.id &&
        (() => {
          const uid = userId ?? -1;
          const favoriteEmoji = favoriteReactions
            .sort((a, b) => b.count - a.count)
            .map((el) => el.emoji);

          const rest = EMOJI_LIST.filter(
            (emoji) => !favoriteEmoji?.includes(emoji),
          );

          return (
            <div
              className={`absolute ${
                pickerUp ? "bottom-full mb-2" : "top-0 mt-8"
              } ${renderAsMy ? "right-0" : "left-0"}
                                  w-45 ${favoriteEmoji.length > 0 ? "h-50" : "h-35"} z-10
                                  p-2 bg-white border rounded-lg shadow-lg`}
            >
              {favoriteEmoji.length > 0 && (
                <>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {favoriteEmoji.map((emoji) => (
                      <button
                        key={`selected-${emoji}`}
                        onClick={() =>
                          handleReaction(message.id, emoji as Emoji)
                        }
                        className="text-xl hover:bg-gray-100 rounded p-1 transition-colors"
                        title="내가 선택함 (클릭하면 해제)"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <div className="h-px bg-gray-200 mb-2" />
                </>
              )}

              <div className="custom-scrollbar overflow-y-auto h-32 flex flex-wrap gap-1">
                {[...rest].map((emoji) => {
                  const hasReacted = reactedUsers[emoji]?.includes(uid);

                  return (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(message.id, emoji as Emoji)}
                      className={`text-xl hover:bg-gray-100 rounded p-1 transition-colors ${
                        hasReacted ? "bg-blue-100" : ""
                      }`}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
    </div>
  );
}
