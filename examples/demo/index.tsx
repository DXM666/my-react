import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
	const [num, setNum] = useState(0);

	return (
		<ul
			onClickCapture={() => {
				setNum((num1) => num1 + 1);
				setNum((num2) => num2 + 1);
				setNum((num3) => num3 + 1);
				console.log('clickCapture', num);
			}}
		>
			{num}
		</ul>
	);
}

// function Child(props: { prop: any }) {
// 	return <span>123{props.prop}</span>;
// }

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);

// ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
// 	(<App />) as any
// );
