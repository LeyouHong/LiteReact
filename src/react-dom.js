import { REACT_ELEMENT, REACT_FORWARD_REF } from "./utils";
import { addEvent } from "./event";

function render(VNode, containerDom) {
  // 虚拟dom转化成真实dom
  // 将得到的真实dom挂载到containerDom里
  mount(VNode, containerDom);
}

function mount(VNode, containerDom) {
  const newDom = createDOM(VNode);
  newDom && containerDom.appendChild(newDom);
}

function createDOM(VNode) {
  // 1.创建元素. 2.处理子元素. 3.处理属性
  const { type, props, ref } = VNode;
  let dom;

  // 处理forwardRef
  if (type && VNode.$$typeof === REACT_FORWARD_REF) {
    return getDomByForwardRefFunction(VNode);
  }

  // 处理类组件
  if (
    typeof type === "function" &&
    VNode.$$typeof === REACT_ELEMENT &&
    type.IS_CLASS_COMPONENT
  ) {
    return getDomByClassComponent(VNode);
  }

  // 处理函数组件
  if (typeof type === "function" && VNode.$$typeof === REACT_ELEMENT) {
    return getDomByFunctionComponent(VNode);
  }

  if (type && VNode.$$typeof === REACT_ELEMENT) {
    dom = document.createElement(type);
  }

  if (props) {
    if (typeof props.children === "object" && props.children.type) {
      mount(props.children, dom);
    } else if (Array.isArray(props.children)) {
      mountArray(props.children, dom);
    } else if (typeof props.children === "string") {
      dom.appendChild(document.createTextNode(props.children));
    }
  }
  setPropsForDOM(dom, props);
  VNode.dom = dom;
  // 处理原生ref
  ref && (ref.current = dom);
  return dom;
}

function getDomByForwardRefFunction(VNode) {
  const { type, props, ref } = VNode;
  const renderVNode = type.render(props, ref);
  if (!renderVNode) return null;
  return createDOM(renderVNode);
}

function getDomByFunctionComponent(VNode) {
  const { type, props } = VNode;
  let renderVNode = type(props);
  if (!renderVNode) return null;
  return createDOM(renderVNode);
}

function getDomByClassComponent(VNode) {
  const { type, props, ref } = VNode;
  const instance = new type(props);
  const renderVNode = instance.render();
  instance.oldVNode = renderVNode;
  ref && (ref.current = instance);
  // TODO: need delete start
  //   setTimeout(() => {
  //     instance.setState({ xxx: "66666666" });
  //   }, 3000);
  // TODO: need delete end
  if (!renderVNode) return null;
  return createDOM(renderVNode);
}

function mountArray(children, parent) {
  if (!Array.isArray(children)) {
    return;
  }
  for (let i = 0; i < children.length; i++) {
    if (typeof children[i] === "string")
      parent.appendChild(document.createTextNode(children[i]));
    else mount(children[i], parent);
  }
}

function setPropsForDOM(dom, VNodeProps = {}) {
  if (!dom) return;
  for (const key in VNodeProps) {
    if (key === "children") continue;
    if (/^on[A-Z].*/.test(key)) {
      addEvent(dom, key.toLowerCase(), VNodeProps[key]);
    } else if (key === "style") {
      Object.keys(VNodeProps[key]).forEach((styleName) => {
        dom.style[styleName] = VNodeProps[key][styleName];
      });
    } else {
      dom[key] = VNodeProps[key];
    }
  }
}

export function findDomByVNode(VNode) {
  if (!VNode) return;
  if (VNode.dom) return VNode.dom;
}

export function updateDomTree(oldDOM, newVNode) {
  const parentNode = oldDOM.parentNode;
  parentNode.removeChild(oldDOM);
  parentNode.appendChild(createDOM(newVNode));
}

const ReactDOM = {
  render,
};

export default ReactDOM;
