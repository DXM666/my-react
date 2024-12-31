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
	const props: Props = {};
	let key: Key = null;
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
	const childLength = maybeChildren.length;
	if (childLength === 1) {
		props.children = maybeChildren[0];
	} else if (childLength > 1) {
		props.children = maybeChildren;
	}
	return ReactElement(type, key, ref, props);
};

export { jsx, ReactElement };
