import {
	appendChildToContainer,
	commitUpdate,
	Container,
	insertChildToContainer,
	Instance,
	removeChild
} from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import {
	ChildDeletion,
	MutationMask,
	NoFlags,
	Placement,
	Update
} from './fiberFlags';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';

export function commitMutationEffects(finishedWork: FiberNode) {
	let nextEffects = finishedWork;
	// 向下遍历
	while (nextEffects !== null) {
		const child = nextEffects.child;
		if (
			(nextEffects.subtreeFlags & MutationMask) !== NoFlags &&
			child !== null
		) {
			nextEffects = child;
		} else {
			// 向上遍历
			up: while (nextEffects !== null) {
				commitMutationEffectsOnFiber(nextEffects);
				const sibling = nextEffects.sibling;
				if (sibling !== null) {
					nextEffects = sibling;
					break up;
				}
				nextEffects = nextEffects.return;
			}
		}
	}
}

function commitMutationEffectsOnFiber(fiber: FiberNode) {
	const flags = fiber.flags;
	// Placement
	if ((flags & Placement) !== NoFlags) {
		commitPlacement(fiber);
		fiber.flags &= ~Placement;
	}
	// Update
	if ((flags & Update) !== NoFlags) {
		commitUpdate(fiber);
		fiber.flags &= ~Update;
	}
	// Deletion
	if ((flags & ChildDeletion) !== NoFlags) {
		const deletions = fiber.deletions;
		if (deletions !== null) {
			deletions.forEach(commitDeletion);
		}
		fiber.flags &= ~ChildDeletion;
	}
}

function commitPlacement(fiber: FiberNode) {
	if (__DEV__) {
		console.warn('执行Placement操作', fiber);
	}
	// get host parent
	const hostParent = getHostParent(fiber);

	// host sibling
	const sibling = getHostSibling(fiber);

	// append to parent dom
	if (hostParent) {
		insertOrAppendPlacementNodeIntoContainer(fiber, hostParent, sibling);
	}
}

function commitDeletion(childToDelete: FiberNode) {
	if (__DEV__) {
		console.warn('执行Deletion操作', childToDelete);
	}
	let rootHostNode: FiberNode | null = null;
	// 递归子树
	commitNestedComponent(childToDelete, (unmountFiber) => {
		switch (unmountFiber.tag) {
			case HostComponent:
				if (rootHostNode === null) {
					rootHostNode = unmountFiber;
				}
				// TODO 解绑ref
				return;
			case HostText:
				if (rootHostNode === null) {
					rootHostNode = unmountFiber;
				}
				return;
			case FunctionComponent:
				// TODO useEffect unmount 、解绑ref
				return;
			default:
				if (__DEV__) {
					console.warn('未处理的unmount类型', unmountFiber);
				}
		}
	});

	// 移除rootHostComponent的DOM
	if (rootHostNode !== null) {
		const hostParent = getHostParent(childToDelete);
		if (hostParent !== null) {
			removeChild((rootHostNode as FiberNode).stateNode, hostParent);
		}
	}
	childToDelete.return = null;
	childToDelete.child = null;
}

function commitNestedComponent(
	root: FiberNode,
	onCommitUnmount: (fiber: FiberNode) => void
) {
	let node = root;
	while (true) {
		onCommitUnmount(node);
		if (node.child !== null) {
			// 向下遍历
			node.child.return = node;
			node = node.child;
			continue;
		}
		if (node === root) {
			// 终止条件
			return;
		}
		while (node.sibling === null) {
			if (node.return === null || node.return === root) {
				return;
			}
			// 向上归
			node = node.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

function getHostSibling(fiber: FiberNode) {
	let node: FiberNode = fiber;
	findSibling: while (true) {
		while (node.sibling === null) {
			const parent = node.return;
			if (
				parent === null ||
				parent.tag === HostComponent ||
				parent.tag === HostRoot
			) {
				return null;
			}
			node = parent;
		}
		node.sibling.return = node.return;
		node = node.sibling;
		while (node.tag !== HostText && node.tag !== HostComponent) {
			// 向下遍历
			if ((node.flags & Placement) !== NoFlags) {
				continue findSibling;
			}
			if (node.child === null) {
				continue findSibling;
			} else {
				node.child.return = node;
				node = node.child;
			}
		}
		if ((node.flags & Placement) === NoFlags) {
			return node.stateNode;
		}
	}
}

function getHostParent(fiber: FiberNode) {
	let parent = fiber.return;
	while (parent) {
		const parentTag = parent.tag;
		if (parentTag === HostComponent) {
			return parent.stateNode;
		}
		if (parentTag === HostRoot) {
			return (parent.stateNode as FiberRootNode).container;
		}
		parent = parent.return;
	}
	if (__DEV__) {
		console.warn('未找到host parent');
	}
	return null;
}

function insertOrAppendPlacementNodeIntoContainer(
	fiber: FiberNode,
	parent: Container,
	before?: Instance
) {
	if (fiber.tag === HostComponent || fiber.tag === HostText) {
		if (before) {
			insertChildToContainer(fiber.stateNode, parent, before);
		} else {
			appendChildToContainer(parent, fiber.stateNode);
		}
		return;
	}
	const child = fiber.child;
	if (child !== null) {
		insertOrAppendPlacementNodeIntoContainer(child, parent);
		let sibling = child.sibling;
		while (sibling !== null) {
			insertOrAppendPlacementNodeIntoContainer(sibling, parent);
			sibling = sibling.sibling;
		}
	}
}
