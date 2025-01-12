import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
	const [num, setNum] = useState(100);
	// @ts-ignore
	// window.setNum = setNum;
	return <div onClick={() => setNum(num + 1)}>{num}</div>;
}

// function Child() {
// 	return <span>123</span>;
// }
// const jsx = <div>1231</div>;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);

// ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
// 	(<App />) as any
// );
