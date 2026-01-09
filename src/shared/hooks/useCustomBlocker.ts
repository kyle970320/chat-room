import { useEffect } from "react";

// hooks
import { useBlockModalConfirm } from "@/shared/hooks/useBlockModalConfirm";
import { useBlocker, useNavigate } from "react-router";

interface UseBlockerType {
  condition: boolean;
}

interface BlockType {
  message: string;
  okText?: string;
  cancelText?: string;
  onOkCallback?: () => void;
  onCancelCallback?: () => void;
}

export const useCustomBlocker = (props: UseBlockerType) => {
  const { condition } = props;
  const navigate = useNavigate();
  const { promiseConfirm } = useBlockModalConfirm();

  const handleLogout = () => {
    // clearUserToken();
    navigate("/login");
  };

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    const { state } = nextLocation;
    if (!condition && state === "logout") {
      handleLogout();
    }
    return condition && currentLocation.pathname !== nextLocation.pathname;
  });

  useEffect(() => {
    const handleBeforeUnload = (event: {
      preventDefault: () => void;
      returnValue: string;
    }) => {
      if (condition) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [condition]);

  const block = async (props: BlockType) => {
    const { message } = props;
    const { state, location } = blocker;

    if (state === "blocked") {
      try {
        const confirmed = await promiseConfirm({
          content: message,
        });

        if (confirmed) {
          blocker.proceed();
          if (location.state === "logout") {
            handleLogout();
          }
        } else {
          blocker.reset();
        }
      } catch {
        // 에러 발생 시에도 reset하여 다음 네비게이션을 허용
        blocker.reset();
      }
    }
  };
  return { block };
};
