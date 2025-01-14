import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
	const [num, setNum] = useState(100);
	return (
		<div>
			<Child prop={'test'}></Child>
			<button
				style={{ display: 'block' }}
				onClick={() => setNum(num + 1)}
			>
				{num % 2 === 0 ? <span>123</span> : <span>456</span>}
			</button>
		</div>
	);
}

function Child(props: { prop: any }) {
	return <span>123{props.prop}</span>;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);

// ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
// 	(<App />) as any
// );
