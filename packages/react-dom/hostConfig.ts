import { FiberNode } from 'react-reconciler/fiber';

export type Container = Element;
export function createInstance(fiber: FiberNode): Element {
	return document.createElement(fiber.type, { ...fiber.pendingProps });
}
export function createTextInstance(text: string | number): Text {
	return document.createTextNode(`${text}`);
}
export function appendInitialChild(parent: Element, child: Element) {
	parent.appendChild(child);
}
