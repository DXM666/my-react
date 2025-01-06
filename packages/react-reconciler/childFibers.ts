import { REACT_ELEMENT_TYPE, ReactElementType } from 'shared';
import { FiberNode, createFiberFromElement } from './fiber';
import { Placement } from './fiberFlags';
import { HostText } from './workTags';

function ChildReconciler(shouldTrackSideEffects: boolean) {
	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		element: ReactElementType
	) {
		console.log('currentFirstChild', currentFirstChild);
		const fiber = createFiberFromElement(element);
		fiber.return = returnFiber;
		return fiber;
	}

	function reconcileSingleText(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		content: string | number
	) {
		console.log('currentFirstChild', currentFirstChild);
		const fiber = new FiberNode({
			tag: HostText,
			pendingProps: { content },
			key: null
		});
		fiber.return = returnFiber;
		return fiber;
	}

	function placeSingleChild(fiber: FiberNode) {
		if (shouldTrackSideEffects && fiber.alternate == null) {
			fiber.flags |= Placement;
			return fiber;
		}
		return fiber;
	}

	return function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChild: ReactElementType
	) {
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconcileSingleElement(
							returnFiber,
							currentFirstChild,
							newChild
						)
					);
				default:
					if (__DEV__) {
						console.error('未实现的类型', newChild);
					}
					return null;
			}
		}

		// TODO:多节点
		// HostText
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleText(returnFiber, currentFirstChild, newChild)
			);
		}

		if (__DEV__) {
			console.error('未实现的类型', newChild);
		}

		return null;
	};
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
