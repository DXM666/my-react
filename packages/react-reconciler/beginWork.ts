import {
	createFiberFromFragment,
	createFiberFromOffscreen,
	createWorkInProgress,
	FiberNode,
	OffscreenProps
} from './fiber';
import {
	HostRoot,
	HostComponent,
	FunctionComponent,
	Fragment,
	HostText,
	ContextProvider,
	OffscreenComponent,
	SuspenseComponent
} from './workTags';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import { ReactElementType } from 'shared/ReactTypes';
import { mountChildFibers, reconcileChildFibers } from './childFibers';
import { renderWithHooks } from './fiberHooks';
import { Lane } from './fiberLanes';
import {
	ChildDeletion,
	DidCapture,
	NoFlags,
	Placement,
	Ref
} from './fiberFlags';
import { pushProvider } from './fiberContext';
import { pushSuspenseHandler } from './suspenseContext';

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
		case ContextProvider:
			return updateContextProvider(workInProgress);
		case SuspenseComponent:
			return updateSuspenseComponent(workInProgress);
		case OffscreenComponent:
			return updateOffscreenComponent(workInProgress);
		default:
			break;
	}
};

function updateContextProvider(workInProgress: FiberNode) {
	const providerType = workInProgress.type;
	const context = providerType._context;
	const newProps = workInProgress.pendingProps;
	pushProvider(context, newProps.value);
	const nextChildren = newProps.children;
	reconcileChildren(workInProgress, nextChildren);
	return workInProgress.child;
}

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

	const current = workInProgress.alternate;
	// 考虑RootDidNotComplete的情况，需要复用memoizedState
	if (current !== null) {
		current.memoizedState = memoizedState;
	}

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

function updateOffscreenComponent(workInProgress: FiberNode) {
	const nextProps = workInProgress.pendingProps;
	const nextChildren = nextProps.children;
	reconcileChildren(workInProgress, nextChildren);
	return workInProgress.child;
}
function updateSuspenseComponent(workInProgress: FiberNode) {
	const current = workInProgress.alternate;
	const nextProps = workInProgress.pendingProps;
	let showFallback = false;
	const didSuspend = (workInProgress.flags & DidCapture) !== NoFlags;
	if (didSuspend) {
		showFallback = true;
		workInProgress.flags &= ~DidCapture;
	}
	const nextPrimaryChildren = nextProps.children;
	const nextFallbackChildren = nextProps.fallback;
	pushSuspenseHandler(workInProgress);
	if (current === null) {
		if (showFallback) {
			return mountSuspenseFallbackChildren(
				workInProgress,
				nextPrimaryChildren,
				nextFallbackChildren
			);
		} else {
			return mountSuspensePrimaryChildren(
				workInProgress,
				nextPrimaryChildren
			);
		}
	} else {
		if (showFallback) {
			return updateSuspenseFallbackChildren(
				workInProgress,
				nextPrimaryChildren,
				nextFallbackChildren
			);
		} else {
			return updateSuspensePrimaryChildren(
				workInProgress,
				nextPrimaryChildren
			);
		}
	}
}
function mountSuspensePrimaryChildren(
	workInProgress: FiberNode,
	primaryChildren: any
) {
	const primaryChildProps: OffscreenProps = {
		mode: 'visible',
		children: primaryChildren
	};
	const primaryChildFragment = createFiberFromOffscreen(primaryChildProps);
	workInProgress.child = primaryChildFragment;
	primaryChildFragment.return = workInProgress;
	return primaryChildFragment;
}
function mountSuspenseFallbackChildren(
	workInProgress: FiberNode,
	primaryChildren: any,
	fallbackChildren: any
) {
	const primaryChildProps: OffscreenProps = {
		mode: 'hidden',
		children: primaryChildren
	};
	const primaryChildFragment = createFiberFromOffscreen(primaryChildProps);
	const fallbackChildFragment = createFiberFromFragment(
		fallbackChildren,
		null
	);
	// 父组件Suspense已经mount，所以需要fallback标记Placement
	fallbackChildFragment.flags |= Placement;
	primaryChildFragment.return = workInProgress;
	fallbackChildFragment.return = workInProgress;
	primaryChildFragment.sibling = fallbackChildFragment;
	workInProgress.child = primaryChildFragment;
	return fallbackChildFragment;
}
function updateSuspensePrimaryChildren(
	workInProgress: FiberNode,
	primaryChildren: any
) {
	const current = workInProgress.alternate as FiberNode;
	const currentPrimaryChildFragment = current.child as FiberNode;
	const currentFallbackChildFragment: FiberNode | null =
		currentPrimaryChildFragment.sibling;
	const primaryChildProps: OffscreenProps = {
		mode: 'visible',
		children: primaryChildren
	};
	const primaryChildFragment = createWorkInProgress(
		currentPrimaryChildFragment,
		primaryChildProps
	);
	primaryChildFragment.return = workInProgress;
	primaryChildFragment.sibling = null;
	workInProgress.child = primaryChildFragment;
	if (currentFallbackChildFragment !== null) {
		const deletions = workInProgress.deletions;
		if (deletions === null) {
			workInProgress.deletions = [currentFallbackChildFragment];
			workInProgress.flags |= ChildDeletion;
		} else {
			deletions.push(currentFallbackChildFragment);
		}
	}
	return primaryChildFragment;
}
function updateSuspenseFallbackChildren(
	workInProgress: FiberNode,
	primaryChildren: any,
	fallbackChildren: any
) {
	const current = workInProgress.alternate as FiberNode;
	const currentPrimaryChildFragment = current.child as FiberNode;
	const currentFallbackChildFragment: FiberNode | null =
		currentPrimaryChildFragment.sibling;
	const primaryChildProps: OffscreenProps = {
		mode: 'hidden',
		children: primaryChildren
	};
	const primaryChildFragment = createWorkInProgress(
		currentPrimaryChildFragment,
		primaryChildProps
	);
	let fallbackChildFragment;
	if (currentFallbackChildFragment !== null) {
		// 可以复用
		fallbackChildFragment = createWorkInProgress(
			currentFallbackChildFragment,
			fallbackChildren
		);
	} else {
		fallbackChildFragment = createFiberFromFragment(fallbackChildren, null);
		fallbackChildFragment.flags |= Placement;
	}
	fallbackChildFragment.return = workInProgress;
	primaryChildFragment.return = workInProgress;
	primaryChildFragment.sibling = fallbackChildFragment;
	workInProgress.child = primaryChildFragment;
	return fallbackChildFragment;
}
