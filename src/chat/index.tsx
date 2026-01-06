import { useEffect, useMemo, useRef, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { AVATAR_LIST } from "./config/emoji";
import type {
  ChatMessage,
  ReactedUsersMap,
  ReactionMap,
} from "./types/message";
import { ROOM_ID } from "./config/room";
import MessageRenderer from "./components/MessageRenderer";
import MessageBottomBar from "./components/MessageBottomBar";

function normalizeMessage(m: ChatMessage): ChatMessage {
  return {
    ...m,
    reactions: m?.reactions ?? {},
    reactedUsers: m?.reactedUsers ?? {},
  };
}

export default function ChatPage() {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [myAvatar, setMyAvatar] = useState("🙂");
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [messageOrder, setMessageOrder] = useState<number[]>([]);
  const [messagesById, setMessagesById] = useState<Record<number, ChatMessage>>(
    {},
  );
  const messages = useMemo<Array<ChatMessage>>(() => {
    return messageOrder.map((id) => messagesById[id]).filter(Boolean);
  }, [messageOrder, messagesById]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleAvatarPicker = (value: boolean) => {
    setShowAvatarPicker(value);
  };

  useEffect(() => {
    const SOCKET_URL = "http://192.168.0.92:8081";

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join", { roomId: ROOM_ID });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", () => {
      console.error("Socket.IO 연결 오류:");
      setIsConnected(false);
      setIsLoading(false);
    });

    socket.on(
      "me",
      (me: { id: number; name: string; avatarUrl?: string | null }) => {
        setUserId(me.id);
        setUsername(me.name ?? "");
        setMyAvatar(me.avatarUrl || "🙂");
        setIsLoading(false);
      },
    );

    // ✅ history: 한번에 Map 구조로 세팅
    socket.on("history", (data: ChatMessage[]) => {
      const list = (data ?? []).map(normalizeMessage);

      setMessagesById(() => {
        const next: Record<number, ChatMessage> = {};
        for (const m of list) next[m.id] = m;
        return next;
      });

      setMessageOrder(() => list.map((m) => m.id));
    });

    // ✅ message: 새 메시지 1개만 추가
    socket.on("message", (data: ChatMessage) => {
      const m = normalizeMessage(data);

      setMessagesById((prev) => {
        // 같은 id가 오면 덮어쓰기
        return { ...prev, [m.id]: m };
      });

      setMessageOrder((prev) => {
        // 중복 방지
        if (prev[prev.length - 1] === m.id) return prev;
        if (prev.includes(m.id)) return prev;
        return [...prev, m.id];
      });
    });

    socket.on("message:deleted", ({ messageId }: { messageId: number }) => {
      setMessagesById((prev) => {
        if (!prev[messageId]) return prev;
        const next = { ...prev };
        delete next[messageId];
        return next;
      });
      setMessageOrder((prev) => prev.filter((id) => id !== messageId));
    });

    /**
     * ✅ reaction:update: "전체 messages.map" 제거
     * -> 해당 messageId 하나만 교체
     */
    socket.on(
      "reaction:update",
      (payload: {
        messageId: number;
        reactions: ReactionMap;
        reactedUsers: ReactedUsersMap;
      }) => {
        const { messageId, reactions, reactedUsers } = payload;

        setMessagesById((prev) => {
          const target = prev[messageId];
          if (!target) return prev;

          // ✅ 다른 메시지 레퍼런스 유지 + target만 교체
          return {
            ...prev,
            [messageId]: {
              ...target,
              reactions: reactions ?? {},
              reactedUsers: reactedUsers ?? {},
            },
          };
        });
      },
    );

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-[calc(100vh-48px)] my-6 max-w-2xl mx-auto bg-gray-50 border border-gray-300"
      onClick={() => {
        handleAvatarPicker(false);
      }}
    >
      <div className="bg-blue-600 text-white p-4 shadow-md flex items-center justify-between">
        <div>
          <p className="text-xl font-bold">채팅방</p>
          <div className="flex items-center gap-2 text-sm opacity-90">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4" />
                <span>연결됨</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span>오프라인 모드</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{username}</span>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAvatarPicker(!showAvatarPicker);
              }}
              className="w-12 h-12 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center text-2xl transition-colors cursor-pointer"
            >
              {myAvatar}
            </button>

            {showAvatarPicker && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl p-1 z-20 w-70">
                <p className="text-gray-700 text-sm font-semibold mb-2">
                  프로필 선택
                </p>

                <div className="grid grid-cols-8 gap-1">
                  {AVATAR_LIST.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMyAvatar(avatar);
                        setShowAvatarPicker(false);
                        if (socketRef.current && isConnected) {
                          socketRef.current.emit("me:update", {
                            avatarUrl: avatar,
                          });
                        }
                      }}
                      className={`flex justify-center text-xl hover:bg-gray-100 rounded p-1 transition-colors cursor-pointer ${
                        myAvatar === avatar
                          ? "bg-blue-100 ring-2 ring-blue-500"
                          : ""
                      }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto hide-scrollbar p-4"
      >
        {!isConnected && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-6xl mb-4">💤</div>
            <p className="text-lg">서버가 자고있어요</p>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-lg">채팅을 시작해주세요</p>
          </div>
        ) : (
          <MessageRenderer
            messages={messages}
            userId={userId}
            isConnected={isConnected}
            socket={socketRef}
            messagesEndRef={messagesEndRef}
            scrollContainerRef={scrollContainerRef}
          />
        )}
      </div>

      <MessageBottomBar
        socket={socketRef}
        isConnected={isConnected}
        messagesEndRef={messagesEndRef}
      />
    </div>
  );
}
