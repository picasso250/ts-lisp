import { AstNode, Pair } from "./parse"
import { functions, car, cadr } from "./primary"
import { error } from "./error"

export function evalLisp(astList: Array<AstNode>): Array<String> {
    let ret = []
    let env: Env = new Env(null)
    for (let i = 0; i < astList.length; i++) {
        ret.push(valueToString(evalExpr(astList[i], env)))
    }
    return ret
}
export class Env {
    parent: Env | null
    vars: Map<string, AstNode>
    constructor(parent: Env | null, vars: Map<string, AstNode> = new Map<string, AstNode>()) {
        this.parent = parent;
        this.vars = vars
    }
    has(name: string): boolean {
        return this.vars.has(name) || (this.parent !== null && this.parent.has(name))
    }
    get(name: string): AstNode {
        if (this.vars.has(name)) {
            return this.vars.get(name)
        }
        if (this.parent !== null) {
            return this.parent.get(name)
        }
    }
    set(name: string, value: AstNode) {
        this.vars.set(name, value)
    }
    deriv(vars: Map<string, AstNode>): Env {
        return new Env(this, vars)
    }
}
type value = AstNode
const arithmetic = ["+", "-", "*", "/"]
export function evalExpr(node: AstNode, env: Env): value {
    if (typeof node === "string") {
        if (env.has(node)) {
            return env.get(node)
        }
        if (node in functions || arithmetic.indexOf(node) !== -1) {
            return node
        }
        error("no var " + node)
        return null
    } else if (typeof node === "number") {
        return node
        // todo lambda
    } else {
        const [headRaw, tail] = node
        const head = evalExpr(headRaw, env)
        if (typeof head === "number") {
            error("number can not be a function")
            return null
        }
        if (head === null) {
            // TODO
        }
        if (typeof head === "string") {
            if (functions.has(head)) {
                const func = functions.get(head)
                return func(tail, env)
            }
            if (arithmetic.indexOf(head) !== -1) {
                if (head == "+") {
                    // todo check number
                    // todo support many expressions
                    let [v1, v2] = [evalExpr(car(tail), env), evalExpr(cadr(tail), env)]
                    return <number>v1 + <number>v2
                } else if (head == "-") {
                    // todo check number
                    // todo support many expressions
                    let [v1, v2] = [evalExpr(car(tail), env), evalExpr(cadr(tail), env)]
                    return <number>v1 - <number>v2
                } else if (head == "*") {
                    // todo check number
                    // todo support many expressions
                    let [v1, v2] = [evalExpr(car(tail), env), evalExpr(cadr(tail), env)]
                    return <number>v1 * <number>v2
                } else if (head == "/") {
                    // todo check number
                    // todo support many expressions
                    let [v1, v2] = [evalExpr(car(tail), env), evalExpr(cadr(tail), env)]
                    return <number>v1 / <number>v2
                }
            }
        }
        // todo lambda
    }
}
function valueToString(value: value): string {
    return value.toString()
}