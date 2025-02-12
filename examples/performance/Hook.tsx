import React, { useState, memo, useCallback } from 'react';

export default function App() {
	const [num, update] = useState(0);
	console.log('App render ', num);

	const addOne = useCallback(() => update((num) => num + 1), []);

	return (
		<div>
			<Cpn onClick={addOne} />
			{num}
		</div>
	);
}

interface CpnProps {
	onClick: () => void;
}

const Cpn = memo(function ({ onClick }: CpnProps) {
	console.log('Cpn render');
	return (
		<div onClick={() => onClick()}>
			<Child />
		</div>
	);
});

function Child() {
	console.log('Child render');
	return <p>i am child</p>;
}
