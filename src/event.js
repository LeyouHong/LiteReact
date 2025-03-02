import { updaterQueue, flushUpdaterQueue } from "./Component";

export function addEvent(dom, eventName, bindFunction) {
  dom.attach = dom.attach || {};
  dom.attach[eventName] = bindFunction;
  // 事件合成机制的核心点一：事件绑定到document上
  // 下面这两行代码的作用是确保相同类型的事件只在 document 上绑定一次，避免重复绑定，保证 React 事件委托的高效性。
  // dispatchEvent 是手动绑定到 document 上的，当某个 DOM 元素触发事件（例如 click），
  // 事件冒泡到 document，然后 dispatchEvent 作为 document[eventName] 被调用。
  if (document[eventName]) return;
  document[eventName] = dispatchEvent;
}

// dispatchEvent 在 addEvent 函数里被绑定到 document 作为全局事件处理函数，并在浏览器的原生事件触发时调用。
function dispatchEvent(nativeEvent) {
  updaterQueue.isBatch = true;
  // 事件合成机制的核心点二：屏蔽浏览器之间的差异
  const syntheticEvent = createSyntheticEvent(nativeEvent);
  // 这个nativeEvent的target不停向上冒泡执行事件函数
  let target = nativeEvent.target;
  // 在 dispatchEvent 里的 while 循环，主要的作用是 模拟事件冒泡，
  // 让事件能够从目标元素逐级向上传播（类似于原生 DOM 事件的冒泡机制）。
  while (target) {
    syntheticEvent.currentTarget = target;
    const eventName = `on${nativeEvent.type}`;
    const bindFunction = target.attach && target.attach[eventName];
    bindFunction && bindFunction(syntheticEvent);
    if (syntheticEvent.isPropagationStopped) {
      break;
    }
    target = target.parentNode;
  }
  flushUpdaterQueue();
}

function createSyntheticEvent(nativeEvent) {
  const nativeEventKeyValues = {};
  for (let key in nativeEvent) {
    nativeEventKeyValues[key] =
      typeof nativeEvent[key] === "function"
        ? nativeEvent[key].bind(nativeEvent)
        : nativeEvent[key];
  }
  const syntheticEvent = Object.assign(nativeEventKeyValues, {
    nativeEvent,
    isDefaultPrevented: false,
    isPropagationStopped: false,
    // 让合成事件拥有阻止默认行为和阻止事件冒泡的能力，并且这2个方法屏蔽浏览器之间的差异
    preventDefault: function () {
      this.isDefaultPrevented = true;
      if (this.nativeEvent.preventDefault) {
        this.nativeEvent.preventDefault();
      } else {
        this.nativeEvent.returnValue = false;
      }
    },
    stopPropagation: function () {
      this.isPropagationStopped = true;
      if (this.nativeEvent.stopPropagation) {
        this.nativeEvent.stopPropagation();
      } else {
        this.nativeEvent.cancelBubble = true;
      }
    },
  });
  return syntheticEvent;
}
