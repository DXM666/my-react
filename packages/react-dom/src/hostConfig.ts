import { FiberNode } from 'react-reconciler/fiber';
import { HostText } from 'react-reconciler/workTags';

export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;
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

export function commitUpdate(fiber: FiberNode) {
	switch (fiber.tag) {
		case HostText:
			const text = fiber.memoizedProps.content;
			return commitTextUpdate(fiber.stateNode, text);
		default:
			if (__DEV__) {
				console.warn('未实现的Update类型', fiber);
			}
			break;
	}
}
export function commitTextUpdate(textInstance: TextInstance, content: string) {
	textInstance.textContent = content;
}
export function removeChild(
	child: Instance | TextInstance,
	container: Container
) {
	container.removeChild(child);
}
