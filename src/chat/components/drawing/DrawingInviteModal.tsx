import { Modal, ModalBody, ModalContent } from "@/shared/ui/Modal";
import type { CanvasRoomSummary } from "../../types/canvas";
import { useState } from "react";
import { Plus, Send } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  canvasRooms: Array<CanvasRoomSummary>;
  handleCreateCanvasRoom: (title: string) => void;
}

export default function DrawingInviteModal(props: Props) {
  const { isOpen, onClose, canvasRooms, handleCreateCanvasRoom } = props;
  const [showNewRoomInput, setShowNewRoomInput] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const handleNewRoomClick = () => {
    setShowNewRoomInput(true);
  };

  const handleRoomClick = () => {
    setShowNewRoomInput(false);
  };

  const handleCreateAndInvite = () => {
    if (newRoomName.trim()) {
      setNewRoomName("");
      setShowNewRoomInput(false);
      onClose();
      handleCreateCanvasRoom(newRoomName);
    }
  };
  return (
    <Modal
      contentClassName="h-[500px] rounded-2xl overflow-hidden"
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalContent className="h-full overflow-y-auto flex flex-col">
        <ModalBody className="hide-scrollbar flex flex-col flex-1">
          <div className="w-full max-w-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              초대할 방 선택
            </h2>

            <div className="mb-4">
              {!showNewRoomInput ? (
                <button
                  onClick={handleNewRoomClick}
                  className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <Plus size={20} />
                  <span className="font-semibold">새 방 만들기</span>
                </button>
              ) : (
                <div className="p-4 rounded-lg border-2 border-indigo-500 bg-indigo-50">
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="방 이름 입력"
                    autoFocus
                    className="w-full px-3 py-2 mb-3 border border-gray-300 rounded focus:outline-none focus:border-indigo-500"
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleCreateAndInvite()
                    }
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateAndInvite}
                      className="flex-1 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send size={16} />
                      생성 및 초대
                    </button>
                    <button
                      onClick={() => {
                        setShowNewRoomInput(false);
                        setNewRoomName("");
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-3 px-1">
                기존 방 선택
              </h3>
              <div className="space-y-2">
                {canvasRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={handleRoomClick}
                    className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left"
                  >
                    <div>
                      <div className="font-semibold text-gray-800">
                        {room.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {room.memberCount}명
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
