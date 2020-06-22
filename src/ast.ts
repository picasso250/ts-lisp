import { Env } from "./eval"
import { Token, atomOrPair1, LineNumberableAndStringable } from "./parse"
import { atom, isClosure, isNil } from "./primary"
// import { string } from "../node_modules/_@types_yargs@15.0.5@@types/yargs/index"

export type AstNode = atomOrPair1

export class Pair<T extends LineNumberableAndStringable> {
    left: T
    right: T
    lineNumber: number
    constructor(left: T, right: T) {
        this.left = left
        this.right = right
        this.lineNumber = left.lineNumber
    }
    toString(isShort: boolean = false): string {
        const leftString = (this.left.toString())
        if (isNil(this.right))
            return astToStringInner(leftString, isShort)
        if (this.right instanceof Pair) {
            const inner = leftString + " " + this.right.toString(true)
            return astToStringInner(inner, isShort)
        }
        const inner = leftString + " . " + (this.right.toString())
        return astToStringInner(inner, isShort)
    }
}
export type Value = AstNode | Clojure | Pair<Value>
export class Clojure {
    lambda: AstNode
    env: Env
    lineNumber: number
    constructor(lambda: AstNode, env: Env) {
        this.lambda = lambda
        this.env = env
        this.lineNumber = lambda.lineNumber
    }
    toString() {
        return "[" + (this.lambda).toString() + " with env" + "]"
    }
}

function astToStringInner(represent: string, isShort: boolean): string {
    if (isShort) return represent
    return "(" + represent + ")"
}
export function makeNil(lineNumber: number): Token<string> {
    return new Token("nil", lineNumber)
}
export function makeT(lineNumber: number): Token<string> {
    return new Token("#t", lineNumber)
}