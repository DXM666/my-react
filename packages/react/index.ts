import { jsx, isValidElement as isValidElementFn } from './src/jsx';
import {
	Dispatcher,
	resolveDispatcher,
	currentDispatcher
} from './src/currentDispatcher';

export const useState: Dispatcher['useState'] = (initState: any) => {
	const currentDispatcher = resolveDispatcher();
	return currentDispatcher.useState(initState);
};

export const useEffect: Dispatcher['useEffect'] = (
	create: () => (() => void) | void,
	deps?: any[]
) => {
	const currentDispatcher = resolveDispatcher();
	return currentDispatcher.useEffect(create, deps);
};

export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	currentDispatcher
};

export const createElement = jsx;
export const isValidElement = isValidElementFn;
