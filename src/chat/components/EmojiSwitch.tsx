import { X } from "lucide-react";
import { EMOJI_LIST } from "../config/emoji";

interface Props {
  isOpenEmojiPanel: boolean;
  emojiValue: string;
  handleClickEmoji: (emoji: string) => void;
  handleClickEmojiPanel: (value: boolean) => void;
}
export default function EmojiSwich(props: Props) {
  const {
    isOpenEmojiPanel,
    emojiValue,
    handleClickEmoji,
    handleClickEmojiPanel,
  } = props;
  if (!isOpenEmojiPanel) {
    return null;
  }
  if (!emojiValue) {
    return (
      <div className="absolute pt-1 px-5 hide-scrollbar overflow-y-scroll left-0 bottom-full w-full h-40 flex flex-wrap bg-black/40 rounded-t-4xl">
        {EMOJI_LIST.map((el, index) => {
          return (
            <button
              onClick={() => {
                handleClickEmoji(el);
              }}
              key={index}
              className="text-2xl p-1 transition-all outline-blue-500 cursor-pointer hover:outline-2 "
            >
              {el}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div className="absolute pt-1 px-5 hide-scrollbar overflow-y-scroll left-0 bottom-full w-full h-40 bg-black/40 rounded-t-4xl">
      <button
        className="absolute right-2 top-2"
        onClick={() => {
          handleClickEmojiPanel(false);
          handleClickEmoji("");
        }}
      >
        <X className="w-8 h-8 cursor-pointer text-white" />
      </button>
      <div className="flex justify-center items-center h-full text-[100px]">
        {emojiValue}
      </div>
    </div>
  );
}
