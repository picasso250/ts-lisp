export function error(msg: string, ...vars: Array<any>) {
    console.log("Error:", msg, ...vars);
}