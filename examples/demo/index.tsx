import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
	const [num, setNum] = useState(100);
	// @ts-ignore
	// window.setNum = setNum;
	const arr =
		num % 2 === 0
			? [<li key="1">1</li>, <li key="2">2</li>, <li key="3">3</li>]
			: [<li key="3">3</li>, <li key="2">2</li>, <li key="1">1</li>];
	return (
		<div>
			<ul onClickCapture={() => setNum(num + 1)}>{arr}</ul>
			<Child prop={'test'}>
				{num % 2 === 0 ? <span>123</span> : <span>456</span>}
			</Child>
		</div>
	);
}

function Child(props: { prop: any; children: React.ReactNode }) {
	return (
		<span>
			123{props.prop}
			<div>{props.children}</div>
		</span>
	);
}
// const jsx = <div>1231</div>;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);

// ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
// 	(<App />) as any
// );
