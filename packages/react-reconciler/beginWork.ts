import { FiberNode } from './fiber';
import {
	HostRoot,
	HostComponent,
	FunctionComponent,
	Fragment,
	HostText
} from './workTags';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import { ReactElementType } from 'shared/ReactTypes';
import { mountChildFibers, reconcileChildFibers } from './childFibers';
import { renderWithHooks } from './fiberHooks';
import { Lane } from './fiberLanes';
import { Ref } from './fiberFlags';

export const beginWork = (workInProgress: FiberNode, renderLanes: Lane) => {
	// 1. 递归子节点
	// 2. 递归兄弟节点
	// 3. 递归父节点
	switch (workInProgress.tag) {
		case HostRoot:
			return updateHostRoot(workInProgress, renderLanes);
		case HostComponent:
			return updateHostComponent(workInProgress);
		case HostText:
			return null;
		case FunctionComponent:
			return updateFunctionComponent(workInProgress, renderLanes);
		case Fragment:
			return updateFragment(workInProgress);
		default:
			break;
	}
};

function updateFragment(workInProgress: FiberNode) {
	const nextChildren = workInProgress.pendingProps;
	reconcileChildren(workInProgress, nextChildren);
	return workInProgress.child;
}

function updateHostRoot(workInProgress: FiberNode, renderLanes: Lane) {
	const baseState = workInProgress.memoizedState;
	const updateQueue = workInProgress.updateQueue as UpdateQueue<Element>;
	const pendingUpdate = updateQueue.shared.pending;
	const { memoizedState } = processUpdateQueue(
		baseState,
		pendingUpdate,
		renderLanes
	);
	updateQueue.shared.pending = null;
	workInProgress.memoizedState = memoizedState;

	const child = workInProgress.memoizedState;
	reconcileChildren(workInProgress, child);
	return workInProgress.child;
}

function updateFunctionComponent(workInProgress: FiberNode, renderLanes: Lane) {
	const nextChildren = renderWithHooks(workInProgress, renderLanes);
	reconcileChildren(workInProgress, nextChildren);
	return workInProgress.child;
}

function updateHostComponent(workInProgress: FiberNode) {
	const nextProps = workInProgress.pendingProps;
	const nextChildren = nextProps.children;
	markRef(workInProgress.alternate, workInProgress);
	reconcileChildren(workInProgress, nextChildren);
	return workInProgress.child;
}

function markRef(current: FiberNode | null, workInProgress: FiberNode) {
	const ref = workInProgress.ref;
	if (
		(current === null && ref !== null) ||
		(current !== null && current.ref !== ref)
	) {
		workInProgress.flags |= Ref;
	}
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
