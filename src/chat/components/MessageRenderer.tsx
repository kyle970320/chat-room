import { useEffect, useRef, useState, type RefObject } from "react";
import type {
  ChatMessage,
  ChatSideType,
  Emoji,
  FavoriteReaction,
  LastReadMessageType,
} from "../types/message";
import { ChevronDown, MessageSquareQuote, Smile, Trash2 } from "lucide-react";
import type { Socket } from "socket.io-client";
import { ROOM_ID } from "../config/room";
import MessageAvatar from "./MessageAvatar";
import MessageWriter from "./MessageWriter";
import {
  getLastReaders,
  isOnlyEmoji,
  scrollToBottom,
  shouldShowHeader,
} from "../utils/text";
import { Tooltip } from "@/shared/ui/Tooltip";
import MessageContent from "./MessageContent";

interface Props {
  chatSide: ChatSideType; // "both" | "left" (가정)
  messages: Array<ChatMessage>;
  userId: number | null;
  isConnected: boolean;
  socket: RefObject<Socket | null>;
  showEmojiPicker: number | null;
  handleEmojiPicker: (value: number | null) => void;
  readStateByUserId: Record<number, LastReadMessageType>;
  favoriteReactions: Array<FavoriteReaction>;
  handleSetReply: (value: ChatMessage | null) => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
}

const BOTTOM_GAP_PX = 20;

export default function MessageRenderer(props: Props) {
  const {
    chatSide,
    messages,
    userId,
    isConnected,
    socket,
    showEmojiPicker,
    handleEmojiPicker,
    readStateByUserId,
    favoriteReactions,
    handleSetReply,
    messagesEndRef,
    scrollContainerRef,
  } = props;

  const [showNewMessageToast, setShowNewMessageToast] = useState(false);
  const [pickerUp, setPickerUp] = useState(false);
  const lastAckedRef = useRef<number>(0);
  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const prevLenRef = useRef(0);
  const wasNearBottomRef = useRef(true);

  const handleReaction = (messageId: number, emoji: Emoji) => {
    if (socket.current && isConnected) {
      socket.current.emit("reaction:toggle", {
        roomId: ROOM_ID,
        messageId,
        emoji,
      });
    }
    handleEmojiPicker(null);
  };

  const openPicker = (messageId: number) => {
    const next = showEmojiPicker === messageId ? null : messageId;
    handleEmojiPicker(next);

    if (next == null) return;

    const rowEl = rowRefs.current[messageId];
    const containerEl = scrollContainerRef.current;

    if (!rowEl || !containerEl) {
      setPickerUp(false);
      return;
    }

    const rowRect = rowEl.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();

    const thresholdY = containerRect.top + containerRect.height * 0.7;
    setPickerUp(rowRect.top >= thresholdY);
  };

  useEffect(() => {
    const prevLen = prevLenRef.current;
    const nextLen = messages.length;

    const appended = nextLen > prevLen;
    prevLenRef.current = nextLen;

    if (!appended) return;

    const last = messages[nextLen - 1];
    if (!last) return;
    const wasNearBottom = wasNearBottomRef.current; // ✅ 핵심 변경

    // ✅ 남이 보낸 메시지라도, "메시지 오기 직전"에 바닥 근처였으면 토스트 X + 자동 스크롤
    if (wasNearBottom) {
      requestAnimationFrame(() => setShowNewMessageToast(false));
      scrollToBottom(scrollContainerRef, false);
      return;
    }

    // ✅ 진짜 바닥이 아니었던 경우만 토스트
    requestAnimationFrame(() => setShowNewMessageToast(true));

    // if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    // timeoutRef.current = window.setTimeout(() => {
    //   setShowNewMessageToast(false);
    // }, 3000);
  }, [messages.length, userId]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      const near = distance <= BOTTOM_GAP_PX;

      wasNearBottomRef.current = near;

      if (near) {
        setShowNewMessageToast((prev) => (prev ? false : prev));
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // 초기 1회

    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollContainerRef]);

  useEffect(() => {
    const s = socket.current;
    const el = scrollContainerRef.current;
    if (!s || !el || !isConnected) return;

    const last = messages[messages.length - 1];
    if (!last) return;

    if (wasNearBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }

    // ✅ 바닥 근처면 ack
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distance <= BOTTOM_GAP_PX) {
      const lastId = Number(last.id);
      if (
        Number.isFinite(lastId) &&
        lastId > 0 &&
        lastAckedRef.current < lastId
      ) {
        lastAckedRef.current = lastId;
        s.emit("read:ack", { roomId: ROOM_ID, lastReadMessageId: lastId });
      }
    }
  }, [messages[messages.length - 1]?.id, isConnected]);

  const shouldForceLeft = chatSide === "left";
  return (
    <>
      {showNewMessageToast && (
        <div
          onClick={() => {
            scrollToBottom(scrollContainerRef, true);
            setShowNewMessageToast(false);
          }}
          className="fixed bottom-25 left-[53.5%] z-10 animate-bounce p-1 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-500/50 shadow-sm cursor-pointer"
        >
          <ChevronDown
            className="text-muted-foreground dark:text-white"
            size={24}
          />
        </div>
      )}
      {messages.map((message, index) => {
        const isMine = message.userId === userId;
        const renderAsMy = shouldForceLeft ? false : isMine;
        const showHeader = shouldShowHeader(messages, message, index);
        const reactions = message.reactions ?? {};
        const reactedUsers = message.reactedUsers ?? {};
        const reactedUserNames = message.reactedUserNames ?? [];
        const lastReaders = getLastReaders(message, readStateByUserId);
        const reply = message.reply ?? null;
        const isDeletedReply = reply && reply.deleted > 0;
        return (
          <div
            id={`message-id-${message.id}`}
            key={message.id}
            ref={(el) => {
              rowRefs.current[message.id] = el;
            }}
            className={`flex gap-2 px-4 py-1 group ${
              renderAsMy ? "flex-row-reverse" : ""
            }`}
          >
            <MessageAvatar
              showHeader={showHeader}
              isMyMessage={renderAsMy}
              avatarUrl={message.avatarUrl || "🙂"}
            />

            <div className={`flex flex-col ${renderAsMy ? "items-end" : ""}`}>
              <MessageWriter
                showHeader={showHeader}
                isMyMessage={renderAsMy}
                name={message.name}
                ts={message.ts}
              />

              <div
                className={`relative flex gap-1 ${
                  renderAsMy ? "flex-row-reverse" : ""
                } ${isOnlyEmoji(message.text) ? "items-end" : "items-center"}`}
              >
                <div
                  className={`flex items-end gap-1 ${
                    renderAsMy ? "flex-row-reverse" : ""
                  }`}
                >
                  <MessageContent
                    isMine={isMine}
                    reply={reply}
                    socket={socket}
                    message={message}
                    isDeletedReply={isDeletedReply}
                    showEmojiPicker={showEmojiPicker}
                    renderAsMy={renderAsMy}
                    userId={userId}
                    favoriteReactions={favoriteReactions}
                    pickerUp={pickerUp}
                    handleReaction={handleReaction}
                    reactedUsers={reactedUsers}
                  />
                  {lastReaders.count > 0 && (
                    <Tooltip
                      key={`${message.id}_${index}`}
                      content={
                        <>
                          {lastReaders.names.map((el, index) => {
                            const key = `${el}_${index}`;
                            return (
                              <span key={key} className="block py-0.5">
                                {el}
                              </span>
                            );
                          })}
                        </>
                      }
                      position={"bottom"}
                    >
                      <span className="inline-block font-semibold text-[10px] text-blue-300 cursor-pointer">
                        {lastReaders.count}
                      </span>
                    </Tooltip>
                  )}
                </div>
                <button
                  className={`${renderAsMy ? "mr-2" : "ml-2"} flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer`}
                >
                  {isMine && (
                    <Trash2
                      className="w-4 h-4 text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!socket.current || !isConnected) return;
                        socket.current.emit("message:delete", {
                          roomId: ROOM_ID,
                          messageId: message.id,
                        });
                      }}
                    />
                  )}
                  <Smile
                    onClick={(e) => {
                      e.stopPropagation();
                      openPicker(message.id);
                    }}
                    className="w-4 h-4 text-gray-400"
                  />
                  {
                    <MessageSquareQuote
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetReply(message);
                      }}
                      className="w-4 h-4 text-gray-400"
                    />
                  }
                </button>
              </div>

              {Object.keys(reactions).length > 0 && (
                <div className="flex gap-1 mt-1">
                  {Object.entries(reactions).map(([emoji, count], index) => {
                    const hasReacted = reactedUsers[emoji]?.includes(
                      userId ?? -1,
                    );
                    return (
                      <Tooltip
                        key={`${message.id}_${emoji}_${index}`}
                        content={
                          <>
                            {reactedUserNames[emoji].map((el) => {
                              return <span className="block py-0.5">{el}</span>;
                            })}
                          </>
                        }
                        position={"bottom"}
                        // className={tooltipClassName}
                        // contentClassName={tooltipContentClassName}
                      >
                        <span
                          key={emoji}
                          onClick={() =>
                            handleReaction(message.id, emoji as Emoji)
                          }
                          className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 transition-colors ${
                            hasReacted
                              ? "bg-blue-100 border-blue-300"
                              : "bg-gray-100 border-gray-300"
                          } border`}
                        >
                          {emoji} {count}
                        </span>
                      </Tooltip>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div ref={messagesEndRef} />
    </>
  );
}
