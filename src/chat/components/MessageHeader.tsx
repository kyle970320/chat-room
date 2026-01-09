import { useState, type RefObject } from "react";
import SettingModal from "./SettingModal";
import { Settings, Wifi, WifiOff } from "lucide-react";
import { AVATAR_LIST } from "../config/emoji";
import type { Socket } from "socket.io-client";

interface Props {
  socket: RefObject<Socket | null>;
  isConnected: boolean;
  userIp: string;
  username: string;
  myAvatar: string;
  showAvatarPicker: boolean;
  handleMyAvatar: (value: string) => void;
  handleAvatarPicker: (value: boolean) => void;
}
export default function MessageHeader(props: Props) {
  const {
    isConnected,
    socket,
    userIp,
    username,
    myAvatar,
    showAvatarPicker,
    handleMyAvatar,
    handleAvatarPicker,
  } = props;
  const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);
  const handleSettingModalOpen = (value: boolean) => {
    setIsSettingModalOpen(value);
  };
  return (
    <div className="bg-blue-600 text-white p-4 shadow-md flex items-center justify-between">
      <SettingModal
        username={username}
        userIp={userIp}
        isOpen={isSettingModalOpen}
        onOk={() => {
          handleSettingModalOpen(false);
        }}
        onCancel={() => {
          handleSettingModalOpen(false);
        }}
        onClose={() => {
          handleSettingModalOpen(false);
        }}
      />
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
              handleAvatarPicker(!showAvatarPicker);
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
                      handleMyAvatar(avatar);
                      handleAvatarPicker(false);
                      if (socket.current && isConnected) {
                        socket.current.emit("me:update", {
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
        <div
          onClick={() => {
            handleSettingModalOpen(true);
          }}
          className="w-12 h-12 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center text-2xl transition-colors cursor-pointer"
        >
          <Settings className="text-black" />
        </div>
      </div>
    </div>
  );
}
