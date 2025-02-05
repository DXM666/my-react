import {
	Key,
	Props,
	REACT_ELEMENT_TYPE,
	REACT_FRAGMENT_TYPE,
	ReactElementType
} from 'shared';
import {
	FiberNode,
	createFiberFromElement,
	createFiberFromFragment,
	createWorkInProgress
} from './fiber';
import { ChildDeletion, Placement } from './fiberFlags';
import { Fragment, HostText } from './workTags';

type ExistingChildren = Map<string | number, FiberNode>;

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
	function deleteRemainingChildren(
		returnFiber: FiberNode,
		current: FiberNode | null
	) {
		if (!shouldTrackSideEffects) {
			return;
		}
		let childToDelete = current;
		while (childToDelete !== null) {
			deleteChild(returnFiber, childToDelete);
			childToDelete = childToDelete.sibling;
		}
	}
	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		element: ReactElementType
	) {
		const key = element.key;
		while (currentFirstChild !== null) {
			// update
			if (key === currentFirstChild.key) {
				// key相同
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (element.type === currentFirstChild.type) {
						let props = element.props;
						if (element.type === REACT_FRAGMENT_TYPE) {
							props = element.props.children;
						}
						// type相同
						const existing = useFiber(currentFirstChild, props);
						existing.return = returnFiber;
						// 当前节点可复用，标记剩下的节点删除
						deleteRemainingChildren(
							returnFiber,
							currentFirstChild.sibling
						);
						return existing;
					}

					// key相同，type不同 删掉所有旧的
					deleteRemainingChildren(returnFiber, currentFirstChild);
					break;
				} else {
					if (__DEV__) {
						console.error('未实现的类型', element);
						break;
					}
				}
			} else {
				// key不同 删掉旧的
				deleteChild(returnFiber, currentFirstChild);
				// 继续遍历
				currentFirstChild = currentFirstChild.sibling;
			}
		}

		let fiber;
		if (element.type === REACT_FRAGMENT_TYPE) {
			fiber = createFiberFromFragment(element.props.children, key);
		} else {
			fiber = createFiberFromElement(element);
		}
		fiber.return = returnFiber;
		return fiber;
	}

	function reconcileSingleText(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		content: string | number
	) {
		while (currentFirstChild !== null) {
			// update
			if (currentFirstChild.tag === HostText) {
				// 类型没变，可以复用
				const existing = useFiber(currentFirstChild, { content });
				existing.return = returnFiber;
				deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
				return existing;
			}
			deleteChild(returnFiber, currentFirstChild);
			currentFirstChild = currentFirstChild.sibling;
		}
		const fiber = new FiberNode({
			tag: HostText,
			pendingProps: { content },
			key: null
		});
		fiber.return = returnFiber;
		return fiber;
	}

	function reconcileChildrenArray(
		returnFiber: FiberNode,
		currentFirstChild: FiberNode | null,
		newChildren: Array<ReactElementType>
	) {
		// 最后一个可复用fiber在current中的index
		let lastPlacedIndex: number = 0;
		// 创建的最后一个fiber
		let lastNewFiber: FiberNode | null = null;
		// 创建的第一个fiber
		let firstNewFiber: FiberNode | null = null;

		// 1.将current保存在map中
		const existingChildren: ExistingChildren = new Map();
		let current = currentFirstChild;
		while (current !== null) {
			const keyToUse = current.key !== null ? current.key : current.index;
			existingChildren.set(keyToUse, current);
			current = current.sibling;
		}

		for (let i = 0; i < newChildren.length; i++) {
			// 2.遍历newChild，寻找是否可复用
			const after = newChildren[i];
			const newFiber = updateFromMap(
				returnFiber,
				existingChildren,
				i,
				after
			);
			if (newFiber === null) {
				continue;
			}

			// 3. 标记移动还是插入
			newFiber.index = i;
			newFiber.return = returnFiber;
			if (lastNewFiber === null) {
				lastNewFiber = newFiber;
				firstNewFiber = newFiber;
			} else {
				lastNewFiber.sibling = newFiber;
				lastNewFiber = lastNewFiber.sibling;
			}
			if (!shouldTrackSideEffects) {
				continue;
			}

			const current = newFiber.alternate;
			if (current !== null) {
				const oldIndex = current.index;
				if (oldIndex < lastPlacedIndex) {
					// 移动
					newFiber.flags |= Placement;
					continue;
				} else {
					// 不移动
					lastPlacedIndex = oldIndex;
				}
			} else {
				// mount
				newFiber.flags |= Placement;
			}
		}
		// 4. 将Map中剩下的标记为删除
		existingChildren.forEach((fiber) => {
			deleteChild(returnFiber, fiber);
		});
		return firstNewFiber;
	}

	function getElementKeyToUse(element: any, index?: number): Key {
		if (
			Array.isArray(element) ||
			typeof element === 'string' ||
			typeof element === 'number' ||
			element === undefined ||
			element === null
		) {
			return index;
		}
		return element.key !== null ? element.key : index;
	}

	function updateFromMap(
		returnFiber: FiberNode,
		existingChildren: ExistingChildren,
		index: number,
		element: any
	): FiberNode | null {
		const keyToUse = getElementKeyToUse(element, index);
		const before = existingChildren.get(keyToUse);
		// HostText
		if (typeof element === 'string' || typeof element === 'number') {
			if (before) {
				if (before.tag === HostText) {
					existingChildren.delete(keyToUse);
					return useFiber(before, { content: element + '' });
				}
			}
			return new FiberNode({
				tag: HostText,
				pendingProps: { content: element + '' },
				key: null
			});
		}

		// ReactElement
		if (typeof element === 'object' && element !== null) {
			switch (element.$$typeof) {
				case REACT_ELEMENT_TYPE:
					if (element.type === REACT_FRAGMENT_TYPE) {
						return updateFragment(
							returnFiber,
							before,
							element,
							keyToUse,
							existingChildren
						);
					}
					if (before) {
						if (before.type === element.type) {
							existingChildren.delete(keyToUse);
							return useFiber(before, element.props);
						}
					}
					return createFiberFromElement(element);
			}
			// TODO 数组类型
			if (Array.isArray(element) && __DEV__) {
				console.warn('还未实现数组类型的child', returnFiber);
			}
		}

		if (Array.isArray(element)) {
			return updateFragment(
				returnFiber,
				before,
				element,
				keyToUse,
				existingChildren
			);
		}
		return null;
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
		// 判断Fragment
		const isUnkeyedTopLevelFragment =
			typeof newChild === 'object' &&
			newChild !== null &&
			newChild.type === REACT_FRAGMENT_TYPE &&
			newChild.key === null;
		if (isUnkeyedTopLevelFragment) {
			newChild = newChild.props.children;
		}

		if (typeof newChild === 'object' && newChild !== null) {
			// 多节点的情况 ul> li*3
			if (Array.isArray(newChild)) {
				return reconcileChildrenArray(
					returnFiber,
					currentFirstChild,
					newChild
				);
			}
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
					break;
			}
		}

		// HostText
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleText(returnFiber, currentFirstChild, newChild)
			);
		}

		if (currentFirstChild !== null) {
			// 兜底删除
			console.warn('兜底删除', currentFirstChild);
			deleteRemainingChildren(returnFiber, currentFirstChild);
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

function updateFragment(
	returnFiber: FiberNode,
	current: FiberNode | undefined,
	elements: any[],
	key: Key,
	existingChildren: ExistingChildren
) {
	let fiber;
	if (!current || current.tag !== Fragment) {
		fiber = createFiberFromFragment(elements, key);
	} else {
		existingChildren.delete(key);
		fiber = useFiber(current, elements);
	}
	fiber.return = returnFiber;
	return fiber;
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
