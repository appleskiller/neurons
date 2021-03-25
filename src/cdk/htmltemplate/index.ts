
import { createElement } from 'neurons-dom';
import { bindingFactory } from '../../binding/factory/factory';

export function renderTemplate(stringTemplate: string, data?: any, anyNodes: boolean = false, requirements?: any[]): HTMLElement | Node | NodeListOf<Node> | HTMLCollection {
    if (!stringTemplate || !stringTemplate.trim()) return null;
    const template = `<div #wrapper>${stringTemplate}</div>`;
    const binding = bindingFactory.create(template, data || {});
    binding.appendTo(createElement('div'));
    const wrapper = binding.element('wrapper') as HTMLElement;
    const children = anyNodes ? wrapper.childNodes : wrapper.children;
    if (children.length === 0) return null;
    if (children.length === 1) return children.item(0);
    binding.destroy();
    return children;
}