import { create } from "zustand";
const useEditorStore = create((set, getState, store) => {
  return {
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
