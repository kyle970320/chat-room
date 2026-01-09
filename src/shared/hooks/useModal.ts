import { useCallback } from "react";

import { useSearchParams } from "react-router";

/**
 * URL query parameter를 사용하여 모달을 관리하는 hook
 * @param modalKey - URL query parameter에 사용될 키 (예: "modal", "dialog")
 * @returns { isOpen, openModal, closeModal }
 */
export const useModal = (modalKey: string = "modal") => {
  const [searchParams, setSearchParams] = useSearchParams();

  const isOpen = searchParams.get(modalKey) === "true";

  const openModal = useCallback(() => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set(modalKey, "true");
      return newParams;
    });
  }, [modalKey, setSearchParams]);

  const closeModal = useCallback(() => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.delete(modalKey);
      return newParams;
    });
  }, [modalKey, setSearchParams]);

  return {
    isOpen,
    openModal,
    closeModal,
  };
};
