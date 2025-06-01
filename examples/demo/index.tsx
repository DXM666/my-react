import React, { useState, useTransition } from 'react';
import ReactDOM from 'react-dom/client';

// function App() {
// 	const [num, update] = useState(100);
// 	const ctxA = createContext('default A');
// 	useEffect(() => {
// 		console.log('App effect');
// 		return () => {
// 			console.log('destroy');
// 		};
// 	}, [num]);

// 	useLayoutEffect(() => {
// 		console.log('App layout effect');
// 		return () => {
// 			console.log('destroy');
// 		};
// 	}, [num]);

// 	return (
// 		<ctxA.Provider value="A">
// 			<div>
// 				<button onClick={() => update(num + 1)}>+ 1</button>
// 				<p>num is: {num}</p>
// 				<>123</>
// 			</div>
// 		</ctxA.Provider>
// 	);
// }

export default function App() {
	const [a, updateA] = useState('a');
	const [b, updateB] = useState('b');
	const [c, updateC] = useState('c');
	const [d, updateD] = useState('d');
	const [, startTransition] = useTransition();
	console.log('hello');
	return (
		<div
			onClick={() => {
				startTransition(() => {
					updateB(b + '2');
					updateD(d + '2');
				});
				updateA(a + '1');
				updateC(c + '1');
			}}
		>
			<div>{a}</div>
			<div>{b}</div>
			<div>{c}</div>
			<div>{d}</div>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);
