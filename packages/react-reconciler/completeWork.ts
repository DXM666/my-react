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
	ContextProvider
} from './workTags';
import { NoFlags, Ref, Update } from './fiberFlags';
import { popProvider } from './fiberContext';

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
			bubbleProperties(workInProgress);
			return null;
		case ContextProvider:
			const context = workInProgress.type._context;
			popProvider(context);
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
	while (child !== null) {
		subtreeFlags |= child.subtreeFlags;
		subtreeFlags |= child.flags;
		child.return = wip;
		child = child.sibling;
	}
	wip.subtreeFlags |= subtreeFlags;
}
