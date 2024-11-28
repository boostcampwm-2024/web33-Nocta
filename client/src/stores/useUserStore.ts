import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useShallow } from "zustand/shallow";

interface UserStore {
  id: string | null;
  name: string | null;
  accessToken: string | null;
  actions: {
    setUserInfo: (id: string, name: string, accessToken: string) => void;
    removeUserInfo: () => void;
    getUserInfo: () => { id: string | null; name: string | null; accessToken: string | null };
    updateAccessToken: (accessToken: string) => void;
    checkAuth: () => boolean;
  };
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      id: null,
      name: null,
      accessToken: null,
      actions: {
        setUserInfo: (id: string, name: string, accessToken: string) =>
          set(() => ({ id, name, accessToken })),
        removeUserInfo: () => {
          set(() => ({ id: null, name: null, accessToken: null }));
          sessionStorage.removeItem("nocta-storage");
        },
        getUserInfo: () => {
          const state = get();
          return {
            id: state.id,
            name: state.name,
            accessToken: state.accessToken,
          };
        },
        updateAccessToken: (accessToken: string) => set(() => ({ accessToken })),
        checkAuth: () => {
          const state = get();
          return !!(state.id && state.name && state.accessToken);
        },
      },
    }),
    {
      name: "nocta-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        id: state.id,
        name: state.name,
        accessToken: state.accessToken,
      }),
    },
  ),
);

// store 값을 변경하는 부분. 주로 api 코드에서 사용
export const useUserActions = () => useUserStore((state) => state.actions);

// store 값을 사용하는 부분. 주로 component 내부에서 사용
export const useUserInfo = () =>
  useUserStore(
    // state 바뀜에 따라 재렌더링 되도록
    useShallow((state) => ({
      id: state.id,
      name: state.name,
      accessToken: state.accessToken,
    })),
  );

export const useCheckLogin = () =>
  useUserStore((state) => !!(state.id && state.name && state.accessToken));
