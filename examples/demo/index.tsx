import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
	const [num, update] = useState(100);

	return (
		<ul onClick={() => update(50)}>
			<div>123</div>
			{new Array(num).fill(0).map((_, i) => {
				return <Child key={i}>{i}</Child>;
			})}
		</ul>
	);
}

function Child({ children }) {
	const now = performance.now();
	while (performance.now() - now < 4) {}
	return <li>{children}</li>;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);

// ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
// 	(<App />) as any
// );
