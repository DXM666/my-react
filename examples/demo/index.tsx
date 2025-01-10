import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
	return (
		<div>
			<Child name="123" />
		</div>
	);
}

function Child(props: { name: string }) {
	return <span>{props.name}</span>;
}
// const jsx = <div>1231</div>;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<App />
);

// ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
// 	(<App />) as any
// );
