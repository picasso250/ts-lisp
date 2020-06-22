export class Error {
    msg: string
    line: number
    info: any
    constructor(msg: string, line: number, info: any) {
        this.msg = msg
        this.line = line
        this.info = info
    }
    show():Error {
        console.error("line " + this.line + " :", this.msg, this.info.toString())
        return this
    }
}
export function error(msg: string, ...vars: Array<any>) {
    console.log("Error:", msg, ...vars);
}