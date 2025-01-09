import { FiberNode } from './fiber';
import { HostRoot, HostComponent, FunctionComponent } from './workTags';
import { processUpdateQueue } from './updateQueue';
import { ReactElementType } from 'shared/ReactTypes';
import { mountChildFibers, reconcileChildFibers } from './childFibers';

export const beginWork = (workInProgress: FiberNode) => {
	console.log('beginWork', workInProgress);
	// 1. 递归子节点
	// 2. 递归兄弟节点
	// 3. 递归父节点
	switch (workInProgress.tag) {
		case HostRoot:
			return updateHostRoot(workInProgress);
		case HostComponent:
			return updateHostComponent(workInProgress);
		case FunctionComponent:
			return null;
		default:
			break;
	}
};

function updateHostRoot(workInProgress: FiberNode) {
	const baseState = workInProgress.memoizedState;
	const updateQueue = workInProgress.updateQueue;
	const pendingUpdate = updateQueue.shared.pending;
	const { memoizedState } = processUpdateQueue(baseState, pendingUpdate);
	updateQueue.shared.pending = null;
	workInProgress.memoizedState = memoizedState;

	const child = workInProgress.memoizedState;
	reconcileChildren(workInProgress, child);
	return workInProgress.child;
}

function updateHostComponent(workInProgress: FiberNode) {
	const nextProps = workInProgress.pendingProps;
	const nextChildren = nextProps.children;
	reconcileChildren(workInProgress, nextChildren);
	return workInProgress.child;
}

function reconcileChildren(
	workInProgress: FiberNode,
	children: ReactElementType
) {
	const current = workInProgress.alternate;
	if (current !== null) {
		// update
		workInProgress.child = reconcileChildFibers(
			workInProgress,
			current?.child,
			children
		);
	} else {
		// mount
		workInProgress.child = mountChildFibers(workInProgress, null, children);
	}
}
