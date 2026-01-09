import { useEffect, useState } from "react";
import type { ChatScreenType, ChatSideType } from "../types/message";
import { KEY_SIDE, KEY_SCREEN, EVT } from "../config/setting";

const setLS = (key: string, value: string) => {
  window.localStorage.setItem(key, value);
  window.dispatchEvent(new Event(EVT)); // 같은 탭 동기화용
};

export const useSettingChat = () => {
  const [chatSide, setChatSide] = useState<ChatSideType>(
    (window.localStorage.getItem(KEY_SIDE) as ChatSideType) || "both",
  );
  const [chatScreen, setChatScreen] = useState<ChatScreenType>(
    (window.localStorage.getItem(KEY_SCREEN) as ChatScreenType) || "narrow",
  );

  // 다른 컴포넌트에서 바뀐 값을 “구독”
  useEffect(() => {
    const sync = () => {
      setChatSide((localStorage.getItem(KEY_SIDE) as ChatSideType) || "both");
      setChatScreen(
        (localStorage.getItem(KEY_SCREEN) as ChatScreenType) || "narrow",
      );
    };
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync); // 다른 탭 동기화
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const changeChatSide = (value: ChatSideType) => setLS(KEY_SIDE, value);
  const changeChatScreen = (value: ChatScreenType) => setLS(KEY_SCREEN, value);

  return { chatSide, chatScreen, changeChatSide, changeChatScreen };
};
