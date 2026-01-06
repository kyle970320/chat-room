
import { chatTime } from "../../shared/config/utils";

interface Props {
  showHeader: boolean;
  isMyMessage: boolean;
  name: string;
  ts: string;
}

export default function MessageWriter(props: Props) {
  const { showHeader, isMyMessage, name, ts } = props;
  if (showHeader) {
    return (
      <div
        className={`flex items-center gap-2 mb-1 ${
          isMyMessage ? "flex-row-reverse" : ""
        }`}
      >
        {!isMyMessage && (
          <span className="text-sm font-medium text-gray-700">{name}</span>
        )}
        <span className="text-xs text-gray-400">{chatTime(ts)}</span>
      </div>
    );
  }
}
