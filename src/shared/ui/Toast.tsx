import { useEffect, useRef, useState } from "react";
import type { ReactNode, CSSProperties } from "react";
import { createPortal } from "react-dom";

// core
import {
  ToastManager,
  type ToastPosition,
  type ToastType,
  type ToastItem,
} from "@/shared/ui/ToastCore";

// 토스트 컨테이너 컴포넌트
const ToastContainer = ({ position }: { position: ToastPosition }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const managerRef = useRef(ToastManager.getInstance());

  useEffect(() => {
    managerRef.current.registerContainer(position, setToasts);
  }, [position]);

  // 위치별 스타일 계산
  const getContainerStyles = (): CSSProperties => {
    const baseStyles: CSSProperties = {
      position: "fixed",
      // TODO: z-index 상수로 관리할 것
      zIndex: 9999,
      pointerEvents: "none",
    };

    const positionStyles = {
      "top-left": { top: "1rem", left: "1rem" },
      "top-center": { top: "1rem", left: "50%", transform: "translateX(-50%)" },
      "top-right": { top: "1rem", right: "1rem" },
      "middle-left": {
        top: "50%",
        left: "1rem",
        transform: "translateY(-50%)",
      },
      "bottom-left": { bottom: "1rem", left: "1rem" },
      "bottom-center": {
        bottom: "1rem",
        left: "50%",
        transform: "translateX(-50%)",
      },
      "bottom-right": { bottom: "1rem", right: "1rem" },
    };

    return { ...baseStyles, ...positionStyles[position] };
  };

  return createPortal(
    <div style={getContainerStyles()}>
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={(id) => managerRef.current.removeToast(id)}
        />
      ))}
    </div>,
    document.body,
  );
};

// 개별 토스트 아이템 컴포넌트
const ToastItem = ({
  toast,
  onRemove,
}: {
  toast: ToastItem;
  onRemove: (id: string) => void;
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onRemove(toast.id);
    }, 150); // 애니메이션 시간
  };

  const handleClick = () => {
    toast.props.onClick?.();
  };

  // 메시지 타입별 스타일
  const getTypeStyles = (type: ToastType): string => {
    const baseStyles =
      "px-4 py-3 rounded-lg shadow-lg border flex items-center gap-3 min-w-[300px] max-w-[500px] pointer-events-auto";

    const typeStyles = {
      success: "bg-green-50 border-green-200 text-green-800",
      error: "bg-red-50 border-red-200 text-red-800",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      info: "bg-blue-50 border-blue-200 text-blue-800",
      loading: "bg-gray-50 border-gray-200 text-gray-800",
    };

    return `${baseStyles} ${typeStyles[type]}`;
  };

  // 메시지 타입별 기본 아이콘
  const getDefaultIcon = (type: ToastType): ReactNode => {
    const icons = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "ℹ",
      loading: "⟳",
    };

    return (
      <span className={`text-lg ${type === "loading" ? "animate-spin" : ""}`}>
        {icons[type]}
      </span>
    );
  };

  // 닫기 버튼 스타일
  const getCloseButtonStyles = (type: ToastType): string => {
    const baseStyles =
      "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1";

    const typeStyles = {
      success:
        "text-green-500 hover:text-green-700 hover:bg-green-100 active:bg-green-200 focus:ring-green-300",
      error:
        "text-red-500 hover:text-red-700 hover:bg-red-100 active:bg-red-200 focus:ring-red-300",
      warning:
        "text-yellow-500 hover:text-yellow-700 hover:bg-yellow-100 active:bg-yellow-200 focus:ring-yellow-300",
      info: "text-blue-500 hover:text-blue-700 hover:bg-blue-100 active:bg-blue-200 focus:ring-blue-300",
      loading:
        "text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus:ring-gray-300",
    };

    return `${baseStyles} ${typeStyles[type]}`;
  };

  return (
    <div
      className={`${getTypeStyles(toast.props.type || "info")} ${
        isVisible
          ? "animate-in slide-in-from-top-2 duration-300"
          : "animate-out slide-out-to-top-2 duration-150"
      } mb-2 cursor-pointer`}
      onClick={handleClick}
    >
      {toast.props.icon || getDefaultIcon(toast.props.type || "info")}
      <span className="flex-1 text-sm font-medium">{toast.props.toast}</span>
      {toast.props.showCloseButton !== false && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className={getCloseButtonStyles(toast.props.type || "info")}
          title="닫기"
          aria-label="메시지 닫기"
        >
          <span className="text-sm font-medium">✕</span>
        </button>
      )}
    </div>
  );
};

// 토스트 컨테이너들을 렌더링하는 컴포넌트
export const ToastProvider = () => {
  const positions: ToastPosition[] = [
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
  ];

  return (
    <>
      {positions.map((position) => (
        <ToastContainer key={position} position={position} />
      ))}
    </>
  );
};
