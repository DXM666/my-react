import { FiberNode } from './fiber';

export const beginWork = (fiber: FiberNode) => {
	console.log('beginWork', fiber);
	// 1. 递归子节点
	// 2. 递归兄弟节点
	// 3. 递归父节点
};
