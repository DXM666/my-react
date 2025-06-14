import { HookDeps } from 'react-reconciler/fiberHooks';
import { Action, ReactContext, Usable } from 'shared/ReactTypes';

export interface Dispatcher {
	useState: <T>(initialState: T | (() => T)) => [T, Dispatch<T>];
	useEffect: (
		create: () => (() => void) | void,
		deps?: HookDeps | undefined
	) => void;
	useLayoutEffect: (
		create: () => (() => void) | void,
		deps?: HookDeps | undefined
	) => void;
	useTransition: () => [boolean, (callback: () => void) => void];
	useRef: <T>(initialValue: T) => { current: T };
	useContext: <T>(context: ReactContext<T>) => T;
	use: <T>(usable: Usable<T>) => T;
	useMemo: <T>(nextCreate: () => T, deps: HookDeps | undefined) => T;
	useCallback: <T>(callback: T, deps: HookDeps | undefined) => T;
}

export type Dispatch<State> = (action: Action<State>) => void;

export const currentDispatcher: { current: Dispatcher | null } = {
	current: null
};

export function resolveDispatcher() {
	const dispatcher = currentDispatcher.current;
	if (dispatcher == null) {
		throw new Error('hook只能在函数组件中使用');
	}
	return dispatcher;
}
