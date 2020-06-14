import { AstNode, Pair } from "./parse"
import { functions, car, cadr, caddr, atom, cdr } from "./primary"
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

export function evalExpr(node: AstNode, env: Env): value {

    if (node === null) return null

    // 7 primary
    if (!atom(node)) {
        const [headRaw, tail] = <Pair>node
        let head = evalExpr(headRaw, env)
        if (head === null) {
            error("nil can not be a function")
            return null
        }
        if (typeof head === "number") {
            error("number can not be a function")
            return null
        }
        if (typeof head === "string") {
            if (functions.has(head)) {
                const func = functions.get(head)
                return func(tail, env)
            }
        }
        // lambda
        if (isLambda(<Pair>head)) {
            return apply(head, tail, env)
        } else {
            error("Invalid function (a list but not lambda)")
            return null
        }
    } else if (typeof node === "string") {
        if (functions.has(node)) {
            return node
        }
        if (env.has(node)) {
            return env.get(node)
        }
        error("no var " + node)
        return null
    } else if (typeof node === "number") {
        return node
    } else {
        error("should not be here")
        return null
    }
}
function apply(func: AstNode, tail: AstNode, env: Env): AstNode {
    // if (!isList(tail) || length(tail) != 2) {
    //     error("let must have a list of define and a value")
    //     return null
    // }
    let defNameList = cadr(<Pair>func);
    // if (!isList(defNameList) || length(defNameList) < 1) {
    //     error("define list must have at leat one define")
    //     return null
    // }
    let vars = new Map()
    while (defNameList !== null) {
        const varName = car(<Pair>defNameList)
        if (typeof varName !== "string") {
            error("parameter must be a name")
            return null
        }
        vars.set(varName, evalExpr(car(<Pair>tail), env))
        tail = cdr(<Pair>tail)
        defNameList = cdr(<Pair>defNameList)
    }
    const body = caddr(<Pair>func) // todo: support multi body
    return evalExpr(body, env.deriv(vars))
}
function isLambda(p: Pair) {
    return car(p) === "lambda"
}
function valueToString(value: value): string {
    return value.toString()
}