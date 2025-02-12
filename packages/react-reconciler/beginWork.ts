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
	SuspenseComponent,
	MemoComponent
} from './workTags';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import { ReactElementType } from 'shared/ReactTypes';
import {
	cloneChildFibers,
	mountChildFibers,
	reconcileChildFibers
} from './childFibers';
import { bailoutHook, renderWithHooks } from './fiberHooks';
import { includeSomeLanes, Lane, NoLanes } from './fiberLanes';
import {
	ChildDeletion,
	DidCapture,
	NoFlags,
	Placement,
	Ref
} from './fiberFlags';
import {
	prepareToReadContext,
	propagateContextChange,
	pushProvider
} from './fiberContext';
import { pushSuspenseHandler } from './suspenseContext';
import { shallowEqual } from 'shared/shallowEquals';

// 是否能命中bailout
let didReceiveUpdate = false;
export function markWipReceivedUpdate() {
	didReceiveUpdate = true;
}

export const beginWork = (workInProgress: FiberNode, renderLane: Lane) => {
	// bailout策略
	didReceiveUpdate = false;
	const current = workInProgress.alternate;
	if (current !== null) {
		const oldProps = current.memoizedProps;
		const newProps = workInProgress.pendingProps;
		// 四要素～ props type
		// {num: 0, name: 'cpn2'}
		// {num: 0, name: 'cpn2'}
		if (oldProps !== newProps || current.type !== workInProgress.type) {
			didReceiveUpdate = true;
		} else {
			// state context
			const hasScheduledStateOrContext = checkScheduledUpdateOrContext(
				current,
				renderLane
			);
			if (!hasScheduledStateOrContext) {
				// 四要素～ state context
				// 命中bailout
				didReceiveUpdate = false;
				switch (workInProgress.tag) {
					case ContextProvider:
						const newValue = workInProgress.memoizedProps.value;
						const context = workInProgress.type._context;
						pushProvider(context, newValue);
						break;
					// TODO Suspense
				}
				return bailoutOnAlreadyFinishedWork(workInProgress, renderLane);
			}
		}
	}
	workInProgress.lanes = NoLanes;

	// 1. 递归子节点
	// 2. 递归兄弟节点
	// 3. 递归父节点
	switch (workInProgress.tag) {
		case HostRoot:
			return updateHostRoot(workInProgress, renderLane);
		case HostComponent:
			return updateHostComponent(workInProgress);
		case HostText:
			return null;
		case FunctionComponent:
			return updateFunctionComponent(
				workInProgress,
				workInProgress.type,
				renderLane
			);
		case Fragment:
			return updateFragment(workInProgress);
		case ContextProvider:
			return updateContextProvider(workInProgress, renderLane);
		case SuspenseComponent:
			return updateSuspenseComponent(workInProgress);
		case OffscreenComponent:
			return updateOffscreenComponent(workInProgress);
		case MemoComponent:
			return updateMemoComponent(workInProgress, renderLane);
		default:
			break;
	}
};

function updateMemoComponent(wip: FiberNode, renderLane: Lane) {
	// bailout四要素
	// props浅比较
	const current = wip.alternate;
	const nextProps = wip.pendingProps;
	const Component = wip.type.type;
	if (current !== null) {
		const prevProps = current.memoizedProps;
		// 浅比较props
		if (shallowEqual(prevProps, nextProps) && current.ref === wip.ref) {
			didReceiveUpdate = false;
			wip.pendingProps = prevProps;
			// state context
			if (!checkScheduledUpdateOrContext(current, renderLane)) {
				// 满足四要素
				wip.lanes = current.lanes;
				return bailoutOnAlreadyFinishedWork(wip, renderLane);
			}
		}
	}
	return updateFunctionComponent(wip, Component, renderLane);
}
function bailoutOnAlreadyFinishedWork(wip: FiberNode, renderLane: Lane) {
	if (!includeSomeLanes(wip.childLanes, renderLane)) {
		if (__DEV__) {
			console.warn('bailout整棵子树', wip);
		}
		return null;
	}
	if (__DEV__) {
		console.warn('bailout一个fiber', wip);
	}
	cloneChildFibers(wip);
	return wip.child;
}
function checkScheduledUpdateOrContext(
	current: FiberNode,
	renderLane: Lane
): boolean {
	const updateLanes = current.lanes;
	if (includeSomeLanes(updateLanes, renderLane)) {
		return true;
	}
	return false;
}

function updateContextProvider(workInProgress: FiberNode, renderLane: Lane) {
	const providerType = workInProgress.type;
	const context = providerType._context;
	const newProps = workInProgress.pendingProps;
	const oldProps = workInProgress.memoizedProps;
	const newValue = newProps.value;
	pushProvider(context, newValue);
	if (oldProps !== null) {
		const oldValue = oldProps.value;
		if (
			Object.is(oldValue, newValue) &&
			oldProps.children === newProps.children
		) {
			return bailoutOnAlreadyFinishedWork(workInProgress, renderLane);
		} else {
			propagateContextChange(workInProgress, context, renderLane);
		}
	}
	const nextChildren = newProps.children;
	reconcileChildren(workInProgress, nextChildren);
	return workInProgress.child;
}

function updateFragment(workInProgress: FiberNode) {
	const nextChildren = workInProgress.pendingProps;
	reconcileChildren(workInProgress, nextChildren);
	return workInProgress.child;
}

function updateHostRoot(workInProgress: FiberNode, renderLane: Lane) {
	const baseState = workInProgress.memoizedState;
	const updateQueue = workInProgress.updateQueue as UpdateQueue<Element>;
	const pendingUpdate = updateQueue.shared.pending;
	const { memoizedState } = processUpdateQueue(
		baseState,
		pendingUpdate,
		renderLane
	);
	updateQueue.shared.pending = null;

	const prevChildren = workInProgress.memoizedState;

	workInProgress.memoizedState = memoizedState;

	const current = workInProgress.alternate;
	// 考虑RootDidNotComplete的情况，需要复用memoizedState
	if (current !== null) {
		if (!current.memoizedState) {
			current.memoizedState = memoizedState;
		}
	}

	const nextChildren = workInProgress.memoizedState;
	if (prevChildren === nextChildren) {
		return bailoutOnAlreadyFinishedWork(workInProgress, renderLane);
	}
	reconcileChildren(workInProgress, nextChildren);
	return workInProgress.child;
}

function updateFunctionComponent(
	workInProgress: FiberNode,
	Component: FiberNode['type'],
	renderLane: Lane
) {
	prepareToReadContext(workInProgress, renderLane);
	// render
	const nextChildren = renderWithHooks(workInProgress, Component, renderLane);
	const current = workInProgress.alternate;
	if (current !== null && !didReceiveUpdate) {
		bailoutHook(workInProgress, renderLane);
		return bailoutOnAlreadyFinishedWork(workInProgress, renderLane);
	}
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
