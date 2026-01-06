interface Props {
  showHeader: boolean;
  isMyMessage: boolean;
  avatarUrl: string;
}
export default function MessageAvatar(props: Props) {
  const { showHeader, isMyMessage, avatarUrl } = props;
  if (isMyMessage) {
    return null;
  }
  if (showHeader) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm flex-shrink-0">
        {avatarUrl}
      </div>
    );
  } else {
    return <div className="w-8"></div>;
  }
}
