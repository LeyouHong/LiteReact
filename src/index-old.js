import React from "./react";
import ReactDOM from "./react-dom";

// const MyResult = React.forwardRef((props, ref) => {
//   return <div ref={ref}>refResult</div>;
// });

// console.log(<MyResult />);

// function MyFunctionComponent(props) {
//   return (
//     <div style={{ color: "blue" }}>
//       Simple React<span>lalala</span>
//       <div>hahaha</div>
//     </div>
//   );
// }

class MyClassComponent extends React.Component {
  counter = 0;

  constructor(props) {
    super(props);
    this.state = { count: "0" };
  }

  updateShowText(newText) {
    this.setState({ count: newText + "" });
  }

  render() {
    return (
      <div
        style={{
          color: "red",
          cursor: "pointer",
          border: "1px solid gray",
          borderRadius: "5px",
          display: "inline-block",
          padding: "5px 10px",
        }}
        onClick={() => this.updateShowText(++this.counter)}
      >
        Simple React Counter: {this.state.count}
      </div>
    );
  }
}

class MyTestComponent extends React.Component {
  constructor(props) {
    super(props);
    this.counterComponentRef = React.createRef();
    this.textInput = React.createRef();
    this.focusTextInput = this.focusTextInput.bind(this);
  }

  show100() {
    this.counterComponentRef.current.updateShowText(100);
  }

  focusTextInput() {
    this.textInput.current.focus();
  }
  render() {
    return (
      <div>
        <div>
          <div onClick={() => this.show100()}>xxx</div>
          <MyClassComponent ref={this.counterComponentRef} />
        </div>
        <input type="text" ref={this.textInput} />
        <input
          type="button"
          value="Focus the text input"
          onClick={this.focusTextInput}
        />
      </div>
    );
  }
}

ReactDOM.render(<MyTestComponent />, document.getElementById("root"));

// ReactDOM.render(<MyFunctionComponent />, document.getElementById("root"));

// console.log(
//   JSON.stringify(
//     <div className="red-color">
//       Simple React<span>lalala</span>
//       <div>hahaha</div>
//     </div>
//   )
// );
