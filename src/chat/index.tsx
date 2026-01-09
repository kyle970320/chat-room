import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type {
  ChatMessage,
  FavoriteReaction,
  LastReadMessageType,
  ReactedUserNamesMap,
  ReactedUsersMap,
  ReactionMap,
} from "./types/message";
import { ROOM_ID } from "./config/room";
import MessageBottomBar from "./components/MessageBottomBar";
import { useSettingChat } from "./hooks/useSettingChat";
import MessageContainer from "./components/MessageContainer";
import MessageHeader from "./components/MessageHeader";
import type { CanvasRoomSummary, ChatRoomUser } from "./types/canvas";

function normalizeMessage(m: ChatMessage): ChatMessage {
  return {
    ...m,
    reactions: m?.reactions ?? {},
    reactedUsers: m?.reactedUsers ?? {},
  };
}

export default function ChatPage() {
  const { chatSide, chatScreen } = useSettingChat();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<number | null>(null);
  const [myAvatar, setMyAvatar] = useState("🙂");
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [userIp, setUserIp] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpenEmojiPanel, setIsOpenEmojiPanel] = useState<boolean>(false);
  const [emojiValue, setEmojiValue] = useState<string>("");
  const [replyMessage, setReplyMessage] = useState<ChatMessage | null>(null);
  const [favoriteReactions, setFavoriteReactions] = useState<
    Array<FavoriteReaction>
  >([]);

  // pagination states
  const PAGE_SIZE = 50;
  const [initialReady, setInitialReady] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadingMoreRef = useRef(false);


  
  // message store
  const [messageOrder, setMessageOrder] = useState<number[]>([]);
  const [messagesById, setMessagesById] = useState<Record<number, ChatMessage>>(
    {},
  );

  // canvas
  const [canvasRooms, setCanvasRooms] = useState<Array<CanvasRoomSummary>>([]);
  const [users, setUsers] = useState<Array<ChatRoomUser>>([]);

  const [readStateByUserId, setReadStateByUserId] = useState<
    Record<number, LastReadMessageType>
  >({});

  const messages = useMemo<Array<ChatMessage>>(() => {
    return messageOrder.map((id) => messagesById[id]).filter(Boolean);
  }, [messageOrder, messagesById]);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const initialScrolledRef = useRef(false);
  const prevHeightRef = useRef<number | null>(null);

  const handleAvatarPicker = (value: boolean) => setShowAvatarPicker(value);
  const handleMyAvatar = (value: string) => setMyAvatar(value);
  const handleEmojiPicker = (value: number | null) => setShowEmojiPicker(value);
  const handleEmojiPanel = (value: boolean) => setIsOpenEmojiPanel(value);
  const handleEmojiValue = (value: string) => setEmojiValue(value);
  const handleSetReply = (value: ChatMessage | null) => setReplyMessage(value);

  const scrollToBottomNow = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight; // 가장 확실
  }, []);

  const mergeMessages = useCallback(
    (listRaw: ChatMessage[], mode: "append" | "prepend") => {
      const list = (listRaw ?? []).map(normalizeMessage);
      if (list.length === 0) return;

      setMessagesById((prev) => {
        const next = { ...prev };
        for (const m of list) next[m.id] = m;
        return next;
      });

      setMessageOrder((prev) => {
        const set = new Set(prev);
        const incomingIds = list.map((m) => m.id).filter((id) => !set.has(id));
        if (incomingIds.length === 0) return prev;

        // ✅ prepend = older messages (top)
        return mode === "prepend"
          ? [...incomingIds, ...prev]
          : [...prev, ...incomingIds];
      });
    },
    [],
  );

  const getOldestTs = useCallback(() => {
    const firstId = messageOrder[0];
    if (!firstId) return null;
    const m = messagesById[firstId];
    return m?.ts ?? null;
  }, [messageOrder, messagesById]);

  // -------------------------
  // reactedUsers -> reactedUserNames
  // -------------------------
  const userIdToName = useMemo(() => {
    const map = new Map<number, string>();

    for (const m of messages) {
      if (typeof m.userId === "number" && m.name) {
        map.set(m.userId, m.name);
      }
    }

    if (userId != null && username) {
      map.set(userId, username);
    }

    return map;
  }, [messages, userId, username]);

  const viewMessages = useMemo(() => {
    return messages.map((m) => {
      const reactedUsers = m.reactedUsers ?? {};
      const reactedUserNames: ReactedUserNamesMap = {};

      for (const [emoji, ids] of Object.entries(reactedUsers)) {
        reactedUserNames[emoji] = (ids ?? [])
          .map((id) => userIdToName.get(id) ?? `User#${id}`)
          .filter(Boolean);
      }

      return {
        ...m,
        reactedUserNames,
      };
    });
  }, [messages, userIdToName]);

  // -------------------------
  // socket connect
  // -------------------------
  useEffect(() => {
    const SOCKET_URL = "https://biosocial-extraversively-deacon.ngrok-free.dev";

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

      // ✅ 최신 N개 요청(서버가 지원한다고 가정)
      socket.emit("history:latest", { roomId: ROOM_ID, limit: PAGE_SIZE });
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
      (me: {
        id: number;
        name: string;
        key: string;
        avatarUrl?: string | null;
      }) => {
        setUserId(me.id);
        setUsername(me.name ?? "");
        setUserIp(me.key);
        setMyAvatar(me.avatarUrl || "🙂");
        setIsLoading(false);
      },
    );

    // -------------------------
    // ✅ history handlers (NO RESET)
    // -------------------------

    // 서버가 "history:latest"를 지원하는 경우
    socket.on("history:latest", (data: ChatMessage[]) => {
      mergeMessages(data ?? [], "append");
      if (!data || data.length < PAGE_SIZE) setHasMore(false);

      if (!initialScrolledRef.current) {
        initialScrolledRef.current = true;

        // ✅ 2프레임 대기 후 scrollHeight가 확정되었을 때 바닥으로
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollToBottomNow();
            setInitialReady(true); // ✅ 여기서부터 화면 보여줌
          });
        });
      }
    });

    socket.on("history:before", (data: ChatMessage[]) => {
      const el = scrollContainerRef.current;

      mergeMessages(data ?? [], "prepend");
      loadingMoreRef.current = false;

      if (!data || data.length < PAGE_SIZE) setHasMore(false);

      if (el && prevHeightRef.current != null) {
        requestAnimationFrame(() => {
          prevHeightRef.current = null;
        });
      }
    });
    // message: 새 메시지 1개만 추가
    socket.on("message", (data: ChatMessage) => {
      const m = normalizeMessage(data);

      setMessagesById((prev) => ({ ...prev, [m.id]: m }));

      setMessageOrder((prev) => {
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

    // read:state
    socket.on(
      "read:state",
      (payload: {
        roomId: string;
        readState: Array<{
          userId: number;
          lastReadMessageId: number | null;
          lastReadAt: number | null;
          name: string;
          avatarUrl: string | null;
        }>;
      }) => {
        if (payload.roomId !== ROOM_ID) return;

        setReadStateByUserId(() => {
          const next: Record<number, LastReadMessageType> = {};
          for (const r of payload.readState ?? []) {
            next[r.userId] = {
              name: r.name ?? null,
              lastReadMessageId: r.lastReadMessageId ?? null,
              lastReadAt: r.lastReadAt ?? null,
            };
          }
          return next;
        });
      },
    );

    // read:update
    socket.on(
      "read:update",
      (payload: {
        roomId: string;
        userId: number;
        name: string | null;
        lastReadMessageId: number | null;
        lastReadAt: number | null;
      }) => {
        if (payload.roomId !== ROOM_ID) return;

        setReadStateByUserId((prev) => {
          const prevRow = prev[payload.userId];
          const prevId = prevRow?.lastReadMessageId ?? null;
          const nextId = payload.lastReadMessageId ?? null;

          const mergedId =
            prevId == null
              ? nextId
              : nextId == null
                ? prevId
                : Math.max(prevId, nextId);

          const prevAt = prevRow?.lastReadAt ?? null;
          const nextAt = payload.lastReadAt ?? null;
          const mergedAt =
            prevAt == null
              ? nextAt
              : nextAt == null
                ? prevAt
                : Math.max(prevAt, nextAt);

          return {
            ...prev,
            [payload.userId]: {
              name: prevRow?.name ?? null,
              lastReadMessageId: mergedId,
              lastReadAt: mergedAt,
            },
          };
        });
      },
    );

    // reaction:update
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

    socket.on(
      "favoriteReactions",
      (payload: { userId: number; top: Array<FavoriteReaction> }) => {
        setFavoriteReactions(payload.top ?? []);
      },
    );
    socket.emit("favoriteReactions:get", { limit: 4 });

    socket.emit("canvas:room:list");

    socket.on(
      "canvas:room:list",
      (payload: { rooms: Array<CanvasRoomSummary> }) => {
        setCanvasRooms(payload.rooms);
        setIsLoading(false);
      },
    );

    socket.on(
      "canvas:room:list:update",
      (payload: { room: CanvasRoomSummary }) => {
        const { room } = payload;
        setCanvasRooms((prev) => {
          return [...prev, room];
        });
      },
    );

    socket.on(
      "chat:room:users",
      (payload: { roomId: string; users: ChatRoomUser[] }) => {
        // 다른 roomId 이벤트 섞이는 거 방지
        setUsers(payload.users ?? []);
      },
    );

    socket.emit("chat:room:users", { roomId: ROOM_ID });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [mergeMessages]);
  useEffect(() => {
    const el = scrollContainerRef.current;
    const s = socketRef.current;
    if (!el || !s) return;

    const TOP_THRESHOLD_PX = 80;

    const onScroll = () => {
      if (!hasMore) return;
      if (loadingMoreRef.current) return;
      if (el.scrollTop > TOP_THRESHOLD_PX) return;

      const beforeTs = getOldestTs();
      if (!beforeTs) return;

      prevHeightRef.current = el.scrollHeight;
      loadingMoreRef.current = true;
      s.emit("history:before", { roomId: ROOM_ID, beforeTs, limit: PAGE_SIZE });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [hasMore, getOldestTs]);

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
      className="flex flex-col h-[calc(100vh-60px)] w-full mx-auto bg-white lg:h-full"
      onClick={() => {
        handleAvatarPicker(false);
        handleEmojiPanel(false);
        handleEmojiValue("");
        handleEmojiPicker(null);
      }}
    >
      <MessageHeader
        socket={socketRef}
        isConnected={isConnected}
        userIp={userIp}
        username={username}
        myAvatar={myAvatar}
        showAvatarPicker={showAvatarPicker}
        handleMyAvatar={handleMyAvatar}
        handleAvatarPicker={handleAvatarPicker}
      />
      <MessageContainer
        initialReady={initialReady}
        chatSide={chatSide}
        chatScreen={chatScreen}
        messages={viewMessages}
        userId={userId}
        isConnected={isConnected}
        socket={socketRef}
        readStateByUserId={readStateByUserId}
        favoriteReactions={favoriteReactions}
        showEmojiPicker={showEmojiPicker}
        handleEmojiPicker={handleEmojiPicker}
        messagesEndRef={messagesEndRef}
        scrollContainerRef={scrollContainerRef}
        handleSetReply={handleSetReply}
        canvasRooms={canvasRooms}
        users={users}
      />

      <MessageBottomBar
        chatScreen={chatScreen}
        socket={socketRef}
        isConnected={isConnected}
        emojiValue={emojiValue}
        isOpenEmojiPanel={isOpenEmojiPanel}
        favoriteReactions={favoriteReactions}
        replyMessage={replyMessage}
        messagesEndRef={messagesEndRef}
        scrollContainerRef={scrollContainerRef}
        handleEmojiPanel={handleEmojiPanel}
        handleEmojiValue={handleEmojiValue}
        handleSetReply={handleSetReply}
      />
    </div>
  );
}
