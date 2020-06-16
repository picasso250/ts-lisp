import { Env } from "./eval"
import { atom, isClosure } from "./primary"
import { string } from "../node_modules/_@types_yargs@15.0.5@@types/yargs/index"

export type AstNode = string | number | null | Pair
export class Pair {
    left: Value
    right: Value
    constructor(left: Value, right: Value) {
        this.left = left
        this.right = right
    }
    toString(isShort: boolean = false): string {
        const leftString = valueToString(this.left)
        if (this.right === null)
            return astToStringInner(leftString, isShort)
        if (this.right instanceof Pair) {
            const inner = leftString + " " + this.right.toString(true)
            return astToStringInner(inner, isShort)
        }
        const inner = leftString + " . " + valueToString(this.right)
        return astToStringInner(inner, isShort)
    }
}
export type Value = AstNode | Clojure
export class Clojure {
    lambda: AstNode
    env: Env
    constructor(lambda: AstNode, env: Env) {
        this.lambda = lambda
        this.env = env
    }
    toString() {
        return "[" + (<Pair>this.lambda).toString() + " with env" + "]"
    }
}

function valueToString(value: Value): string {
    return value === null ? "nil" : value.toString()
}
function astToStringInner(represent: string, isShort: boolean): string {
    if (isShort) return represent
    return "(" + represent + ")"
}