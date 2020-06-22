import { AstNode, Pair, Value, Clojure, makeNil } from "./ast"
import { functions, atom, isClosure, isList, isNil } from "./primary"
import { error, Error } from "./error"
import { Token } from "./parse"

export function evalLisp(astList: Array<AstNode>): Array<String> | Error {
    let ret = []
    let env: Env = new Env(null)
    for (let i = 0; i < astList.length; i++) {
        const a = evalExpr(astList[i], env)
        if (a === null) {
            continue
        }
        if (a instanceof Error) {
            return a
        }
        ret.push(a.toString())
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
    get(name: string): Value | Error {
        if (this.vars.has(name)) {
            return <Value>(this.vars.get(name))
        }
        if (this.parent !== null) {
            return this.parent.get(name)
        }
        return new Error("no variable named '" + name + "'", 0, null)
    }
    set(name: string, Value: Value): Env {
        this.vars.set(name, Value)
        return this
    }
    deriv(vars: Map<string, Value>): Env {
        return new Env(this, vars)
    }
}

export function evalExpr(node: AstNode, env: Env): Value | Error | null {
    // if (node === null) return null
    // 7 primary
    if (node instanceof Pair) {
        const headRaw = node.left
        const tail = node.right
        let head = evalExpr(<AstNode>headRaw, env)
        if (head === null) {
            return new Error("Invalid function nil", node.lineNumber, node)
        } else if (head instanceof Error) {
            return head
        } else if (head instanceof (Token)) {
            if (typeof head.value === "string") {
                if (head.value === "nil") {
                    return new Error("nil can not be a function", head.lineNumber, node)
                } else if (functions.has(head.value)) {
                    const func = functions.get(head.value) as (tail: AstNode, env: Env, node: AstNode) => AstNode
                    const r = (func)(<AstNode>tail, env, node)
                    return r
                } else {
                    return new Error(`no build in function '${head.value}' found`, head.lineNumber, head)
                }
            } else {
                return new Error("function must be atom", head.lineNumber, node)
            }
        } else if (head instanceof Clojure) {
            return apply(<Clojure>head, <AstNode>tail, env)
        } else {
            return new Error("Invalid function", head.lineNumber, head)
        }
    } else if (node instanceof Token) {
        if (typeof node.value === "string") {
            if (functions.has(node.value)) {
                return node
            }
            if (env.has(node.value)) {
                return env.get(node.value)
            }
            return new Error(`no var '${node.value}`, node.lineNumber, node)
        } else if (typeof node.value === "number") {
            return node
        } else {
            throw new Error("should not happen", node.lineNumber, node)
        }
    }
    throw new Error("should not happen", 0, node)
}

function apply(func: Clojure, tail: AstNode, env: Env): Value | Error {
    // if (!isList(tail) || length(tail) != 2) {
    //     error("let must have a list of define and a Value")
    //     return null
    // }
    let lmd = func.lambda
    let envClos = func.env;
    let defNameList = ((lmd as Pair<AstNode>).right as Pair<AstNode>).left;
    // if (!isList(defNameList) || length(defNameList) < 1) {
    //     error("define list must have at leat one define")
    //     return null
    // }
    let vars = new Map()
    if (typeof defNameList === "string") {
        // lambda lst
        // todo check tail is list
        if (!isList(tail)) {
            return new Error("not a list", tail.lineNumber, tail)
        }
        vars.set(defNameList, evalEvery(tail, env))
    } else {
        // lambda (a b c)
        while (isNil(defNameList)) {
            const varName = (defNameList as Pair<AstNode>).left
            if (!(varName instanceof Token)) {
                return new Error("parameter must be a token", varName.lineNumber, varName)
            }
            if (typeof varName.value !== "string") {
                return new Error("parameter must be a name", varName.lineNumber, varName)
            }
            vars.set(varName.value, evalExpr(<AstNode>(tail as Pair<AstNode>).left, env))
            tail = <AstNode>(tail as Pair<AstNode>).right
            defNameList = (defNameList as Pair<AstNode>).right
        }
    }
    let body = ((lmd as Pair<AstNode>).right as Pair<AstNode>).right
    if (isNil(body)) {
        return new Error("lambda body should not be nil", lmd.lineNumber, lmd)
    }
    let r = null
    let newEnv = envClos.deriv(vars)
    // support multi body
    while (isNil(body)) {
        r = evalExpr(<AstNode>(body as Pair<AstNode>).left, newEnv)
        if (r instanceof Error) {
            return r
        }
        body = (body as Pair<AstNode>).right
    }
    if (r === null) {
        return new Error("lambda body is null(possiblly because it is a define)", lmd.lineNumber, lmd)
    }
    return r
}
function evalEvery(lst: AstNode, env: Env): Value | Error {
    let retList = []
    while (!isNil(lst)) {
        const a = evalExpr(<AstNode>(lst as Pair<AstNode>).left, env)
        if (a === null) {
            return new Error("nil assignment(maybe because define do not have value)", lst.lineNumber, lst)
        }
        if (a instanceof Error) {
            return a
        }
        retList.push(a)
        if (!(lst instanceof Pair)) {
            return new Error("not list", lst.lineNumber, lst)
        }
        lst = lst.right
    }
    if (retList.length === 0) {
        return makeNil(lst.lineNumber)
    }
    let ret: Pair<Value> = new Pair<Value>(makeNil(0), makeNil(0)) // no need, just make typescript happy
    for (let i = retList.length - 1; i >= 0; i--) {
        const node = retList[i]
        if (i === retList.length - 1) {
            ret = new Pair<Value>(node, makeNil(node.lineNumber))
        } else {
            ret = new Pair<Value>(node, ret)
        }
    }
    return ret
}

// export function valueToString(Value: Value): string {
//     if (Value === null) {
//         return "nil"
//     }
//     // todo lambda
//     return astToString(<AstNode>Value)
// }

// export function astToString(ast: AstNode, isShort: boolean = false): string {
//     if (ast === null) {
//         return "nil"
//     }
//     if (typeof ast == "string") {
//         return ast
//     }
//     if (typeof ast == "number") {
//         return ast.toString()
//     }
//     const right = cdr(ast)
//     if (right === null)
//         return astToStringInner(astToString(<AstNode>car(ast)), isShort)
//     if (!atom(right)) {
//         const inner = astToString(<AstNode>car(ast)) + " " + astToString(<AstNode>right, true)
//         return astToStringInner(inner, isShort)
//     }
//     const inner = astToString(<AstNode>car(ast)) + " . " + astToString(<AstNode>right)
//     return astToStringInner(inner, isShort)
// }
function astToStringInner(represent: string, isShort: boolean): string {
    if (isShort) return represent
    return "(" + represent + ")"
}