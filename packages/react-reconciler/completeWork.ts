import {
	appendInitialChild,
	createInstance,
	createTextInstance,
	Container,
	Instance
} from 'hostConfig';
import { FiberNode } from './fiber';
import {
	HostRoot,
	HostComponent,
	FunctionComponent,
	HostText,
	Fragment,
	ContextProvider,
	OffscreenComponent,
	SuspenseComponent,
	MemoComponent
} from './workTags';
import { NoFlags, Ref, Update, Visibility } from './fiberFlags';
import { popProvider } from './fiberContext';
import { popSuspenseHandler } from './suspenseContext';
import { NoLanes, mergeLanes } from './fiberLanes';

function markUpdate(fiber: FiberNode) {
	fiber.flags |= Update;
}

function markRef(fiber: FiberNode) {
	fiber.flags |= Ref;
}

export const completeWork = (workInProgress: FiberNode) => {
	// ...处理wip
	const newProps = workInProgress.pendingProps;
	const current = workInProgress.alternate;
	switch (workInProgress.tag) {
		case HostComponent:
			if (current && workInProgress.stateNode) {
				// update
				markUpdate(workInProgress);
				// 标记Ref
				if (current.ref !== workInProgress.ref) {
					markRef(workInProgress);
				}
			} else {
				// 生成DOM
				const instance = createInstance(workInProgress.type, newProps);
				// 插入DOM
				appendAllChildren(instance, workInProgress);
				workInProgress.stateNode = instance;

				// 标记Ref
				if (workInProgress.ref !== null) {
					markRef(workInProgress);
				}
			}
			bubbleProperties(workInProgress);
			return null;
		case HostText:
			if (current && workInProgress.stateNode) {
				// update
				const oldText = current.memoizedProps.content;
				const newText = newProps.content;
				if (oldText !== newText) {
					markUpdate(workInProgress);
				}
			} else {
				// 生成DOM
				const instance = createTextInstance(newProps.content);
				// 插入DOM
				workInProgress.stateNode = instance;
			}
			bubbleProperties(workInProgress);
			return null;
		case HostRoot:
		case Fragment:
		case FunctionComponent:
		case OffscreenComponent:
		case MemoComponent:
			bubbleProperties(workInProgress);
			return null;
		case ContextProvider:
			const context = workInProgress.type._context;
			popProvider(context);
			bubbleProperties(workInProgress);
			return null;
		case SuspenseComponent:
			popSuspenseHandler();
			const offscreenFiber = workInProgress.child as FiberNode;
			const isHidden = offscreenFiber.pendingProps.mode === 'hidden';
			const currentOffscreenFiber = offscreenFiber.alternate;
			if (currentOffscreenFiber !== null) {
				const wasHidden =
					currentOffscreenFiber.pendingProps.mode === 'hidden';
				if (isHidden !== wasHidden) {
					// 可见性变化
					offscreenFiber.flags |= Visibility;
					bubbleProperties(offscreenFiber);
				}
			} else if (isHidden) {
				// mount时hidden
				offscreenFiber.flags |= Visibility;
				bubbleProperties(offscreenFiber);
			}
			bubbleProperties(workInProgress);
			return null;
		default:
			break;
	}
};

function appendAllChildren(
	parent: Container | Instance,
	workInProgress: FiberNode
) {
	let node = workInProgress.child;
	while (node !== null) {
		if (node.tag === HostComponent || node.tag === HostText) {
			appendInitialChild(parent, node.stateNode);
		} else if (node.child !== null) {
			node.child.return = node;
			node = node.child;
			continue;
		}
		if (node === workInProgress) {
			return;
		}
		while (node?.sibling === null) {
			if (node?.return === null || node?.return === workInProgress) {
				return;
			}
			node = node?.return;
		}
		// @ts-ignore
		node.sibling.return = node?.return;
		node = node?.sibling;
	}
}

function bubbleProperties(wip: FiberNode) {
	let subtreeFlags = NoFlags;
	let child = wip.child;
	let newChildLanes = NoLanes;
	while (child !== null) {
		subtreeFlags |= child.subtreeFlags;
		subtreeFlags |= child.flags;

		// child.lanes child.childLanes
		newChildLanes = mergeLanes(
			newChildLanes,
			mergeLanes(child.lanes, child.childLanes)
		);

		child.return = wip;
		child = child.sibling;
	}
	wip.subtreeFlags |= subtreeFlags;
	wip.childLanes = newChildLanes;
}
