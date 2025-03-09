import {
  REACT_ELEMENT,
  REACT_FORWARD_REF,
  REACT_TEXT,
  REACT_MEMO,
  CREATE,
  MOVE,
  shallowCompare,
} from "./utils";
import { addEvent } from "./event";
import { resetHookIndex } from "./hooks";
export let emitUpdateForHooks;

function render(VNode, containerDom) {
  // 虚拟dom转化成真实dom
  // 将得到的真实dom挂载到containerDom里
  mount(VNode, containerDom);
  emitUpdateForHooks = () => {
    resetHookIndex();
    updateDomTree(VNode, VNode, findDomByVNode(VNode));
  };
}

function mount(VNode, containerDom) {
  const newDom = createDOM(VNode);
  newDom && containerDom.appendChild(newDom);
}

function createDOM(VNode) {
  // 1.创建元素. 2.处理子元素. 3.处理属性
  const { type, props, ref } = VNode;
  let dom;

  // 处理memo
  if (type && type.$$typeof === REACT_MEMO) {
    return getDomByMemoFunctionComponent(VNode);
  }

  // 处理forwardRef
  if (type && type.$$typeof === REACT_FORWARD_REF) {
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

  if (type === REACT_TEXT) {
    dom = document.createTextNode(props.text);
  } else if (type && VNode.$$typeof === REACT_ELEMENT) {
    dom = document.createElement(type);
  }

  if (props) {
    if (typeof props.children === "object" && props.children.type) {
      mount(props.children, dom);
    } else if (Array.isArray(props.children)) {
      mountArray(props.children, dom);
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

function getDomByMemoFunctionComponent(VNode) {
  const { type, props } = VNode;
  const renderVNode = type.type(props);
  if (!renderVNode) return null;
  VNode.oldRenderVNode = renderVNode;
  return createDOM(renderVNode);
}

function getDomByFunctionComponent(VNode) {
  const { type, props } = VNode;
  let renderVNode = type(props);
  if (!renderVNode) return null;
  VNode.oldRenderVNode = renderVNode;
  const dom = createDOM(renderVNode);
  VNode.dom = dom;
  return dom;
}

function getDomByClassComponent(VNode) {
  const { type, props, ref } = VNode;
  const instance = new type(props);
  const renderVNode = instance.render();
  instance.oldVNode = renderVNode;
  VNode.classInstance = instance;
  ref && (ref.current = instance);

  if (!renderVNode) return null;
  const dom = createDOM(renderVNode);
  // 实现componentDidMount
  if (instance.componentDidMount) {
    instance.componentDidMount();
  }
  return dom;
}

function mountArray(children, parent) {
  if (!Array.isArray(children)) {
    return;
  }
  for (let i = 0; i < children.length; i++) {
    if (!children[i]) {
      children.splice(i, 1);
      continue;
    }
    children[i].index = i;
    mount(children[i], parent);
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

export function updateDomTree(oldVNode, newVNode, oldDOM) {
  // 新节点，旧节点都不存在
  // 新节点存在，旧节点不存在
  // 新节点不存在，旧节点存在
  // 新节点存在，旧节点存在, 但是类型不一样
  // 新节点存在，旧节点存在，类型一样 ---> 值得我们进行深入的比较，探索复用相关节点的方案

  const typeMap = {
    NO_OPERATE: !oldVNode && !newVNode,
    ADD: !oldVNode && newVNode,
    DELETE: oldVNode && !newVNode,
    REPLACE: oldVNode && newVNode && oldVNode.type !== newVNode.type,
  };
  const UPDATE_TYPE = Object.keys(typeMap).filter((key) => typeMap[key])[0];

  switch (UPDATE_TYPE) {
    case "NO_OPERATE":
      break;
    case "ADD":
      oldDOM.parentNode.appendChild(createDOM(newVNode));
      break;
    case "DELETE":
      removeVNode(oldVNode);
      break;
    case "REPLACE":
      removeVNode(oldVNode);
      oldDOM.parentNode.appendChild(createDOM(newVNode));
      break;
    default:
      // 深度dom diff, 新老虚拟DOM都存在且类型相同
      deepDOMDiff(oldVNode, newVNode);
      break;
  }
}

function removeVNode(VNode) {
  const currentDOM = findDomByVNode(VNode);
  if (currentDOM) currentDOM.remove();

  // 实现类组件的componentWillUnmount
  if (VNode.classInstance && VNode.classInstance.componentWillUnmount) {
    VNode.classInstance.componentWillUnmount();
  }
}

function deepDOMDiff(oldVNode, newVNode) {
  const diffTypeMap = {
    ORIGIN_NODE: typeof oldVNode.type === "string",
    CLASS_COMPONENT:
      typeof oldVNode.type === "function" && oldVNode.type.IS_CLASS_COMPONENT,
    FUNCTION_COMPONENT: typeof oldVNode.type === "function",
    TEXT: oldVNode.type === REACT_TEXT,
    MEMO: oldVNode.type.$$typeof === REACT_MEMO,
  };
  const DIFF_TYPE = Object.keys(diffTypeMap).filter(
    (key) => diffTypeMap[key]
  )[0];

  switch (DIFF_TYPE) {
    case "ORIGIN_NODE":
      const currentDOM = (newVNode.dom = findDomByVNode(oldVNode));
      setPropsForDOM(currentDOM, newVNode.props);
      updateChildren(
        currentDOM,
        oldVNode.props.children,
        newVNode.props.children
      );
      break;
    case "CLASS_COMPONENT":
      updateClassComponent(oldVNode, newVNode);
      break;
    case "FUNCTION_COMPONENT":
      updateFunctionComponent(oldVNode, newVNode);
      break;
    case "TEXT":
      newVNode.dom = findDomByVNode(oldVNode);
      newVNode.dom.textContent = newVNode.props.text;
      break;
    case "MEMO":
      updateMemoFunctionComponent(oldVNode, newVNode);
      break;
    default:
      break;
  }
}

function updateClassComponent(oldVNode, newVNode) {
  const classInstance = (newVNode.classInstance = oldVNode.classInstance);
  classInstance.updater.launchUpdate(newVNode.props);
}

function updateFunctionComponent(oldVNode, newVNode) {
  const oldDOM = (newVNode.dom = findDomByVNode(oldVNode));
  if (!oldDOM) return;
  const { type, props } = newVNode;
  const newRenderVNode = type(props);
  updateDomTree(oldVNode.oldRenderVNode, newRenderVNode, oldDOM);
  newVNode.oldRenderVNode = newRenderVNode;
}

function updateMemoFunctionComponent(oldVNode, newVNode) {
  const { type } = oldVNode;
  if (
    (!type.compare && !shallowCompare(oldVNode.props, newVNode.props)) ||
    (type.compare && !type.compare(oldVNode.props, newVNode.props))
  ) {
    const oldDOM = findDomByVNode(oldVNode);
    const { type } = newVNode;
    const renderVNode = type.type(newVNode.props);
    updateDomTree(oldVNode.oldRenderVNode, renderVNode, oldDOM);
    newVNode.oldRenderVNode = renderVNode;
  } else {
    newVNode.oldRenderVNode = oldVNode.oldRenderVNode;
  }
}

// DOM DIFF算法的核心
function updateChildren(parentDOM, oldVNodeChildren, newVNodeChildren) {
  oldVNodeChildren = (
    Array.isArray(oldVNodeChildren) ? oldVNodeChildren : [oldVNodeChildren]
  ).filter(Boolean);
  newVNodeChildren = (
    Array.isArray(newVNodeChildren) ? newVNodeChildren : [newVNodeChildren]
  ).filter(Boolean);

  let lastNotChangedIndex = -1;
  const oldKeyChildMap = {};
  oldVNodeChildren.forEach((oldVNode, index) => {
    const oldKey = oldVNode && oldVNode.key ? oldVNode.key : index;
    oldKeyChildMap[oldKey] = oldVNode;
  });
  // 遍历新的子虚拟DOM数组，找到可以复用但需要移动的节点，需要重新创建的节点，需要删除的节点，剩下的就是可以复用且不用移动的节点
  const actions = [];
  newVNodeChildren.forEach((newVNode, index) => {
    newVNode.index = index;
    const newKey = newVNode.key ? newVNode.key : index;
    const oldVNode = oldKeyChildMap[newKey];
    if (oldVNode) {
      deepDOMDiff(oldVNode, newVNode);
      if (oldVNode.index < lastNotChangedIndex) {
        actions.push({ type: MOVE, oldVNode, newVNode, index });
      }
      delete oldKeyChildMap[newKey];
      lastNotChangedIndex = Math.max(lastNotChangedIndex, oldVNode.index);
    } else {
      actions.push({ type: CREATE, newVNode, index });
    }
  });
  const VNodeToMove = actions
    .filter((action) => action.type === MOVE)
    .map((action) => action.oldVNode);
  const VNodeToDelete = Object.values(oldKeyChildMap);
  VNodeToMove.concat(VNodeToDelete).forEach((oldVNode) => {
    const currentDOM = findDomByVNode(oldVNode);
    currentDOM.remove();
  });

  actions.forEach((action) => {
    const { type, oldVNode, newVNode, index } = action;
    const childNodes = parentDOM.childNodes;
    const childNode = childNodes[index];

    const getDomForInsert = () => {
      if (type === CREATE) {
        return createDOM(newVNode);
      }
      if (type === MOVE) {
        return findDomByVNode(oldVNode);
      }
    };

    if (childNode) {
      parentDOM.insertBefore(getDomForInsert(), childNode);
    } else {
      parentDOM.appendChild(getDomForInsert());
    }
  });
}

const ReactDOM = {
  render,
};

export default ReactDOM;
