import { useState, type RefObject } from "react";
import { ROOM_ID } from "../config/room";
import type { Socket } from "socket.io-client";
import { ArrowBigDown, Laugh, Send } from "lucide-react";
import EmojiSwich from "./EmojiSwitch";

interface Props {
  isConnected: boolean;
  socket: RefObject<Socket | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}
export default function MessageBottomBar(props: Props) {
  const { socket, isConnected, messagesEndRef } = props;
  const [inputText, setInputText] = useState("");
  const [isOpenEmojiPanel, setIsOpenEmojiPanel] = useState<boolean>(false);
  const [emojiValue, setEmojiValue] = useState<string>("");
  const handleSend = () => {
    const text = emojiValue + inputText.trim();
    if (!text) return;

    if (socket.current && isConnected) {
      socket.current.emit("send", {
        roomId: ROOM_ID,
        text,
      });
      setInputText("");
    }
    setIsOpenEmojiPanel(false);
    setEmojiValue("");
  };
  const handleClickEmoji = (el: string) => {
    setEmojiValue(el);
  };
  const handleClickEmojiPanel = (value: boolean) => {
    setIsOpenEmojiPanel(value);
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
  return (
    <div className="relative p-4 bg-white border-t">
      <EmojiSwich
        isOpenEmojiPanel={isOpenEmojiPanel}
        emojiValue={emojiValue}
        handleClickEmoji={handleClickEmoji}
        handleClickEmojiPanel={handleClickEmojiPanel}
      />
      <div className="flex gap-2">
        <input
          maxLength={50}
          type="text"
          value={inputText}
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
          onClick={() => {
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
