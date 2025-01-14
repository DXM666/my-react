import internals from 'shared/internals';

import { FiberNode } from './fiber';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue,
	UpdateQueue
} from './updateQueue';
import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import { Action } from 'shared';
import { scheduleUpdateOnFiber } from './workLoop';
import { Lane, NoLane, requestUpdateLane } from './fiberLanes';

interface Hook {
	memoizedState: any;
	updateQueue: any;
	next: Hook | null;
}

let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;
let renderLane: Lane = NoLane;

const { currentDispatcher } = internals;

export function renderWithHooks(workInProgress: FiberNode, lane: Lane): any {
	currentlyRenderingFiber = workInProgress;

	// 重置hooks链表
	workInProgress.memoizedState = null;
	workInProgress.updateQueue = null;

	// 重置renderLane
	renderLane = lane;

	const current = workInProgress.alternate;
	if (current !== null) {
		// update
		currentDispatcher.current = HooksDispatcherOnUpdate;
	} else {
		// mount
		currentDispatcher.current = HooksDispatcherOnMount;
	}

	const props = workInProgress.pendingProps;
	const functionComponent = workInProgress.type;
	const children = functionComponent(props);

	// 重置
	currentlyRenderingFiber = null;
	workInProgressHook = null;
	currentHook = null;
	renderLane = NoLane;
	return children;
}

const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState
};
function updateState<State>(): [State, Dispatch<State>] {
	// 找到当前useState对应的hook数据
	const hook = updateWorkInProgressHook();
	// 计算新state的逻辑
	const queue = hook.updateQueue as UpdateQueue<State>;
	const pending = queue.shared.pending;
	if (pending !== null) {
		const { memoizedState } = processUpdateQueue(
			hook.memoizedState,
			pending,
			renderLane
		);
		hook.memoizedState = memoizedState;
		// 清空pending队列
		queue.shared.pending = null;
	}
	return [hook.memoizedState, queue.dispatch as Dispatch<State>];
}
function updateWorkInProgressHook(): Hook {
	// TODO render阶段触发的更新
	let nextCurrentHook: Hook | null;
	if (currentHook === null) {
		// 这是这个FC update时的第一个hook
		const current = currentlyRenderingFiber?.alternate;
		if (current !== null) {
			nextCurrentHook = current?.memoizedState;
		} else {
			// mount
			nextCurrentHook = null;
		}
	} else {
		// 这个FC update时 后续的hook
		nextCurrentHook = currentHook.next;
	}
	if (nextCurrentHook === null) {
		// mount/update u1 u2 u3
		// update       u1 u2 u3 u4
		throw new Error(
			`组件${currentlyRenderingFiber?.type}本次执行时的Hook比上次执行时多`
		);
	}
	currentHook = nextCurrentHook as Hook;
	const newHook: Hook = {
		memoizedState: currentHook.memoizedState,
		updateQueue: currentHook.updateQueue,
		next: null
	};
	if (workInProgressHook === null) {
		// mount时 第一个hook
		if (currentlyRenderingFiber === null) {
			throw new Error('请在函数组件内调用hook');
		} else {
			workInProgressHook = newHook;
			currentlyRenderingFiber.memoizedState = workInProgressHook;
		}
	} else {
		// mount时 后续的hook
		workInProgressHook.next = newHook;
		workInProgressHook = newHook;
	}
	return workInProgressHook;
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
	const lane = requestUpdateLane();
	const update = createUpdate(action, lane);
	enqueueUpdate(updateQueue, update);
	scheduleUpdateOnFiber(fiber, lane);
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
