import { jsx, isValidElement as isValidElementFn } from './src/jsx';
import {
	Dispatcher,
	resolveDispatcher,
	currentDispatcher
} from './src/currentDispatcher';
import currentBatchConfig from './src/currentBatchConfig';
import { HookDeps } from 'react-reconciler/fiberHooks';
export { createContext } from './src/context';
export {
	REACT_FRAGMENT_TYPE as Fragment,
	REACT_SUSPENSE_TYPE as Suspense
} from 'shared/ReactSymbols';
export { memo } from './src/memo';

export const useState: Dispatcher['useState'] = (initState: any) => {
	const currentDispatcher = resolveDispatcher();
	return currentDispatcher.useState(initState);
};

export const useEffect: Dispatcher['useEffect'] = (
	create: () => (() => void) | void,
	deps?: HookDeps | undefined
) => {
	const currentDispatcher = resolveDispatcher();
	return currentDispatcher.useEffect(create, deps);
};

export const useTransition: Dispatcher['useTransition'] = () => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useTransition();
};

export const useRef: Dispatcher['useRef'] = (initialValue) => {
	const dispatcher = resolveDispatcher() as Dispatcher;
	return dispatcher.useRef(initialValue);
};

export const useContext: Dispatcher['useContext'] = (context) => {
	const dispatcher = resolveDispatcher() as Dispatcher;
	return dispatcher.useContext(context);
};

export const use: Dispatcher['use'] = (usable) => {
	const dispatcher = resolveDispatcher() as Dispatcher;
	return dispatcher.use(usable);
};

export const useMemo: Dispatcher['useMemo'] = (nextCreate, deps) => {
	const dispatcher = resolveDispatcher() as Dispatcher;
	return dispatcher.useMemo(nextCreate, deps);
};

export const useCallback: Dispatcher['useCallback'] = (callback, deps) => {
	const dispatcher = resolveDispatcher() as Dispatcher;
	return dispatcher.useCallback(callback, deps);
};

export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	currentDispatcher,
	currentBatchConfig
};

export const createElement = jsx;
export const isValidElement = isValidElementFn;
