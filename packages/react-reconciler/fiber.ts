import { Props, Key, Ref, ReactElementType } from 'shared/ReactTypes';
import {
	Fragment,
	FunctionComponent,
	HostComponent,
	WorkTag
} from './workTags';
import { Flags, NoFlags } from './fiberFlags';
import { Container } from 'hostConfig';
import { Lanes, Lane, NoLane, NoLanes } from './fiberLanes';
import { Effect } from './fiberHooks';
import { CallbackNode } from 'scheduler';

type FiberNodeType = { tag: WorkTag; pendingProps: Props; key: Key };

export class FiberNode {
	type: any;
	tag: any;
	pendingProps: Props;
	key: Key;
	stateNode: any;
	ref: Ref;

	return: any;
	sibling: any;
	child: FiberNode | null;
	index: any;

	memoizedProps: Props | null;
	memoizedState: any;
	alternate: FiberNode | null;
	flags: Flags;
	subtreeFlags: Flags;
	updateQueue: any;
	deletions: FiberNode[] | null;

	constructor({ tag, pendingProps, key }: FiberNodeType) {
		this.tag = tag;
		this.key = key || null;
		this.stateNode = null;
		this.type = null;

		this.ref = null;

		this.return = null;
		this.sibling = null;
		this.child = null;
		this.index = 0;

		// 作为工作单元
		this.pendingProps = pendingProps;
		this.memoizedProps = null;
		this.memoizedState = null;
		this.updateQueue = null;

		this.alternate = null;
		// 副作用
		this.flags = NoFlags;
		this.subtreeFlags = NoFlags;
		this.deletions = null;
	}
}

export interface PendingPassiveEffects {
	unmount: Effect[];
	update: Effect[];
}

export class FiberRootNode {
	container: Container;
	current: FiberNode;
	finishedWork: FiberNode | null;
	pendingLanes: Lanes;
	finishedLane: Lane;
	pendingPassiveEffects: PendingPassiveEffects;

	callbackNode: CallbackNode | null;
	callbackPriority: Lane;
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		this.finishedWork = null;
		hostRootFiber.stateNode = this;
		this.finishedLane = NoLane;
		this.pendingLanes = NoLanes;

		this.callbackNode = null;
		this.callbackPriority = NoLane;

		this.pendingPassiveEffects = {
			unmount: [],
			update: []
		};
	}
}

export const createWorkInProgress = (
	current: FiberNode,
	pendingProps: Props
) => {
	let workInProgress = current.alternate;
	if (workInProgress === null) {
		// mount
		workInProgress = new FiberNode({
			tag: current.tag,
			pendingProps,
			key: current.key
		}); // current.key 为 null 时会触发判断 current.key === pendingProps.key 的逻辑,导致报错
		workInProgress.stateNode = current.stateNode;

		workInProgress.alternate = current;
		current.alternate = workInProgress;
	} else {
		// update
		workInProgress.pendingProps = pendingProps;
		workInProgress.flags = NoFlags;
		workInProgress.subtreeFlags = NoFlags;
		workInProgress.deletions = null;
	}
	workInProgress.type = current.type;
	workInProgress.stateNode = current.stateNode;
	workInProgress.updateQueue = current.updateQueue;
	workInProgress.child = current.child;
	workInProgress.memoizedProps = current.memoizedProps;
	workInProgress.memoizedState = current.memoizedState;
	return workInProgress;
};

export function createFiberFromElement(element: ReactElementType): FiberNode {
	const { type, key, props } = element;
	let fiberTag: WorkTag = FunctionComponent;
	if (typeof type === 'string') {
		// <div/> type: 'div'
		fiberTag = HostComponent;
	} else if (typeof type !== 'function' && __DEV__) {
		console.warn('为定义的type类型', element);
	}
	const fiber = new FiberNode({ tag: fiberTag, pendingProps: props, key });
	fiber.type = type;
	return fiber;
}

export function createFiberFromFragment(elements: any[], key: Key): FiberNode {
	const fiber = new FiberNode({ tag: Fragment, pendingProps: elements, key });
	return fiber;
}
