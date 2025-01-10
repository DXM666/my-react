import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import {
	Type,
	Key,
	Ref,
	Props,
	ReactElementType,
	ElementType
} from 'shared/ReactTypes';

const ReactElement = (
	type: Type,
	key: Key,
	ref: Ref,
	props: Props
): ReactElementType => {
	const element: ReactElementType = {
		$$typeof: REACT_ELEMENT_TYPE,
		type,
		key,
		ref,
		props,
		__owner: 'DXM'
	};
	return element;
};

const jsx = (
	type: ElementType,
	config: any,
	...maybeChildren: any
): ReactElementType => {
	let key: Key = null;
	const props: Props = {};
	let ref: Ref = null;

	for (const prop in config) {
		const val = config[prop];
		if (prop === 'key') {
			if (val !== undefined) {
				key = '' + val;
			}
			continue;
		}
		if (prop === 'ref') {
			if (val !== undefined) {
				ref = val;
			}
			continue;
		}
		if ({}.hasOwnProperty.call(config, prop)) {
			props[prop] = val;
		}
	}

	const childLength = maybeChildren.length;
	if (childLength === 1) {
		props.children = maybeChildren[0];
	} else if (childLength > 1) {
		props.children = maybeChildren;
	}

	return ReactElement(type, key, ref, props);
};

// 为开发环境导出的 jsx 转换函数
const jsxDEV = (type: ElementType, config: any): ReactElementType => {
	let key: Key = null;
	const props: Props = {};
	let ref: Ref = null;

	if (config !== null) {
		if (config.key !== undefined) {
			key = config.key;
		}
		if (config.ref !== undefined) {
			ref = config.ref;
		}
		Object.assign(props, config);
	}

	return ReactElement(type, key, ref, props);
};

function isValidElement(object: any) {
	return (
		typeof object === 'object' &&
		object !== null &&
		object.$$typeof === REACT_ELEMENT_TYPE
	);
}

// export default jsx;
// export { jsx as jsxRuntime, jsxDEV as jsxDEVRuntime };
export { jsx, jsxDEV, ReactElement, isValidElement };
