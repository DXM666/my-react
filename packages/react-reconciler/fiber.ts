import { Props, Key, Ref } from 'shared/ReactTypes';
import { WorkTag } from './workTags';
import { Flags, NoFlags } from './fiberFlags';
import { Container } from 'react-dom/hostConfig';

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
	child: any;
	index: any;

	memoizedProps: Props | null;
	memoizedState: any;
	alternate: FiberNode | null;
	flags: Flags;
	updateQueue: any;

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
	}
}

export class FiberRootNode {
	container: Container;
	current: FiberNode;
	finishedWork: FiberNode | null;
	// pendingChildren: FiberNode | null;
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		this.finishedWork = null;
		// this.pendingChildren = null;
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
	}
	workInProgress.type = current.type;
	workInProgress.stateNode = current.stateNode;
	workInProgress.updateQueue = current.updateQueue;
	workInProgress.child = current.child;
	workInProgress.memoizedProps = current.memoizedProps;
	workInProgress.memoizedState = current.memoizedState;
	return workInProgress;
};
