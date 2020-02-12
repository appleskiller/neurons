
export interface ICaseDesc {
    title: string;
    bootstrap: (container: HTMLElement) => void;
}
export interface IDemoDesc {
    title: string;
    cases: ICaseDesc[];
}
export const demos = [];
export function register(desc: IDemoDesc) {
    demos.push(desc);
}
