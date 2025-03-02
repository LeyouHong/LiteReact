import { findDomByVNode, updateDomTree } from "./react-dom";
import { deepClone } from "./utils";

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
  launchUpdate(nextProps) {
    const { ClassComponentInstance, pendingStates } = this;
    if (pendingStates.length === 0 && !nextProps) {
      return;
    }

    let isShouldUpdate = true;

    const prevProps = deepClone(this.ClassComponentInstance.props);
    const prevState = deepClone(this.ClassComponentInstance.state);

    const nextState = this.pendingStates.reduce((preState, newState) => {
      return { ...preState, ...newState };
    }, ClassComponentInstance.state);

    this.pendingStates.length = 0;
    if (
      ClassComponentInstance.shouldComponentUpdate &&
      !ClassComponentInstance.shouldComponentUpdate(nextProps, nextState)
    ) {
      isShouldUpdate = false;
    }

    ClassComponentInstance.state = nextState;
    if (nextProps) {
      ClassComponentInstance.props = nextProps;
    }

    if (isShouldUpdate) {
      ClassComponentInstance.update(prevProps, prevState);
    }
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
    if (this.constructor.getDerivedStateFromProps) {
      let newState = this.constructor.getDerivedStateFromProps(
        this.props,
        this.state
      );
      this.state = { ...this.state, ...newState };
    }
    const snapshot =
      this.getSnapshotBeforeUpdate &&
      this.getSnapshotBeforeUpdate(prevProps, prevState);
    const newVNode = this.render();
    updateDomTree(oldVNode, newVNode, oldDOM);
    this.oldVNode = newVNode;

    // 实现componentDidUpdate
    if (this.componentDidUpdate) {
      this.componentDidUpdate(this.props, this.state, snapshot);
    }
  }
}
