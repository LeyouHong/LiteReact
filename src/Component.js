import { findDomByVNode, updateDomTree } from "./react-dom";

// isBatch: false → 是否处于批量更新模式，用于标识当前是否需要合并更新。
// updaters: new Set() → 存储所有需要更新的组件，Set 确保同一个组件不会重复执行更新。
export const updaterQueue = {
  isBatch: false,
  updaters: new Set(),
};

export function flushUpdaterQueue() {
  updaterQueue.isBatch = false;
  for (let updater of updaterQueue.updaters) {
    updater.launchUpdate();
  }
  updaterQueue.updaters.clear();
}

class Updater {
  constructor(ClassComponentInstance) {
    this.ClassComponentInstance = ClassComponentInstance;
    this.pendingStates = [];
  }
  addState(partialState) {
    this.pendingStates.push(partialState);
    this.preHandleForUpdate();
  }
  preHandleForUpdate() {
    if (updaterQueue.isBatch) {
      updaterQueue.updaters.add(this);
    } else {
      this.launchUpdate();
    }
  }
  launchUpdate() {
    const { ClassComponentInstance, pendingStates } = this;
    if (pendingStates.length === 0) {
      return;
    }
    ClassComponentInstance.state = pendingStates.reduce(
      (preState, newState) => {
        return { ...preState, ...newState };
      },
      ClassComponentInstance.state
    );
    this.pendingStates.length = 0;
    ClassComponentInstance.update();
  }
}

export class Component {
  static IS_CLASS_COMPONENT = true;
  constructor(props) {
    this.updater = new Updater(this);
    this.state = {};
    this.props = props;
  }
  setState(partialState) {
    // 合并属性
    this.updater.addState(partialState);

    // 重新渲染进行更新
    // this.update();
  }

  update() {
    // 获取重新执行render函数后的虚拟dom 新虚拟dom
    // 根据新虚拟dom生成新的真实dom
    // 将真实dom挂载到页面上
    const oldVNode = this.oldVNode;
    const oldDOM = findDomByVNode(oldVNode);
    const newVNode = this.render();
    updateDomTree(oldDOM, newVNode);
    this.oldVNode = newVNode;
  }
}
