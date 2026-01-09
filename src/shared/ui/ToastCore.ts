import { useRef, type ReactNode } from "react";

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type ToastType = "success" | "error" | "warning" | "info" | "loading";

export interface ToastProps {
  toast: string;
  type?: ToastType;
  position?: ToastPosition;
  duration?: number;
  showCloseButton?: boolean;
  className?: string;
  icon?: ReactNode;
  onClose?: () => void;
  onClick?: () => void;
}

export interface ToastHookReturn {
  showToast: (props: ToastProps) => string;
  dismissToast: (toastId: string) => void;
  dismissAllToast: () => void;
}

// 토스트 아이템 인터페이스
export interface ToastItem {
  id: string;
  props: ToastProps;
  visible: boolean;
  timer?: ReturnType<typeof setTimeout>;
}

// 전역 토스트 관리자
export class ToastManager {
  private static instance: ToastManager;
  private containers: Map<ToastPosition, (toasts: ToastItem[]) => void> =
    new Map();
  private toasts: Map<ToastPosition, ToastItem[]> = new Map();

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  registerContainer(
    position: ToastPosition,
    setToasts: (toasts: ToastItem[]) => void,
  ) {
    this.containers.set(position, setToasts);
    const existingToasts = this.toasts.get(position) || [];
    setToasts(existingToasts);
  }

  addToast(props: ToastProps): string {
    const position = props.position || "top-center";
    const duration = props.duration !== undefined ? props.duration : 1500;
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newToast: ToastItem = {
      id,
      props,
      visible: true,
    };

    const positionToasts = this.toasts.get(position) || [];
    const updatedToasts = [...positionToasts, newToast];
    this.toasts.set(position, updatedToasts);

    const setToasts = this.containers.get(position);
    if (setToasts) {
      setToasts(updatedToasts);
    }

    if (duration !== Infinity) {
      const timer = setTimeout(() => {
        this.removeToast(id);
      }, duration);

      newToast.timer = timer;
    }

    return id;
  }

  removeToast(id: string) {
    for (const [position, toasts] of this.toasts.entries()) {
      const toast = toasts.find((t) => t.id === id);
      if (toast) {
        if (toast.timer) {
          clearTimeout(toast.timer);
        }

        const updatedToasts = toasts.filter((t) => t.id !== id);
        this.toasts.set(position, updatedToasts);

        const setToasts = this.containers.get(position);
        if (setToasts) {
          setToasts(updatedToasts);
        }
        break;
      }
    }
  }

  removeAllToasts() {
    for (const toasts of this.toasts.values()) {
      toasts.forEach((toast) => {
        if (toast.timer) {
          clearTimeout(toast.timer);
        }
      });
    }

    this.toasts.clear();

    for (const [, setToasts] of this.containers.entries()) {
      setToasts([]);
    }
  }
}

export const useToast = (): ToastHookReturn => {
  const managerRef = useRef(ToastManager.getInstance());

  const showToast = (props: ToastProps): string => {
    return managerRef.current.addToast(props);
  };

  const dismissToast = (toastId: string) => {
    managerRef.current.removeToast(toastId);
  };

  const dismissAllToast = () => {
    managerRef.current.removeAllToasts();
  };

  return {
    showToast,
    dismissToast,
    dismissAllToast,
  };
};

// 편의 함수들
export const toast = {
  success: (toast: string, options?: Omit<ToastProps, "toast" | "type">) => {
    return ToastManager.getInstance().addToast({
      toast,
      type: "success",
      ...options,
    });
  },
  error: (toast: string, options?: Omit<ToastProps, "toast" | "type">) => {
    return ToastManager.getInstance().addToast({
      toast,
      type: "error",
      ...options,
    });
  },
  warning: (toast: string, options?: Omit<ToastProps, "toast" | "type">) => {
    return ToastManager.getInstance().addToast({
      toast,
      type: "warning",
      ...options,
    });
  },
  info: (toast: string, options?: Omit<ToastProps, "toast" | "type">) => {
    return ToastManager.getInstance().addToast({
      toast,
      type: "info",
      ...options,
    });
  },
  loading: (toast: string, options?: Omit<ToastProps, "toast" | "type">) => {
    return ToastManager.getInstance().addToast({
      toast,
      type: "loading",
      ...options,
    });
  },
  dismissToast: (toastId: string) => {
    ToastManager.getInstance().removeToast(toastId);
  },
  dismissAllToast: () => {
    ToastManager.getInstance().removeAllToasts();
  },
};
