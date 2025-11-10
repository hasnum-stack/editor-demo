import { create } from 'zustand';
import { nanoid } from 'nanoid';

const initialRootId = 'root';

const useEditorStore = create((set, get) => ({
  nodes: {
    [initialRootId]: { id: initialRootId, type: 'Form', props: {}, children: [] },
  },
  rootId: initialRootId,
  selectedId: null,
  addNode: (nodePartial, parentId = initialRootId, index = -1) => {
    const id = nodePartial.id ?? nanoid();
    const node = {
      id,
      type: nodePartial.type ?? 'Field',
      props: nodePartial.props ?? {},
      parent: parentId,
      children: nodePartial.children ?? [],
    };
    set(state => {
      state.nodes[id] = node;
      const parent = state.nodes[parentId];
      if (!parent.children) parent.children = [];
      // insert at index if provided, otherwise append
      if (index >= 0 && index <= parent.children.length) parent.children.splice(index, 0, id);
      else parent.children.push(id);
      return { nodes: { ...state.nodes } };
    });
    return id;
  },
  moveNode: (id, newParentId, index = -1) => {
    set(state => {
      const node = state.nodes[id];
      if (!node) return state;
      // remove from old parent
      const oldParent = state.nodes[node.parent];
      if (oldParent && oldParent.children) oldParent.children = oldParent.children.filter(c => c !== id);
      const newParent = state.nodes[newParentId];
      if (!newParent.children) newParent.children = [];
      if (index < 0 || index > newParent.children.length) newParent.children.push(id);
      else newParent.children.splice(index, 0, id);
      node.parent = newParentId;
      return { nodes: { ...state.nodes } };
    });
  },
  removeNode: id => {
    set(state => {
      const node = state.nodes[id];
      if (!node) return state;
      const deleteRec = nid => {
        const n = state.nodes[nid];
        if (!n) return;
        (n.children || []).forEach(deleteRec);
        delete state.nodes[nid];
      };
      deleteRec(id);
      if (node.parent) {
        state.nodes[node.parent].children = state.nodes[node.parent].children.filter(c => c !== id);
      }
      return { nodes: { ...state.nodes }, selectedId: state.selectedId === id ? null : state.selectedId };
    });
  },
  updateNodeProps: (id, patch) =>
    set(state => {
      const n = state.nodes[id];
      if (!n) return state;
      n.props = { ...(n.props || {}), ...patch };
      return { nodes: { ...state.nodes } };
    }),
  selectNode: id => set({ selectedId: id }),
  serialize: () => {
    const { nodes, rootId } = get();
    const build = id => {
      const n = nodes[id];
      const out = { type: n.type, props: n.props || {} };
      if (n.children && n.children.length) out.children = n.children.map(build);
      return out;
    };
    return build(rootId);
  },
}));

export default useEditorStore;
