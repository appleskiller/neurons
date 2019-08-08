export function simulateMouseEvent(target: HTMLElement, name: string) {  
    // 点击位置为屏幕中间  
    const box = target.getBoundingClientRect();
    const sx = box.left + box.width / 2, sy = box.top + box.height / 2, cx = sx, cy = sy;
    const e = new MouseEvent(name, {
        screenX: sx,
        screenY: sy,
        clientX: cx,
        clientY: cy,
    });
    target.dispatchEvent(e);
}