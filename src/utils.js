export const REACT_ELEMENT = Symbol("react.element");
export const REACT_FORWARD_REF = Symbol("react.forward_ref");
export const REACT_TEXT = Symbol("react.text");
export const CREATE = Symbol("react.dom.diff.create");
export const MOVE = Symbol("react.dom.diff.move");

export const toVNode = (node) => {
  return typeof node === "string" || typeof node === "number"
    ? {
        type: REACT_TEXT,
        props: {
          text: node,
        },
      }
    : node;
};
