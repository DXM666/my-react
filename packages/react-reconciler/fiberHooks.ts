import internals from 'shared/internals';

import { FiberNode } from './fiber';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	UpdateQueue
} from './updateQueue';
import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import { Action } from 'shared';
import { scheduleUpdateOnFiber } from './workLoop';

interface Hook {
	memoizedState: any;
	updateQueue: any;
	next: Hook | null;
}

let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;
const { currentDispatcher } = internals;

export function renderWithHooks(workInProgress: FiberNode): any {
	currentlyRenderingFiber = workInProgress;

	workInProgress.memoizedState = null;
	workInProgress.updateQueue = null;

	const current = workInProgress.alternate;
	if (current !== null) {
		// update
		workInProgress.updateQueue = current.updateQueue;
		workInProgress.memoizedState = current.memoizedState;
	} else {
		// mount
		currentDispatcher.current = HooksDispatcherOnMount;
	}

	const props = workInProgress.pendingProps;
	const functionComponent = workInProgress.type;
	const children = functionComponent(props);
	currentlyRenderingFiber = null;
	return children;
}

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
};

function mountState<T>(initialState: T | (() => T)): [T, Dispatch<T>] {
	const hook = mountWorkInProgressHook();

	// 处理初始状态
	let memoizedState =
		initialState instanceof Function ? initialState() : initialState;

	// 创建更新队列
	const queue = createUpdateQueue<T>();
	hook.updateQueue = queue;
	hook.memoizedState = memoizedState;

	const dispatch = dispatchSetState.bind(
		null,
		currentlyRenderingFiber,
		// @ts-ignore
		queue
	);
	// @ts-ignore
	queue.dispatch = dispatch;
	// @ts-ignore
	return [hook.memoizedState, dispatch];
}

function dispatchSetState<State>(
	fiber: FiberNode | null,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) {
	const update = createUpdate(action);
	enqueueUpdate(updateQueue, update);
	scheduleUpdateOnFiber(fiber);
}

function mountWorkInProgressHook(): Hook {
	const hook: Hook = {
		memoizedState: null,
		updateQueue: null,
		next: null
	};
	if (workInProgressHook == null) {
		if (currentlyRenderingFiber == null) {
			throw new Error('hooks只能在函数组件中使用');
		} else {
			workInProgressHook = hook;
			currentlyRenderingFiber.memoizedState = workInProgressHook;
		}
	} else {
		workInProgressHook = workInProgressHook.next = hook;
	}
	return workInProgressHook;
}
