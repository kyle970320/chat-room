import { useState, type RefObject } from "react";
import type {
  ChatMessage,
  ChatScreenType,
  ChatSideType,
  FavoriteReaction,
  LastReadMessageType,
} from "../types/message";
import type { Socket } from "socket.io-client";
import { cn } from "@/lib/utils";
import MessageRenderer from "./MessageRenderer";
import DrawingCanvas from "./drawing/DrawingCanvas";
import { MailPlus, Plus } from "lucide-react";
import type { CanvasRoomSummary, ChatRoomUser } from "../types/canvas";
import DrawingInviteModal from "./drawing/DrawingInviteModal";
import { ROOM_ID } from "../config/room";

interface Props {
  initialReady: boolean;
  chatSide: ChatSideType;
  chatScreen: ChatScreenType;
  messages: Array<ChatMessage>;
  userId: number | null;
  isConnected: boolean;
  socket: RefObject<Socket | null>;
  showEmojiPicker: number | null;
  handleEmojiPicker: (value: number | null) => void;
  readStateByUserId: Record<number, LastReadMessageType>;
  favoriteReactions: Array<FavoriteReaction>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  handleSetReply: (value: ChatMessage | null) => void;
  canvasRooms: Array<CanvasRoomSummary>;
  users: Array<ChatRoomUser>;
}

export default function MessageContainer(props: Props) {
  const {
    initialReady,
    chatSide,
    chatScreen,
    messages,
    userId,
    isConnected,
    socket,
    showEmojiPicker,
    handleEmojiPicker,
    favoriteReactions,
    readStateByUserId,
    handleSetReply,
    canvasRooms,
    messagesEndRef,
    scrollContainerRef,
    users,
  } = props;

  const [isCanvasInviteModalOpen, setIsCanvasInviteModalOpen] =
    useState<boolean>(false);
  const [canvasRoomId, setCanvasRoomId] = useState<string | null>(null);

  const wrapClass = cn(
    "w-full flex-1 flex overflow-hidden pb-0 transition-[padding,opacity] duration-400",
    chatScreen === "wide" ? "" : "lg:pr-[20%]",
    initialReady ? "opacity-100" : "opacity-0",
  );

  // ✅ 메시지 영역만 스크롤
  const scrollClass = "flex-1 overflow-y-auto hide-scrollbar";
  const asideClass = cn(
    "hidden w-[25%] shrink-0 p-4 border-r border-gray-200 lg:block",
  );

  const handleCanvasRoomClose = () => setIsCanvasInviteModalOpen(false);
  const handleCloseDrawing = () => setCanvasRoomId(null);
  const handleCreateCanvasRoom = (title: string) => {
    if (!socket.current) {
      return;
    }
    // 요청
    socket.current.emit("canvas:room:create_and_invite", {
      roomId: ROOM_ID,
      title,
      invitedUserIds: users.map((el) => el.userId),
    });
    setIsCanvasInviteModalOpen(false);
  };

  return (
    <div className={wrapClass}>
      <DrawingInviteModal
        isOpen={isCanvasInviteModalOpen}
        onClose={handleCanvasRoomClose}
        canvasRooms={canvasRooms}
        handleCreateCanvasRoom={handleCreateCanvasRoom}
      />
      <aside className={asideClass}>
        <div className="flex flex-col gap-1 h-full">
          <div className="p-1">즐겨찾기</div>
          <div className="p-1">
            그리기
            <div>
              {canvasRooms.map((el, index) => {
                const key = `${el.id}_${index}`;
                return (
                  <p
                    onClick={() => {
                      setCanvasRoomId(el.id);
                    }}
                    key={key}
                  >
                    {el.title}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
        <div className="group absolute bottom-22 p-1 h-12 bg-blue-600 transition-[height] rounded-[50px] cursor-pointer hover:h-22">
          <MailPlus
            onClick={() => {
              setIsCanvasInviteModalOpen(true);
            }}
            color="white"
            className="p-0 w-10 h-0 transition-[padding,height] hover:bg-blue-300 rounded-[50px] group-hover:p-2 group-hover:h-10"
          />
          <Plus
            color="white"
            className="p-2 w-10 h-10 rounded-[50px] group-hover:rotate-45 transition-[rotate]"
          />
        </div>
      </aside>

      <div ref={scrollContainerRef} className={scrollClass}>
        {canvasRoomId && (
          <DrawingCanvas
            socket={socket}
            userId={userId}
            users={users}
            canvasRoomId={canvasRoomId}
            handleCloseDrawing={handleCloseDrawing}
          />
        )}
        {!initialReady && <div className="w-full h-full">인스턴스준비중</div>}

        {!isConnected && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-6xl mb-4">💤</div>
            <p className="text-lg">서버가 자고있어요</p>
          </div>
        )}

        {isConnected && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-lg">채팅을 시작해주세요</p>
          </div>
        ) : (
          <MessageRenderer
            chatSide={chatSide}
            messages={messages}
            userId={userId}
            isConnected={isConnected}
            socket={socket}
            showEmojiPicker={showEmojiPicker}
            handleEmojiPicker={handleEmojiPicker}
            readStateByUserId={readStateByUserId}
            favoriteReactions={favoriteReactions}
            handleSetReply={handleSetReply}
            messagesEndRef={messagesEndRef}
            scrollContainerRef={scrollContainerRef}
          />
        )}
      </div>
    </div>
  );
}
