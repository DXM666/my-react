import React from 'react';
import ReactDOM from 'react-dom/client';

// function App() {
// 	return (
// 		<div>
// 			<Child />
// 		</div>
// 	);
// }
const jsx = <div>1231</div>;
console.log('React', React);
console.log('jsx', jsx);
console.log('ReactDOM', ReactDOM);
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(jsx);
// function Child() {
// 	return <span>big-react</span>;
// }

// ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
// 	(<App />) as any
// );
