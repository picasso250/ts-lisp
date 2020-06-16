import { error } from './error'
import { AstNode, Pair } from './ast'

export function parse(code: string): Array<AstNode> {
    const lines = parsePass01(code);
    const lst0 = parsePass0(lines);
    const lst1 = parsePass1(lst0)
    const r2 = parsePass2(lst1)
    const r3 = parsePass3(r2)
    return r3;
}

// comment
function parsePass01(code: string): Array<string> {
    let res = <Array<string>>code.match(/[^\r\n]+/g);
    let ret = []
    for (let line of res) {
        if (!line.match(/^ *;/)) {
            ret.push(line)
        }
    }
    // console.log(ret)
    return ret
}
// lines to tokens
function parsePass0(lines: Array<string>): Array<string> {
    let word = "";
    let ret = [];
    const code = lines.join("\n");
    for (let i = 0; i < code.length; i++) {
        const c = code.charAt(i);
        if (isSpace(c)) {
            if (word.length > 0) {
                ret.push(word)
                word = "";
            }
        } else if (c == "(" || c == ")") {
            if (word.length > 0) {
                ret.push(word)
                word = "";
            }
            ret.push(c)
        } else {
            word += c;
        }
    }
    if (word.length > 0) {
        ret.push(word)
        word = "";
    }
    return ret;
}
type stringTree = string | Array<string | stringTree>

function parsePass1(tokens: Array<string>): stringTree {
    let [i, v] = parsePass1Inner(0, tokens, [])
    return v;
}

type atomOrPair = string | null | [atomOrPair, atomOrPair]
function parsePass2(st: stringTree): Array<atomOrPair> {
    let ret = []
    for (let i = 0; i < st.length; i++) {
        ret.push(toAtomOrPair(st[i]))
    }
    return ret
}

function parsePass3(lst: Array<atomOrPair>): Array<AstNode> {
    let ret = []
    for (let i = 0; i < lst.length; i++) {
        const node = addNumberType(lst[i])
        ret.push(node)
    }
    return ret
}
function addNumberType(ap: atomOrPair): AstNode {
    if (ap === null)
        return ap;
    else if (typeof ap === "string") {
        if (isDigit(ap.charAt(0))) {
            const n = Number(ap)
            if (n === NaN) {
                console.log("not a number", ap)
            }
            return n
        }
    } else {
        const [left, right] = ap
        return new Pair(addNumberType(left), addNumberType(right))
    }
    return ap
}
function isDigit(theNum: string): boolean {
    const theMask = "0123456789";
    if (theMask.indexOf(theNum) == -1) return (false);
    return (true);
}
function toAtomOrPair(st: stringTree): atomOrPair {
    if (typeof st === "string") {
        return st
    }
    // (st[0] == "(") 
    // todo check
    if (st.length == 2) {
        return null
    }
    if (st.length == 5 && st[2] === ".") {
        return [toAtomOrPair(st[1]), toAtomOrPair(st[3])]
    }
    let newSt = st.slice(1)
    newSt[0] = "("
    return [toAtomOrPair(st[1]), toAtomOrPair(newSt)]
}

function parsePass1Inner(i: number, tokens: Array<string>, begin: Array<string>):
    [number, stringTree] {

    let ret: stringTree = [...begin]
    let willQuote: boolean = false
    while (i < tokens.length) {
        const token = tokens[i];
        if (token == "'") {
            willQuote = true
        } else if (token == "(") {
            let v
            [i, v] = parsePass1Inner(i + 1, tokens, [token])
            if (willQuote) {
                ret.push(["(", "quote", v, ")"])
                willQuote = false
            } else {
                ret.push(v)
            }
            continue
        } else if (token == ")") {
            if (willQuote) {
                error("' before )")
                willQuote = false
            }
            ret.push(token)
            return [i + 1, ret]
        } else {
            if (willQuote) {
                ret.push(["(", "quote", token, ")"])
                willQuote = false
            } else {
                ret.push(token)
            }
        }
        i++
    }
    if (begin.length > 0) {
        console.log("error: ( not match")
    }
    return [i, ret]
}

function isSpace(c: string): boolean {
    return c == " " || c == "\t" || c == "\n" || c == "\r";
}