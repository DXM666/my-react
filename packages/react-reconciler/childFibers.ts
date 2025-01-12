import { Props, REACT_ELEMENT_TYPE, ReactElementType } from 'shared';
import {
	FiberNode,
	createFiberFromElement,
	createWorkInProgress
} from './fiber';
import { ChildDeletion, Placement } from './fiberFlags';
import { HostText } from './workTags';

function ChildReconciler(shouldTrackSideEffects: boolean) {
	function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
		if (!shouldTrackSideEffects) {
			return;
		}
		const deletions = returnFiber.deletions;
		if (deletions === null) {
			returnFiber.deletions = [childToDelete];
			returnFiber.flags |= ChildDeletion;
		} else {
			deletions.push(childToDelete);
		}
	}
	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		element: ReactElementType
	) {
		const key = element.key;
		work: if (currentFirstChild !== null) {
			// update
			if (key === currentFirstChild.key) {
				// key相同
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (element.type === currentFirstChild.type) {
						// type相同
						const existing = useFiber(
							currentFirstChild,
							element.props
						);
						existing.return = returnFiber;
						return existing;
					}

					// 删掉旧的
					deleteChild(returnFiber, currentFirstChild);
					break work;
				} else {
					if (__DEV__) {
						console.error('未实现的类型', element);
						break work;
					}
				}
			} else {
				// 删掉旧的
				deleteChild(returnFiber, currentFirstChild);
			}
		}

		const fiber = createFiberFromElement(element);
		fiber.return = returnFiber;
		return fiber;
	}

	function reconcileSingleText(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		content: string | number
	) {
		if (currentFirstChild !== null) {
			// update
			if (currentFirstChild.tag === HostText) {
				// 类型没变，可以复用
				const existing = useFiber(currentFirstChild, { content });
				existing.return = returnFiber;
				return existing;
			}
			deleteChild(returnFiber, currentFirstChild);
		}
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

		if (currentFirstChild !== null) {
			// 兜底删除
			console.warn('兜底删除', currentFirstChild);
			deleteChild(returnFiber, currentFirstChild);
		}

		if (__DEV__) {
			console.error('未实现的类型', newChild);
		}

		return null;
	};
}

function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
	const clone = createWorkInProgress(fiber, pendingProps);
	clone.index = 0;
	clone.sibling = null;
	return clone;
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
