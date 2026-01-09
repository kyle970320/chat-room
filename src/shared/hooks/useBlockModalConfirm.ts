import { useCallback, useRef } from "react";

import { confirmModal } from "@/widgets/confirm/model/confirmFunction";

interface BlockModalConfirmOptions {
  content?: string;
  onOk?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  okText?: string;
  cancelText?: string;
}

export const useBlockModalConfirm = () => {
  const blockCalledRef = useRef(false); // 중복 호출 방지

  const promiseConfirm = useCallback(
    (options: BlockModalConfirmOptions): Promise<boolean> => {
      if (blockCalledRef.current) {
        return Promise.resolve(false);
      }

      blockCalledRef.current = true;
      return new Promise<boolean>((res) => {
        confirmModal({
          content: options.content || "",
          onOk: async () => {
            blockCalledRef.current = false;
            res(true);
            if (options.onOk) {
              await options.onOk();
            }
          },
          onCancel: async () => {
            blockCalledRef.current = false;
            res(false);
            if (options.onCancel) {
              await options.onCancel();
            }
          },
          okText: "예",
          cancelText: "아니요",
        });
      });
    },
    [],
  );

  return { promiseConfirm };
};
