import { AstNode, Pair, Value, Clojure } from "./ast"
import { functions, car, cadr, cddr, caddr, atom, cdr, isClosure } from "./primary"
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
    vars: Map<string, Value>
    constructor(parent: Env | null, vars: Map<string, Value> = new Map<string, Value>()) {
        this.parent = parent;
        this.vars = vars
    }
    has(name: string): boolean {
        return this.vars.has(name) || (this.parent !== null && this.parent.has(name))
    }
    get(name: string): Value {
        if (this.vars.has(name)) {
            return <Value>(this.vars.get(name))
        }
        if (this.parent !== null) {
            return this.parent.get(name)
        }
        return null
    }
    set(name: string, Value: Value): Env {
        this.vars.set(name, Value)
        return this
    }
    deriv(vars: Map<string, Value>): Env {
        return new Env(this, vars)
    }

}

export function evalExpr(node: AstNode, env: Env): Value {

    if (node === null) return null

    // 7 primary
    if (node instanceof Pair) {
        const headRaw = node.left
        const tail = node.right
        let head = evalExpr(<AstNode>headRaw, env)
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
                return (<(tail: AstNode, env: Env) => AstNode>func)(<AstNode>tail, env)
            } else {
                error("no function found", head)
                return null
            }
        }
        // lambda
        if (isClosure(head)) {
            return apply(<Clojure>head, <AstNode>tail, env)
        } else {
            error("Invalid function (a list but not lambda)", node)
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
function apply(func: Clojure, tail: AstNode, env: Env): Value {
    // if (!isList(tail) || length(tail) != 2) {
    //     error("let must have a list of define and a Value")
    //     return null
    // }
    let lmd = func.lambda
    let envClos = func.env;
    let defNameList = cadr(<Pair>lmd);
    // if (!isList(defNameList) || length(defNameList) < 1) {
    //     error("define list must have at leat one define")
    //     return null
    // }
    let vars = new Map()
    if (typeof defNameList === "string") {
        // lambda lst
        // todo check tail is list
        vars.set(defNameList, evalEvery(<Pair>tail, env))
    } else {
        while (defNameList !== null) {
            const varName = car(<Pair>defNameList)
            if (typeof varName !== "string") {
                error("parameter must be a name")
                return null
            }
            vars.set(varName, evalExpr(<AstNode>car(<Pair>tail), env))
            tail = <AstNode>cdr(<Pair>tail)
            defNameList = cdr(<Pair>defNameList)
        }
    }
    let body = cddr(<Pair>lmd) // todo: check body exists
    let r = null
    let newEnv = envClos.deriv(vars)
    // support multi body
    while (body !== null) {
        r = evalExpr(<AstNode>car(<AstNode>body), newEnv)
        body = cdr(<Pair>body)
    }
    return r
}
function evalEvery(lst: Pair, env: Env): Pair {
    let ret = lst
    while (lst !== null) {
        lst.left = evalExpr(<AstNode>car(lst), env)
        lst = <Pair>cdr(<Pair>lst)
    }
    return ret
}

export function valueToString(Value: Value): string {
    if (Value === null) {
        return "nil"
    }
    // todo lambda
    return astToString(<AstNode>Value)
}

export function astToString(ast: AstNode, isShort: boolean = false): string {
    if (ast === null) {
        return "nil"
    }
    if (typeof ast == "string") {
        return ast
    }
    if (typeof ast == "number") {
        return ast.toString()
    }
    const right = cdr(ast)
    if (right === null)
        return astToStringInner(astToString(<AstNode>car(ast)), isShort)
    if (!atom(right)) {
        const inner = astToString(<AstNode>car(ast)) + " " + astToString(<AstNode>right, true)
        return astToStringInner(inner, isShort)
    }
    const inner = astToString(<AstNode>car(ast)) + " . " + astToString(<AstNode>right)
    return astToStringInner(inner, isShort)
}
function astToStringInner(represent: string, isShort: boolean): string {
    if (isShort) return represent
    return "(" + represent + ")"
}