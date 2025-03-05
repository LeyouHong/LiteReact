import React from "./react";
import ReactDOM from "./react-dom";

const Greeting = React.memo(({ name }) => {
  console.log("Greeting render");
  return (
    <h1>
      Hello {name && ","}
      {name}
    </h1>
  );
});

class MyApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "",
      address: "",
    };
  }

  componentDidUpdate() {
    console.log("MyApp ComponentDidUpdate");
  }

  render() {
    return (
      <div>
        <label>
          Name:
          <input onInput={(e) => this.setState({ name: e.target.value })} />
        </label>
        <label>
          Address:
          <input onInput={(e) => this.setState({ address: e.target.value })} />
        </label>
        <Greeting name={this.state.name} />
      </div>
    );
  }
}

ReactDOM.render(<MyApp />, document.getElementById("root"));

// 生命周期的本质就是callback
