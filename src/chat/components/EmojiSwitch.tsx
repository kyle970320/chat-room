import { SmilePlus, X, ChevronLeft } from "lucide-react";
import { EMOJI_LIST } from "../config/emoji";
import { useEffect, useMemo, useState } from "react";
import type { FavoriteReaction } from "../types/message";
import { getRandomEmoji } from "../utils/text";
import { cn } from "../../lib/utils";

interface Props {
  emojiValue: string;
  favoriteReactions: Array<FavoriteReaction>;
  handleClickEmoji: (emoji: string) => void;
  handleClickEmojiPanel: (value: boolean) => void;
}

export default function EmojiSwich(props: Props) {
  const {
    emojiValue,
    favoriteReactions,
    handleClickEmoji,
    handleClickEmojiPanel,
  } = props;

  // ✅ 요약(자주+랜덤) / 전체 패널 토글
  const [isMoreEmoji, setIsMoreEmoji] = useState(false);

  // ✅ 전체 패널 DOM을 "열릴 때만" 마운트하고, 애니메이션 후 언마운트
  const [mountAll, setMountAll] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const viewEmoji = useMemo(() => {
    const favoriteEmoji = [...favoriteReactions]
      .sort((a, b) => b.count - a.count)
      .map((el) => el.emoji);

    const need = Math.max(0, 4 - favoriteEmoji.length);
    const randomEmoji = getRandomEmoji(need);
    return [...favoriteEmoji, ...randomEmoji];
  }, [favoriteReactions]);

  useEffect(() => {
    if (isMoreEmoji) {
      requestAnimationFrame(() => {
        setMountAll(true);
      });
      requestAnimationFrame(() => setShowAll(true));
    } else {
      requestAnimationFrame(() => {
        setShowAll(false);
      });
      const t = setTimeout(() => setMountAll(false), 200);
      return () => clearTimeout(t);
    }
  }, [isMoreEmoji]);

  useEffect(() => {
    if (emojiValue) {
      requestAnimationFrame(() => {
        setIsMoreEmoji(false);
      });
    }
  }, [emojiValue]);

  const emojiSwichClass = cn(
    "absolute left-1/2 -translate-x-1/2 max-w-md pt-1 px-3 bottom-full w-full bg-black/40 rounded-t-4xl overflow-hidden",
    "transition-[height] duration-200 ease-out",
    isMoreEmoji ? "h-60" : "h-40",
  );

  if (!emojiValue) {
    return (
      <div className={emojiSwichClass}>
        <div className="relative w-full h-full">
          {/* 1) 즐겨찾기/랜덤 뷰 */}
          <div
            className={cn(
              "absolute inset-0 flex flex-wrap justify-center items-center gap-1 overflow-y-scroll hide-scrollbar",
              "transition-[opacity,transform] duration-200 ease-out will-change-[opacity,transform]",
              isMoreEmoji
                ? "opacity-0 scale-95 pointer-events-none"
                : "opacity-100 scale-100 pointer-events-auto",
            )}
          >
            {viewEmoji.map((el, index) => (
              <button
                key={`${el}-${index}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClickEmoji(el);
                }}
                className="text-5xl w-20 h-20 p-1 rounded-xl transition-colors cursor-pointer hover:bg-blue-500"
              >
                {el}
              </button>
            ))}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMoreEmoji(true);
              }}
              className="w-20 h-20 p-3 text-white rounded-xl transition-colors cursor-pointer hover:bg-blue-500"
            >
              <SmilePlus className="w-full h-full" />
            </button>
          </div>

          {mountAll && (
            <div
              className={cn(
                "absolute inset-0 flex flex-wrap items-center gap-1 overflow-y-scroll hide-scrollbar",
                "transition-[opacity,transform] duration-200 ease-out will-change-[opacity,transform]",
                showAll
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-105 pointer-events-none",
              )}
            >
              <button
                className="absolute left-2 top-2 p-2 rounded-xl text-white/90 hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMoreEmoji(false);
                }}
                aria-label="Back"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {EMOJI_LIST.map((el, index) => (
                <button
                  key={`${el}-${index}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClickEmoji(el);
                  }}
                  className="text-3xl p-1 py-2 rounded-lg transition-colors cursor-pointer hover:bg-blue-500"
                >
                  {el}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute left-1/2 -translate-x-1/2 pt-1 px-5 hide-scrollbar overflow-y-scroll max-w-md bottom-full w-full h-40 bg-black/40 rounded-t-4xl">
      <button
        className="absolute right-2 top-2"
        onClick={(e) => {
          e.stopPropagation();
          handleClickEmojiPanel(false);
          handleClickEmoji("");
          setIsMoreEmoji(false);
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
