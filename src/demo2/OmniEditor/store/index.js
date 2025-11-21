import { create } from "zustand";
const useEditorStore = create((set, getState, store) => {
  return {
    list: [],
    setList: (list) => {
      set({ list });
    },
    hint: "",
    setHint: (hint) => {
      set({ hint });
    },
    overId: "",
    setOverId: (overId) => {
      set({ overId });
    },
    overEnd: () => {
      set({
        overId: "",
        hint: "",
      });
    },
  };
});
export { useEditorStore };
