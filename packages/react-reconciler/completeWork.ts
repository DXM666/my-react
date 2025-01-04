import { FiberNode } from './fiber';

export const completeWork = (fiber: FiberNode) => {
	// ...处理wip
	console.log('completeWork', fiber);
};
