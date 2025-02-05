export type Type = any;
export type Key = any;
export type Ref = { current: any } | ((instance: any) => void) | null;
export type Props = any;
export type ElementType = any;

export interface ReactElementType {
	$$typeof: symbol | number;
	key: Key;
	type: Type;
	ref: Ref;
	props: Props;
	__owner: string;
}

export type Action<T> = T | ((prevState: T) => T);

export type ReactContext<T> = {
	$$typeof: symbol | number;
	Provider: ReactProviderType<T> | null;
	_currentValue: T;
};
export type ReactProviderType<T> = {
	$$typeof: symbol | number;
	_context: ReactContext<T> | null;
};
