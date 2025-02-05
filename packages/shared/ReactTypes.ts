export type Type = any;
export type Key = any;
export type Ref = { current: any } | ((instance: any) => void);
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
