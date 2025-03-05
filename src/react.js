import {
  REACT_ELEMENT,
  REACT_FORWARD_REF,
  REACT_MEMO,
  toVNode,
  shallowCompare,
} from "./utils";
import { Component } from "./Component";

function createElement(type, properties, children) {
  const ref = properties.ref || null;
  const key = properties.key || null;

  ["key", "ref", "__self", "__source"].forEach((key) => {
    delete properties[key];
  });

  const props = { ...properties };

  // 传入的子元素可能多余3个，把从第三个开始的都放进一个数组里
  if (arguments.length > 3) {
    props.children = Array.prototype.slice.call(arguments, 2).map(toVNode);
  } else {
    props.children = toVNode(children);
  }

  return {
    $$typeof: REACT_ELEMENT,
    type,
    ref,
    key,
    props,
  };
}

function createRef() {
  return {
    current: null,
  };
}

function forwardRef(render) {
  return {
    $$typeof: REACT_FORWARD_REF,
    render,
  };
}

class PureComponent extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    return (
      !shallowCompare(this.props, nextProps) ||
      !shallowCompare(this.state, nextState)
    );
  }
}

// $$typeof: Symbol(react.memo)
// compare: null
// type: f Greeting(_ref)
function memo(type, compare) {
  return {
    $$typeof: REACT_MEMO,
    type,
    compare,
  };
}

const React = {
  createElement,
  Component,
  createRef,
  forwardRef,
  PureComponent,
  memo,
};

export default React;

// console.log(
//     JSON.stringify(
//       <div>
//         Simple React<span>lalala</span>
//         <div>hahaha</div>
//       </div>
//     )
//   );

//Babel转换
// React.createElement(
//     "div",
//     null,   //这个是props
//     "Simple React",
//     React.createElement("span", null, "lalala"),
//     React.createElement("div", null, "hahaha")
//   );

// 调用我这createElement得到以下结果
// {
// 	"type": "div",
// 	"ref": null,
// 	"key": null,
// 	"props": {
// 		"children": ["Simple React", {
// 			"type": "span",
// 			"ref": null,
// 			"key": null,
// 			"props": {
// 				"children": ["lalala"]
// 			}
// 		}, {
// 			"type": "div",
// 			"ref": null,
// 			"key": null,
// 			"props": {
// 				"children": ["hahaha"]
// 			}
// 		}]
// 	}
// }
