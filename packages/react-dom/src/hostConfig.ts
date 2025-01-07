import { FiberNode } from 'react-reconciler/fiber';

export type Container = Element;
export type Instance = Element;
export function createInstance(fiber: FiberNode): Instance {
	return document.createElement(fiber.type, { ...fiber.pendingProps });
}
export function createTextInstance(text: string | number): Text {
	return document.createTextNode(`${text}`);
}
export function appendInitialChild(parent: Container, child: Instance) {
	parent.appendChild(child);
}
export function appendChildToContainer(parent: Container, child: Instance) {
	parent.appendChild(child);
}
