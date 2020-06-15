import { Env } from "./eval"

export type AstNode = string | number | null | Pair
export type Pair = [Value, Value]
export type Value = AstNode | Clojure
export type Clojure = [AstNode, Env]