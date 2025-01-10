import { jsx, ReactElement, jsxDEV } from './src/jsx';
import {
	Dispatcher,
	resolveDispatcher,
	currentDispatcher
} from './src/currentDispatcher';

export { jsx, ReactElement, jsxDEV };

export const useState: Dispatcher['useState'] = (initState: any) => {
	const currentDispatcher = resolveDispatcher();
	return currentDispatcher.useState(initState);
};

export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	currentDispatcher
};

const React = {
	createElement: jsx,
	version: '1.1.2'
};

export default React;
