import React from "./react";
import ReactDOM from "./react-dom";

class DerivedState extends React.Component {
  constructor(props) {
    super(props);
    this.state = { prevUserId: "zhangsanfeng", email: "zhangsanfeng@qq.com" };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.userId !== state.prevUserId) {
      return {
        prevUserId: props.userId,
        email: props.userId + "@qq.com",
      };
    }
  }

  render() {
    return (
      <div>
        <h1>Email:</h1>
        <h2>{this.state.email}</h2>
      </div>
    );
  }
}
class ParentClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = { id: "zhangsanfeng" };
  }
  changeUserId = () => {
    this.setState({ id: "dongfangbubai" });
  };

  render() {
    return (
      <div>
        <input
          type="button"
          value="click change UserId"
          onClick={this.changeUserId}
        />
        <DerivedState userId={this.state.id} />
      </div>
    );
  }
}

ReactDOM.render(<ParentClass />, document.getElementById("root"));

// 生命周期的本质就是callback
