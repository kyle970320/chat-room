import { useEffect, useRef, useState, type RefObject } from "react";
import type { ChatMessage, Emoji } from "../types/message";
import { Smile, Trash2 } from "lucide-react";
import { EMOJI_LIST } from "../config/emoji";
import type { Socket } from "socket.io-client";
import { ROOM_ID } from "../config/room";
import MessageAvatar from "./MessageAvatar";
import MessageWriter from "./MessageWriter";
import { isOnlyEmoji } from "../utils/text";

interface Props {
  messages: Array<ChatMessage>;
  userId: number | null;
  isConnected: boolean;
  socket: RefObject<Socket | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  scrollContainerRef: RefObject<HTMLDivElement | null>; // ✅ 추가
}

const BOTTOM_GAP_PX = 20; // ✅ 바닥 판정 여유 (원하면 0~80 조절)

export default function MessageRenderer(props: Props) {
  const {
    messages,
    userId,
    isConnected,
    socket,
    messagesEndRef,
    scrollContainerRef,
  } = props;

  const [showEmojiPicker, setShowEmojiPicker] = useState<number | null>(null);
  const [showNewMessageToast, setShowNewMessageToast] = useState(false);
  const [pickerUp, setPickerUp] = useState(false);
  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const prevLenRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  const isNearBottom = () => {
    const el = scrollContainerRef.current;
    if (!el) return true; // 컨테이너 없으면 토스트 띄우지 않는 쪽(안전)

    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distance <= BOTTOM_GAP_PX;
  };

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "end",
    });
  };

  const handleReaction = (messageId: number, emoji: Emoji) => {
    if (socket.current && isConnected) {
      socket.current.emit("reaction:toggle", {
        roomId: ROOM_ID,
        messageId,
        emoji,
      });
    }
    setShowEmojiPicker(null);
  };

  // 같은 사용자가 1분 이내에 연속으로 보낸 메시지인지 확인
  const shouldShowHeader = (currentMsg: ChatMessage, index: number) => {
    if (index === 0) return true;

    const prevMsg = messages[index - 1];
    if (prevMsg.userId !== currentMsg.userId) return true;

    const timeDiff = Number(currentMsg.ts) - Number(prevMsg.ts);
    return timeDiff >= 60 * 1000;
  };

  const openPicker = (messageId: number) => {
    // 토글
    const next = showEmojiPicker === messageId ? null : messageId;
    setShowEmojiPicker(next);

    if (next == null) return;

    // ✅ 여기서 "렌더링되는 div"의 위치를 기준으로 판정
    const rowEl = rowRefs.current[messageId];
    const containerEl = scrollContainerRef.current;

    if (!rowEl || !containerEl) {
      setPickerUp(false);
      return;
    }

    const rowRect = rowEl.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();

    // row의 top이 컨테이너 높이의 70% 아래면 -> 위로
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

    const isMine = userId != null && last.userId === userId;
    const nearBottom = isNearBottom();

    // ✅ 내가 보낸 메시지면 무조건 아래로
    if (isMine) {
      scrollToBottom(true);
      return;
    }

    // ✅ 남이 보낸 메시지라도, 이미 바닥 근처면 토스트 X + 자동 스크롤
    if (nearBottom) {
      requestAnimationFrame(() => {
        setShowNewMessageToast(false);
      });
      scrollToBottom(false); // 이미 근처니까 auto로 툭 내려도 됨
      return;
    }

    // ✅ 바닥이 아니면 그때만 토스트
    requestAnimationFrame(() => {
      setShowNewMessageToast(true);
    });

    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setShowNewMessageToast(false);
    }, 3000);
  }, [messages.length, userId]); // ✅ length만 감시

  // ✅ 사용자가 직접 바닥으로 내려오면 토스트 자동 숨김
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const onScroll = () => {
      if (showNewMessageToast && isNearBottom()) {
        setShowNewMessageToast(false);
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [showNewMessageToast]);

  return (
    <>
      {showNewMessageToast && (
        <button
          onClick={() => {
            scrollToBottom(true);
            setShowNewMessageToast(false);
          }}
          className="fixed bottom-30 left-[53.5%] z-50 px-3 py-2 rounded-full shadow-lg border bg-blue-500 text-white text-sm font-medium hover:bg-blue-400 active:scale-[0.98]"
        >
          새 채팅 보러가기
        </button>
      )}

      {messages.map((message, index) => {
        const isMyMessage = message.userId === userId;
        const showHeader = shouldShowHeader(message, index);
        const reactions = message.reactions ?? {};
        const reactedUsers = message.reactedUsers ?? {};

        return (
          <div
            key={message.id}
            ref={(el) => {
              rowRefs.current[message.id] = el;
            }}
            onClick={() => {
              setShowEmojiPicker(0);
            }}
            className={`flex gap-2 px-4 py-1 group ${
              isMyMessage ? "flex-row-reverse" : ""
            }`}
          >
            <MessageAvatar
              showHeader={showHeader}
              isMyMessage={isMyMessage}
              avatarUrl={message.avatarUrl || "🙂"}
            />

            <div className={`flex flex-col ${isMyMessage ? "items-end" : ""}`}>
              <MessageWriter
                showHeader={showHeader}
                isMyMessage={isMyMessage}
                name={message.name}
                ts={message.ts}
              />

              <div
                className={`relative flex gap-1 ${
                  isMyMessage ? "flex-row-reverse" : ""
                } ${isOnlyEmoji(message.text) ? "items-end" : "items-center"}`}
              >
                <div
                  className={`relative rounded-2xl px-4 py-2 max-w-md break-words ${
                    isMyMessage
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  } ${isOnlyEmoji(message.text) ? "text-[80px]" : ""}`}
                >
                  {message.text}
                  {showEmojiPicker === message.id &&
                    (() => {
                      const uid = userId ?? -1;

                      // 1) 내가 이미 눌렀던 이모지들
                      const selected = EMOJI_LIST.filter((emoji) =>
                        reactedUsers[emoji]?.includes(uid),
                      );

                      // 2) 나머지 이모지들
                      const rest = EMOJI_LIST.filter(
                        (emoji) => !reactedUsers[emoji]?.includes(uid),
                      );

                      return (
                        <div
                          className={`absolute ${
                            pickerUp ? "bottom-full mb-2" : "top-0 mt-8"
                          } ${isMyMessage ? "right-0" : "left-0"}
      w-45 ${selected.length > 0 ? "h-50" : "h-35"} z-10
      p-2 bg-white border rounded-lg shadow-lg`}
                        >
                          {/* ✅ 상단: 내가 선택한 이모지 */}
                          {selected.length > 0 && (
                            <>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {selected.map((emoji) => (
                                  <button
                                    key={`selected-${emoji}`}
                                    onClick={() =>
                                      handleReaction(message.id, emoji as Emoji)
                                    }
                                    className="text-xl bg-blue-100 hover:bg-blue-200 rounded p-1 transition-colors"
                                    title="내가 선택함 (클릭하면 해제)"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>

                              {/* 구분선 */}
                              <div className="h-px bg-gray-200 mb-2" />
                            </>
                          )}

                          {/* ✅ 하단: 전체 리스트 (selected도 포함해서 보여주고 싶으면 rest 대신 EMOJI_LIST 사용) */}
                          <div className="custom-scrollbar overflow-y-auto h-32 flex flex-wrap gap-1">
                            {/* 원하면 selected 먼저 + rest 이어붙이기 */}
                            {[...rest].map((emoji) => {
                              const hasReacted =
                                reactedUsers[emoji]?.includes(uid);

                              return (
                                <button
                                  key={emoji}
                                  onClick={() =>
                                    handleReaction(message.id, emoji as Emoji)
                                  }
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

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openPicker(message.id);
                  }}
                  className={`${isMyMessage ? "mr-2" : "ml-2"} flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer`}
                >
                  {isMyMessage && (
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
                  <Smile className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {Object.keys(reactions).length > 0 && (
                <div className="flex gap-1 mt-1">
                  {Object.entries(reactions).map(([emoji, count]) => {
                    const hasReacted = reactedUsers[emoji]?.includes(
                      userId ?? -1,
                    );
                    return (
                      <button
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
                      </button>
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
