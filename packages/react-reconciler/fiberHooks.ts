import { FiberNode } from './fiber';

export function renderWithHooks(workInProgress: FiberNode): any {
	const props = workInProgress.memoizedProps;
	const functionComponent = workInProgress.type;
	const children = functionComponent(props);
	return children;
}
