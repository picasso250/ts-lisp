import { AstNode, Pair, Value, Clojure, makeNil, makeT } from "./ast"
import { Env, evalExpr } from "./eval"
import { Token } from "./parse"
import { error, Error } from "./error"
import { type } from "os"

type prrt = Value | Error | null // just for short "primary return type"
const functions: Map<string, (tail: AstNode, env: Env) => prrt> = new Map()
    .set("quote", (tail: AstNode, env: Env): prrt => {
        if (!isListLen(tail, 1)) {
            return new Error("quote must have 1 parameter", tail.lineNumber, tail)
        }
        // in fact, quote will never return a Clojure
        return (<Pair<AstNode>>tail).left
    })
    .set("atom", (tail: AstNode, env: Env): prrt => {
        if (!isListLen(tail, 1)) {
            return new Error("atom must have 1 parameter", tail.lineNumber, tail)
        }
        const p = (<Pair<AstNode>>tail).left
        const v = evalExpr(p, env)
        if (v === null) {
            return new Error("atom 's paprameter must have a value, note define",
                tail.lineNumber, tail)
        }
        if (v instanceof Error) {
            return v
        }
        return !(v instanceof Pair) ? makeT(tail.lineNumber) : makeNil(tail.lineNumber)
    })
    .set("eq", (tail: AstNode, env: Env): prrt => {
        if (!isListLen(tail, 1)) {
            return new Error("eq must have 2 parameters", tail.lineNumber, tail)
        }
        const t = tail as Pair<AstNode>
        let [_v1, _v2] = [(t).left, (t.right as Pair<AstNode>).left]
        const v1 = evalExpr(<AstNode>_v1, env)
        if (v1 === null) {
            return new Error("eq first must have a value, not a define", _v1.lineNumber, _v1)
        }
        if (v1 instanceof Error) {
            return v1
        }
        const v2 = evalExpr(<AstNode>_v2, env)
        if (v2 === null) {
            return new Error("eq second must have a value, not a define", _v2.lineNumber, _v2)
        }
        if (v2 instanceof Error) {
            return v2
        }
        const e = v1 instanceof Token && v2 instanceof Token && v1.value === v2.value
        return e ? makeT(tail.lineNumber) : makeNil(tail.lineNumber)
    })
    .set("car", (tail: AstNode, env: Env): prrt => {
        if (!isListLen(tail, 1)) {
            return new Error("car must have 1 parameter", tail.lineNumber, tail)
        }
        let lst = (tail as Pair<AstNode>).left
        const v = evalExpr(<AstNode>lst, env)
        if (v === null) {
            return new Error("car's paprameter must have a value, note define",
                tail.lineNumber, tail)
        }
        if (v instanceof Error) {
            return v
        }
        if (!(v instanceof Pair)) {
            return new Error("car must have a pair", tail.lineNumber, tail);
        }
        return v.left
    })
    .set("cdr", (tail: AstNode, env: Env): prrt => {
        if (!isListLen(tail, 1)) {
            return new Error("cdr must have 1 parameter", tail.lineNumber, tail)
        }
        const v = evalExpr(<AstNode>(tail as Pair<AstNode>).left, env)
        if (v === null) {
            return new Error("cdr's paprameter must have a value, note define",
                tail.lineNumber, tail)
        }
        if (v instanceof Error) {
            return v
        }
        if (v instanceof Pair)
            return v.right
        return new Error("cdr must have a pair", tail.lineNumber, tail);
    })
    .set("cons", (tail: AstNode, env: Env): prrt => {
        if (!isListLen(tail, 1)) {
            return new Error("cons must have 2 parameters", tail.lineNumber, tail)
        }
        const t = tail as Pair<AstNode>
        let [_v1, _v2] = [(t).left, (t.right as Pair<AstNode>).left]
        const v1 = evalExpr(<AstNode>_v1, env)
        if (v1 === null) {
            return new Error("cons first must have a value, not a define", _v1.lineNumber, _v1)
        }
        if (v1 instanceof Error) {
            return v1
        }
        const v2 = evalExpr(<AstNode>_v2, env)
        if (v2 === null) {
            return new Error("cons second must have a value, not a define", _v2.lineNumber, _v2)
        }
        if (v2 instanceof Error) {
            return v2
        }
        return new Pair<Value>(v1, v2)
    })
    .set("cond", (tail: AstNode, env: Env): prrt => {
        if (!isList(tail) || length(tail) < 1) {
            return new Error("cond must have a list of conditions", tail.lineNumber, tail)
        }
        let condList = tail;
        const newEnv = env.deriv(new Map().set("else", makeT(tail.lineNumber)))
        while (!isNil(condList)) {
            const condExpr = (<Pair<AstNode>>condList).left
            if (!(isListLen(condExpr, 2))) {
                return new Error("cond-expr must be list of 2 elements", condExpr.lineNumber, condExpr)
            }
            const condition = (<Pair<AstNode>>condExpr).left
            const c = evalExpr(<AstNode>condition, newEnv)
            if (c === null) {
                return new Error("cond must not have define as condition", condition.lineNumber, condition)
            }
            if (c instanceof Error) {
                return c
            }
            if (!isNil(c)) {
                const v = evalExpr(((<Pair<AstNode>>condExpr).right as Pair<AstNode>).left, env)
                return v
            }
            condList = <AstNode>(<Pair<AstNode>>condList).right
        }
        return new Error("all cond failed", tail.lineNumber, tail)
    })
    // let is unnessary, but for teach purpose, we leave it here
    .set("let", function (tail: AstNode, env: Env): prrt {
        if (!isList(tail) || length(tail) != 2) {
            return new Error("let must have a list of define and a value", tail.lineNumber, tail)
        }
        let defList = (<Pair<AstNode>>tail).left;
        if (!isList(defList) || length(defList) < 1) {
            return new Error("define list must have at leat one define", defList.lineNumber, defList)
        }
        let vars = new Map()
        while (!isNil(defList)) {
            const def = (<Pair<AstNode>>defList).left
            if (!(isListLen(def, 2))) {
                return new Error("let-define must be list of 2 elements", def.lineNumber, def)
            }
            const varName = (<Pair<AstNode>>def).left
            if (!(varName instanceof Token && typeof varName.value !== "string")) {
                return new Error("let-define must have a name", varName.lineNumber, varName)
            }
            vars.set(varName.value, evalExpr(((<Pair<AstNode>>def).right as Pair<AstNode>).left, env))
            defList = (<Pair<AstNode>>defList).right
        }
        const letBody = ((<Pair<AstNode>>tail).right as Pair<AstNode>).left
        return evalExpr(<AstNode>letBody, env.deriv(vars))
    })
    .set("lambda", function (tail: AstNode, env: Env, node: AstNode): prrt {
        if (!isList(tail) || length(tail) != 2) {
            return new Error("lambda must have a list of define and a body", tail.lineNumber, tail)
        }
        // lambda (x) body
        const varList = (tail as Pair<AstNode>).left
        // todo check varList all be names
        if (!((varList instanceof Token && typeof varList.value === "string")
            || (isNameList(varList) && length(varList) > 0))) {
            return new Error("lambda var name must be a name or a list of names", varList.lineNumber, varList)
        }
        return new Clojure(node, env)
    })
    .set("define", function (tail: AstNode, env: Env): prrt {
        if (!isList(tail) || length(tail) >= 2) {
            return new Error("define must have name and at least 1 body", tail.lineNumber, tail)
        }
        const name = (tail as Pair<AstNode>).left
        if (name instanceof Token) {
            // define x v
            if (typeof name !== "string") {
                return new Error("name can not be a number", name.lineNumber, name)
            }
            return define(name, ((tail as Pair<AstNode>).right as Pair<AstNode>).left, env)
        }
        const realName = (name as Pair<AstNode>).left
        if (name instanceof Token) {
            if (typeof realName !== "string") {
                return new Error("define name must be atom", name.lineNumber, name)
            }
            const parameters = (name as Pair<AstNode>).right
            const lambdaToken = new Token("lambda", name.lineNumber)
            const body = (tail as Pair<AstNode>).right
            const lambda = new Pair<AstNode>(lambdaToken, new Pair(parameters, body))
            return define(realName, lambda, env)
        }
        // todo define body not empty
        return null
    })
    .set("+", (tail: AstNode, env: Env): prrt => {
        // todo support many expressions
        const t = tail as Pair<AstNode>
        let [_v1, _v2] = [(t).left, (t.right as Pair<AstNode>).left]
        const v1 = evalExpr(<AstNode>_v1, env)
        if (v1 === null) {
            return new Error("+ first must have a value, not a define", _v1.lineNumber, _v1)
        }
        if (v1 instanceof Error) {
            return v1
        }
        const v2 = evalExpr(<AstNode>_v2, env)
        if (v2 === null) {
            return new Error("+ second must have a value, not a define", _v2.lineNumber, _v2)
        }
        if (v2 instanceof Error) {
            return v2
        }
        if (!(v1 instanceof Token && v2 instanceof Token)) {
            return new Error("+ must have 2 number", tail.lineNumber, tail)
        }
        if (!(typeof v1.value==="number" && typeof v2.value==="number")){
            return new Error("+ must have 2 number", tail.lineNumber, tail)
        }
        return new Token(v1.value + v2.value, tail.lineNumber)
    })
    .set("-", (tail: AstNode, env: Env): prrt => {
        // todo check number
        // todo support many expressions
        const t = tail as Pair<AstNode>
        let [_v1, _v2] = [(t).left, (t.right as Pair<AstNode>).left]
        const v1 = evalExpr(<AstNode>_v1, env)
        if (v1 === null) {
            return new Error("- first must have a value, not a define", _v1.lineNumber, _v1)
        }
        if (v1 instanceof Error) {
            return v1
        }
        const v2 = evalExpr(<AstNode>_v2, env)
        if (v2 === null) {
            return new Error("- second must have a value, not a define", _v2.lineNumber, _v2)
        }
        if (v2 instanceof Error) {
            return v2
        }
        if (!(v1 instanceof Token && v2 instanceof Token)) {
            return new Error("- must have 2 number", tail.lineNumber, tail)
        }
        if (!(typeof v1.value==="number" && typeof v2.value==="number")){
            return new Error("- must have 2 number", tail.lineNumber, tail)
        }
        return new Token(v1.value - v2.value, tail.lineNumber)
    })
    .set("*", (tail: AstNode, env: Env): prrt => {
        // todo check number
        // todo support many expressions
        const t = tail as Pair<AstNode>
        let [_v1, _v2] = [(t).left, (t.right as Pair<AstNode>).left]
        const v1 = evalExpr(<AstNode>_v1, env)
        if (v1 === null) {
            return new Error("* first must have a value, not a define", _v1.lineNumber, _v1)
        }
        if (v1 instanceof Error) {
            return v1
        }
        const v2 = evalExpr(<AstNode>_v2, env)
        if (v2 === null) {
            return new Error("* second must have a value, not a define", _v2.lineNumber, _v2)
        }
        if (v2 instanceof Error) {
            return v2
        }
        if (!(v1 instanceof Token && v2 instanceof Token)) {
            return new Error("* must have 2 number", tail.lineNumber, tail)
        }
        if (!(typeof v1.value==="number" && typeof v2.value==="number")){
            return new Error("* must have 2 number", tail.lineNumber, tail)
        }
        return new Token(v1.value * v2.value, tail.lineNumber)
    })
    .set("/", (tail: AstNode, env: Env): prrt => {
        // todo check number
        // todo support many expressions
        const t = tail as Pair<AstNode>
        let [_v1, _v2] = [(t).left, (t.right as Pair<AstNode>).left]
        const v1 = evalExpr(<AstNode>_v1, env)
        if (v1 === null) {
            return new Error("/ first must have a value, not a define", _v1.lineNumber, _v1)
        }
        if (v1 instanceof Error) {
            return v1
        }
        const v2 = evalExpr(<AstNode>_v2, env)
        if (v2 === null) {
            return new Error("/ second must have a value, not a define", _v2.lineNumber, _v2)
        }
        if (v2 instanceof Error) {
            return v2
        }
        if (!(v1 instanceof Token && v2 instanceof Token)) {
            return new Error("/ must have 2 number", tail.lineNumber, tail)
        }
        if (!(typeof v1.value==="number" && typeof v2.value==="number")){
            return new Error("/ must have 2 number", tail.lineNumber, tail)
        }
        return new Token(v1.value / v2.value, tail.lineNumber)
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

// ---- below is not primary, but for convenience

export function length(v: Value): number {
    let i = 0
    while (v !== null) {
        if (!(v instanceof Pair)) {
            error("length must be pair, atom given")
            break
        }
        i++
        v = (<Pair<Value>>v).right;
    }
    return i
}
export function isNil(v: Value): boolean {
    return v instanceof Token && v.value === "nil"
}
export function isList(v: Value): boolean {
    if (isNil(v)) return true
    while (!isNil(v)) {
        if (!(v instanceof Pair)) {
            return false
        }
        v = ((v).right);
    }
    return true
}
export function isClosure(p: Value): boolean {
    if (atom(p)) return false
    return p instanceof Clojure
}
function define(name: string, node: AstNode, env: Env): Error | null {
    // todo name not over write system functions
    const v = evalExpr(node, env)
    if (v === null) {
        return new Error("define's body should not be another define", node.lineNumber, node)
    }
    if (v instanceof Error) {
        return v
    }
    env.set(<string>name, v)
    return null
}
function isListLen(node: AstNode, len: number): boolean {
    return isList(node) && length(node) === len
}
function isNameList(node: AstNode): boolean {
    if (!isList(node)) {
        return false
    }
    while (!isNil(node)) {
        const v = (node as Pair<AstNode>).left
        if (!(v instanceof Token && typeof v.value === "string")) {
            return false
        }
    }
    return true
}