import React, { useState, useCallback, useMemo } from "./react";
import ReactDOM from "./react-dom";

const MemoFunction = React.memo(function Child({ data, handleClick }) {
  console.log("child render");
  return <button onClick={handleClick}>Age: {data.age}</button>;
});

function App() {
  console.log("parent render");
  const [name, setName] = useState("lalala");
  const [age, setAge] = useState(30);
  let data = useMemo(() => ({ age }), [age]);
  let handleClick = useCallback(() => setAge(age + 1), [age]);

  return (
    <div>
      <input value={name} onInput={(e) => setName(e.target.value)} />
      <MemoFunction data={data} handleClick={handleClick} />
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));

// 生命周期的本质就是callback
