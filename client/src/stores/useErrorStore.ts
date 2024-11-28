import { create } from "zustand";

interface ErrorStore {
  isErrorModalOpen: boolean;
  errorMessage: string;
  setErrorModal: (isOpen: boolean, message?: string) => void;
}

export const useErrorStore = create<ErrorStore>((set) => ({
  isErrorModalOpen: false,
  errorMessage: "",
  setErrorModal: (isOpen, message = "") => set({ isErrorModalOpen: isOpen, errorMessage: message }),
}));
