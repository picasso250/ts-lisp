import { AstNode, Pair, Value, Clojure } from "./ast"
import { Env, evalExpr } from "./eval"
import { error } from "./error"

const functions: Map<string, (tail: AstNode, env: Env) => AstNode> = new Map()
    .set("quote", (tail: AstNode, env: Env): Value => {
        // in fact, quote will never return a Clojure
        return car(tail)
    })
    .set("atom", (tail: AstNode, env: Env): Value => {
        // if (!isList(tail)) {
        //     error("call atom with a list please")
        //     return null
        // }
        const p = car(tail)
        const v = evalExpr(<AstNode>p, env)
        return !isPair(v) ? "#t" : null
    })
    .set("eq", (tail: AstNode, env: Env): Value => {
        // if (!isList(tail)) {
        //     error("call eq with a list please")
        //     return null
        // }
        // if (length(<Pair>tail) != 2) {
        //     error("eq must have 2 parameters")
        //     return null
        // }
        let [_v1, _v2] = [car(tail), cadr(<Pair>tail)]
        let [v1, v2] = [evalExpr(<AstNode>_v1, env), evalExpr(<AstNode>_v2, env)]
        return eq(v1, v2) ? "#t" : null
    })
    .set("car", (tail: AstNode, env: Env): Value => {
        // if (v === null) {
        //     error("car of nil");
        //     return null;
        // }
        // if (atom(v)) {
        //     error("car of atom");
        // }
        const v = evalExpr(<AstNode>car(tail), env)
        // todo check type
        return (<Pair>v)[0]
    })
    .set("cdr", (tail: AstNode, env: Env): Value => {
        // if (v === null) {
        //     error("cdr of nil");
        //     return null;
        // }
        // if (atom(v)) {
        //     error("cdr of atom");
        // }
        const v = evalExpr(<AstNode>car(tail), env)
        // todo check type
        return (<Pair>v)[1]
    })
    .set("cons", (tail: AstNode, env: Env): Value => {
        // if (!isList(tail)) {
        //     error("call cons with a list please")
        //     return null
        // }
        // if (length(<Pair>tail) != 2) {
        //     error("cons must have 2 parameters")
        //     return null
        // }
        let [_v1, _v2] = [car(tail), cadr(<Pair>tail)]
        let [v1, v2] = [evalExpr(<AstNode>_v1, env), evalExpr(<AstNode>_v2, env)]
        return cons(v1, v2)
    })
    .set("cond", (tail: AstNode, env: Env): Value => {
        // if (!isList(tail) || length(tail) != 1) {
        //     error("cond must have a list of conditions")
        //     return null
        // }
        let condList = tail;
        const newEnv = env.deriv(new Map().set("else", "#t"))
        while (condList !== null) {
            const condExpr = car(<Pair>condList)
            // if (!(isList(condExpr) && length(condExpr) == 2)) {
            //     error("cond-expr must be list of 2 elements")
            //     return null
            // }
            const c = evalExpr(<AstNode>car(<Pair>condExpr), newEnv)
            if (c !== null) {
                const v = evalExpr(<AstNode>cadr(<Pair>condExpr), env)
                return v
            }
            condList = <AstNode>cdr(<Pair>condList)
        }
        // error("all cond failed")
        return null
    })
    // let is unnessary, but for teach purpose, we leave it here
    .set("let", function (tail: AstNode, env: Env): Value {
        // if (!isList(tail) || length(tail) != 2) {
        //     error("let must have a list of define and a value")
        //     return null
        // }
        let defList = car(<Pair>tail);
        // if (!isList(defList) || length(defList) < 1) {
        //     error("define list must have at leat one define")
        //     return null
        // }
        let vars = new Map()
        while (defList !== null) {
            const def = car(<Pair>defList)
            // if (!(isList(def) && length(def) == 2)) {
            //     error("let-define must be list of 2 elements")
            //     return null
            // }
            // cons newEnv=env.deriv({"else":"#t"})
            const varName = car(<Pair>def)
            if (typeof varName !== "string") {
                error("let-define must have a name")
                return null
            }
            vars.set(varName, evalExpr(<AstNode>cadr(<Pair>def), env))
            defList = cdr(<Pair>defList)
        }
        const letBody = cadr(<Pair>tail)
        return evalExpr(<AstNode>letBody, env.deriv(vars))
    })
    .set("lambda", function (tail: AstNode, env: Env): Value {
        // if (!isList(tail) || length(tail) != 2) {
        //     error("let must have a list of define and a value")
        //     return null
        // }
        // lambda (x) body
        const varList = car(tail)
        // todo check varList all be names
        return [cons("lambda", tail), env]
    })
    .set("define", function (tail: AstNode, env: Env): Value {
        // if (!isList(tail) || length(tail) != 2) {
        //     error("let must have a list of define and a value")
        //     return null
        // }
        // lambda (x) body
        const name = car(tail)
        if (name === null) {
            error("name can not be nil")
            return null
        }
        if (typeof name === "number") {
            error("name can not be a number")
        }
        if (typeof name === "string") {
            define(name, <AstNode>cadr(tail), env)
            return null
        }
        const realName = car(name)
        if (typeof realName === "string") {
            const parameters = cdr(name)
            const lambda = cons("lambda", cons(parameters, cdr(tail)))
            define(realName, lambda, env)
        } else {
            error("define name must be atom")
        }
        // todo define body not empty
        return null
    })
    .set("+", (tail: AstNode, env: Env): AstNode => {
        // todo check number
        // todo support many expressions
        let [_v1, _v2] = [car(tail), cadr(<Pair>tail)]
        let [v1, v2] = [evalExpr(<AstNode>_v1, env), evalExpr(<AstNode>_v2, env)]
        return <number>v1 + <number>v2
    })
    .set("-", (tail: AstNode, env: Env): AstNode => {
        // todo check number
        // todo support many expressions
        let [_v1, _v2] = [car(tail), cadr(<Pair>tail)]
        let [v1, v2] = [evalExpr(<AstNode>_v1, env), evalExpr(<AstNode>_v2, env)]
        return <number>v1 - <number>v2
    })
    .set("*", (tail: AstNode, env: Env): AstNode => {
        // todo check number
        // todo support many expressions
        let [_v1, _v2] = [car(tail), cadr(<Pair>tail)]
        let [v1, v2] = [evalExpr(<AstNode>_v1, env), evalExpr(<AstNode>_v2, env)]
        return <number>v1 * <number>v2
    })
    .set("/", (tail: AstNode, env: Env): AstNode => {
        // todo check number
        // todo support many expressions
        let [_v1, _v2] = [car(tail), cadr(<Pair>tail)]
        let [v1, v2] = [evalExpr(<AstNode>_v1, env), evalExpr(<AstNode>_v2, env)]
        return <number>v1 / <number>v2
    })

export { functions }

export function isPair(v: Value): boolean {
    return !atom(v) && !isClosure(v)
}
export function atom(v: Value): boolean {
    return v === null || typeof v === "string" || typeof v === "number";
}
export function eq(v1: Value, v2: Value): boolean {
    if (v1 === null && v2 === null) return true;
    if (typeof v1 === "string" && typeof v2 === "string")
        return v1 === v2;
    if (typeof v1 === "number" && typeof v2 === "number")
        return v1 === v2;
    return false;
}
export function car(v: Value): Value {
    // if (v === null) {
    //     error("car of nil");
    //     return null;
    // }
    // if (atom(v)) {
    //     error("car of atom");
    // }
    return (<Pair>v)[0]
}
export function cdr(v: Value): Value {
    // if (v === null) {
    //     error("cdr of nil");
    //     return null;
    // }
    // if (atom(v)) {
    //     error("cdr of atom");
    // }
    return (<Pair>v)[1]
}
export function cons(v1: Value, v2: Value): Pair {
    return [v1, v2]
}

// ---- below is not primary, but for convenience
export function cadr(v: Value): Value {
    // todo error checking
    return (<Pair>(<Pair>v)[1])[0]
}
export function cddr(v: Value): Value {
    // todo error checking
    return (<Pair>(<Pair>v)[1])[1]
}
export function caddr(v: Value): Value {
    // todo error checking
    return (<Pair>(<Pair>(<Pair>v)[1])[1])[0]
}
export function length(v: Value): number {
    let i = 0
    while (v !== null) {
        if (atom(v)) {
            error("length must be pair, atom given")
            break
        }
        i++
        [, v] = <Pair>v;
    }
    return i
}
export function isList(v: AstNode): boolean {
    if (v === null) return true
    while (v !== null) {
        if (atom(v)) {
            return false
        }
        let [, _v] = <Pair>v;
        v = <AstNode>_v
    }
    return true
}
export function isNull(value: AstNode): boolean {
    return value === null;
}
export function isClosure(p: Value): boolean {
    if (atom(p)) return false
    let [lmd, env] = <Clojure>p
    return car(lmd) === "lambda" && env instanceof Env
}
function define(name: string, node: AstNode, env: Env) {
    // todo name not over write system functions
    const v = evalExpr(node, env)
    env.set(<string>name, v)
}