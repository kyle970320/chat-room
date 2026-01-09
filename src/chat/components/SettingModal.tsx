import { Button } from "@/shared/ui/Button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/shared/ui/Modal";
import { useSettingChat } from "../hooks/useSettingChat";
import { useState } from "react";
import type { ChatScreenType, ChatSideType } from "../types/message";

interface Props {
  username: string;
  userIp: string;
  isOpen: boolean;
  onOk: () => void;
  onClose: () => void;
  onCancel: () => void;
}
export default function SettingModal(props: Props) {
  const { username, userIp, isOpen, onClose, onOk, onCancel } = props;
  const { chatScreen, chatSide, changeChatSide, changeChatScreen } =
    useSettingChat();
  const [localChatScreen, setLocalChatScreen] =
    useState<ChatScreenType>(chatScreen);
  const [localChatSide, setLocalChatSide] = useState<ChatSideType>(chatSide);

  const handleSave = () => {
    changeChatScreen(localChatScreen);
    changeChatSide(localChatSide);
    onOk();
  };

  return (
    <Modal
      contentClassName="h-[90vh] rounded-2xl overflow-hidden"
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalContent className="w-full h-full flex flex-col">
        <ModalHeader className="bg-gray-100 p-4">
          <h2 className="text-lg font-bold text-gray-900">설정</h2>
        </ModalHeader>
        <ModalBody className="hide-scrollbar flex flex-col bg-gray-100 flex-1">
          <div className="flex flex-col gap-4">
            <div className="flex gap-15 pb-2 border-b">
              <p className="w-20">유저 이름</p>
              <p className="font-semibold">{username}</p>
            </div>
            <div className="flex gap-15 pb-2 border-b">
              <p className="w-20">유저 아이피</p>
              <p className="font-semibold">{userIp}</p>
            </div>
            <p className="font-semibold">화면크기</p>
            <div className="flex justify-center gap-10  pb-2 border-b">
              <div
                onClick={() => {
                  setLocalChatScreen("wide");
                }}
                className="w-2/5 cursor-pointer"
              >
                <img
                  className={`h-34 object-contain transition-[background] ${localChatScreen === "wide" ? "bg-blue-300" : "bg-gray-400 hover:bg-blue-200"}`}
                  src="/chat/full-screen.svg"
                  alt=""
                />

                <p className="mt-1">넓게</p>
              </div>
              <div
                onClick={() => {
                  setLocalChatScreen("narrow");
                }}
                className="w-2/5 cursor-pointer"
              >
                <img
                  className={`h-34 w-full flex justify-center object-contain transition-[background] ${localChatScreen === "narrow" ? "bg-blue-300" : "bg-gray-400 hover:bg-blue-200"}`}
                  src="/chat/center-screen.svg"
                  alt=""
                />
                <p className="mt-1">좁게</p>
              </div>
            </div>
            <p className="font-semibold">채팅스타일</p>
            <div className="flex justify-center gap-10 pb-2 border-b">
              <div
                onClick={() => {
                  setLocalChatSide("both");
                }}
                className="w-2/5 cursor-pointer"
              >
                <img
                  className={`h-34 object-contain transition-[background] ${localChatSide === "both" ? "bg-blue-300" : "bg-gray-400 hover:bg-blue-200"}`}
                  src="/chat/full-screen.svg"
                  alt=""
                />
                <p className="mt-1">구분되게</p>
              </div>
              <div
                className="w-2/5 cursor-pointer"
                onClick={() => {
                  setLocalChatSide("left");
                }}
              >
                <div>
                  <img
                    className={`h-34 object-contain transition-[background] ${localChatSide === "left" ? "bg-blue-300" : "bg-gray-400 hover:bg-blue-200"}`}
                    src="/chat/oneline-chat.svg"
                    alt=""
                  />
                  <p className="mt-1">한쪽으로</p>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="bg-gray-50 border-gray-200">
          <Button variant="save" onClick={handleSave}>
            확인
          </Button>
          <Button variant="reset" onClick={onCancel}>
            취소
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
