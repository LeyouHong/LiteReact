import { emitUpdateForHooks } from "./react-dom";
const states = [];
let hookIndex = 0;

export function resetHookIndex() {
  hookIndex = 0;
}

export function useState(initialValue) {
  states[hookIndex] = states[hookIndex] || initialValue;
  const currentIndex = hookIndex;

  function setState(newState) {
    states[currentIndex] = newState;
    emitUpdateForHooks();
  }
  return [states[hookIndex++], setState];
}

export function useReducer(reducer, initialValue) {
  states[hookIndex] = states[hookIndex] || initialValue;
  const currentIndex = hookIndex;

  function dispatch(action) {
    states[currentIndex] = reducer(states[currentIndex], action);
    emitUpdateForHooks();
  }
  return [states[hookIndex++], dispatch];
}

export function useEffect(effectFunction, deps = []) {
  const currentIndex = hookIndex;
  const [destroyFunction, preDeps] = states[hookIndex] || [null, null];
  if (
    !states[hookIndex] ||
    deps.some((item, index) => item !== preDeps[index])
  ) {
    // 弘任务, 浏览器下一轮事件循环执行
    setTimeout(() => {
      destroyFunction && destroyFunction();
      states[currentIndex] = [effectFunction(), deps];
    });
  }
  hookIndex++;
}

export function useLayoutEffect(effectFunction, deps = []) {
  const currentIndex = hookIndex;
  const [destroyFunction, preDeps] = states[hookIndex] || [null, null];
  if (
    !states[hookIndex] ||
    deps.some((item, index) => item !== preDeps[index])
  ) {
    //微任务, 在当前宏任务结束后立即执行
    queueMicrotask(() => {
      destroyFunction && destroyFunction();
      states[currentIndex] = [effectFunction(), deps];
    });
  }
  hookIndex++;
}

export function useRef(initialValue) {
  states[hookIndex] = states[hookIndex] || { current: initialValue };
  return states[hookIndex++];
}

export function useImperativeHandle(ref, dataFactory) {
  ref.current = dataFactory();
}
export function useMemo(dataFactory, deps = []) {
  const [preData, preDeps] = states[hookIndex] || [null, null];
  if (
    !states[hookIndex] ||
    deps.some((item, index) => item !== preDeps[index])
  ) {
    const newData = dataFactory();
    states[hookIndex++] = [newData, deps];
    return newData;
  }
  hookIndex++;
  return preData;
}

export function useCallback(callback, deps = []) {
  const [preCallback, preDeps] = states[hookIndex] || [null, null];
  if (
    !states[hookIndex] ||
    deps.some((item, index) => item !== preDeps[index])
  ) {
    states[hookIndex++] = [callback, deps];
    return callback;
  }
  hookIndex++;
  return preCallback;
}
