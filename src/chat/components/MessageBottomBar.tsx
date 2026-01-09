import { useEffect, useRef, useState, type RefObject } from "react";
import { ROOM_ID } from "../config/room";
import type { Socket } from "socket.io-client";
import { ArrowBigDown, Laugh, Send, X } from "lucide-react";
import EmojiSwich from "./EmojiSwitch";
import type {
  ChatMessage,
  ChatScreenType,
  FavoriteReaction,
} from "../types/message";
import { cn } from "@/lib/utils";
import { chatFullTime } from "@/shared/config/utils";
import { scrollToBottom } from "../utils/text";

interface Props {
  chatScreen: ChatScreenType;
  isConnected: boolean;
  socket: RefObject<Socket | null>;
  emojiValue: string;
  isOpenEmojiPanel: boolean;
  favoriteReactions: Array<FavoriteReaction>;
  replyMessage: ChatMessage | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  handleEmojiValue: (value: string) => void;
  handleEmojiPanel: (value: boolean) => void;
  handleSetReply: (value: ChatMessage | null) => void;
}
export default function MessageBottomBar(props: Props) {
  const {
    socket,
    isConnected,
    chatScreen,
    emojiValue,
    isOpenEmojiPanel,
    favoriteReactions,
    replyMessage,
    messagesEndRef,
    scrollContainerRef,
    handleEmojiValue,
    handleEmojiPanel,
    handleSetReply,
  } = props;
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const bottomBarClass = cn(
    "flex gap-2 mx-auto transition-[width] duration-400",
    chatScreen === "wide" ? "lg:w-full" : "lg:w-[60%]",
  );
  const handleSend = () => {
    const text = emojiValue + inputText.trim();
    if (!text) return;

    if (socket.current && isConnected) {
      socket.current.emit("send", {
        roomId: ROOM_ID,
        text,
        replyToMessageId: replyMessage?.id ?? null,
        type: "text",
      });
      setInputText("");
    }
    setTimeout(() => {
      scrollToBottom(scrollContainerRef, true);
    }, 10);
    handleEmojiPanel(false);
    handleEmojiValue("");
    handleSetReply(null);
  };
  const handleClickEmoji = (el: string) => {
    handleEmojiValue(el);
  };
  const handleClickEmojiPanel = (value: boolean) => {
    handleEmojiPanel(value);
  };
  const handleBottomArrow = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "Enter") {
      handleSend();
      setInputText("");
    }
    if (e.key === "Enter" && e.nativeEvent.isComposing === false) {
      setInputText("");
    }
  };

  useEffect(() => {
    if (replyMessage) {
      inputRef.current?.focus();
    }
  }, [replyMessage]);

  return (
    <div className="relative p-4 bg-white border-t">
      {isOpenEmojiPanel && (
        <EmojiSwich
          emojiValue={emojiValue}
          favoriteReactions={favoriteReactions}
          handleClickEmoji={handleClickEmoji}
          handleClickEmojiPanel={handleClickEmojiPanel}
        />
      )}
      {replyMessage && (
        <div className="absolute left-1/2 -translate-x-1/2 pt-2.5 px-5 hide-scrollbar overflow-y-scroll min-h-20 max-w-md bottom-full w-full bg-blue-400 text-white rounded-t-2xl">
          <div className="flex items-center">
            <p className="text-base font-bold">{replyMessage.name}</p>
            <p className="text-sm ml-2">{chatFullTime(replyMessage.ts)}</p>
            <button
              className="absolute right-2 top-2"
              onClick={(e) => {
                e.stopPropagation();
                handleClickEmojiPanel(false);
                handleClickEmoji("");
                handleSetReply(null);
              }}
            >
              <X className="w-6 h-6 cursor-pointer" />
            </button>
          </div>
          <div className="py-3 text-base wrap-break-word font-semibold">
            {replyMessage.text}
          </div>
        </div>
      )}
      <div className={bottomBarClass}>
        <input
          ref={inputRef}
          maxLength={100}
          type="text"
          value={inputText}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isConnected
              ? "메시지를 입력하세요..."
              : "서버 연결을 기다리는 중..."
          }
          disabled={!isConnected}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClickEmojiPanel(!isOpenEmojiPanel);
            handleClickEmoji("");
          }}
          disabled={!isConnected}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Laugh className="w-5 h-5" />
        </button>
        <button
          onClick={handleSend}
          disabled={!isConnected}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
          전송
        </button>
        <button
          onClick={handleBottomArrow}
          disabled={!isConnected}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <ArrowBigDown className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
