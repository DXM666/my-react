import { appendChildToContainer, Container } from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import { MutationMask, NoFlags, Placement } from './fiberFlags';
import { HostComponent, HostRoot, HostText } from './workTags';

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
	// Deletion
}

function commitPlacement(fiber: FiberNode) {
	if (__DEV__) {
		console.log('commitPlacement', fiber);
	}
	// get host parent
	const hostParent = getHostParent(fiber);

	// append to parent dom
	if (hostParent) {
		appendPlacementNodeIntoContainer(fiber, hostParent);
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

function appendPlacementNodeIntoContainer(fiber: FiberNode, parent: Container) {
	if (fiber.tag === HostComponent || fiber.tag === HostText) {
		appendChildToContainer(parent, fiber.stateNode);
		return;
	}
	const child = fiber.child;
	if (child !== null) {
		appendPlacementNodeIntoContainer(child, parent);
		let sibling = child.sibling;
		while (sibling !== null) {
			appendPlacementNodeIntoContainer(sibling, parent);
			sibling = sibling.sibling;
		}
	}
}
