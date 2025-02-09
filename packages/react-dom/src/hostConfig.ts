import { FiberNode } from 'react-reconciler/fiber';
import { HostComponent, HostText } from 'react-reconciler/workTags';
import { Props } from 'shared/ReactTypes';
import { DOMElement, updateFiberProps } from './SyntheticEvent';

export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;
export function createInstance(type: string, props: Props): DOMElement {
	const element = document.createElement(type) as unknown as DOMElement;
	updateFiberProps(element, props);
	return element;
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
		case HostComponent:
			return updateFiberProps(fiber.stateNode, fiber.memoizedProps);
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

export function insertChildToContainer(
	child: Instance,
	container: Container,
	before: Instance
) {
	container.insertBefore(child, before);
}

export const scheduleMicroTask =
	typeof queueMicrotask === 'function'
		? queueMicrotask
		: typeof Promise !== 'undefined'
			? (cb: (...args: any) => void) => Promise.resolve().then(cb)
			: setTimeout;

export function hideInstance(instance: Instance) {
	const style = (instance as HTMLElement).style;
	style.setProperty('display', 'none', 'important');
}
export function unhideInstance(instance: Instance) {
	const style = (instance as HTMLElement).style;
	style.display = '';
}
export function hideTextInstance(textInstance: TextInstance) {
	textInstance.nodeValue = '';
}
export function unhideTextInstance(textInstance: TextInstance, text: string) {
	textInstance.nodeValue = text;
}
