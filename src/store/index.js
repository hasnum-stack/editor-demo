import { create } from "zustand";
const useEditorStore = create((setState, getState, store) => {
  return {
    hint: "",
    setHint: (hint) => {
      setState({ hint });
    },
  };
});
export { useEditorStore };
