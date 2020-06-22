import { parse } from './parse'
import { evalLisp } from './eval'
import fs from "fs"
import { makeNil, AstNode } from './ast'

for (const name of ["add", "cond", "list", "define", "prog"]) {
    let data = fs.readFileSync("test/" + name + ".lisp")
    let should = fs.readFileSync("test/" + name + ".res")
    let shouldRes = <Array<String>>(should.toString().match(/[^\r\n]+/g))

    let exprsOrErr = parse(data.toString())
    test('test parse ' + name, () => {
        expect(exprsOrErr instanceof Error).toBe(false)
    })
    if (exprsOrErr instanceof Error) {
        break
    }
    const exprs = exprsOrErr as AstNode[]
    let rsOrErr = evalLisp(exprs as AstNode[])
    test('test eval ' + name, () => {
        expect(rsOrErr instanceof Error).toBe(false)
    })
    if (rsOrErr instanceof Error) {
        break
    }
    const rs = rsOrErr as String[]
    // test('should be ' + shouldRes + ' when eval ' + (exprs).toString(), () => {
    //     expect(rs).toStrictEqual(shouldRes)
    // })
    for (let i = 0; i < (shouldRes).length; i++) {
        test('should be ' + shouldRes[i] + ' when eval ' , () => {
            expect(rs[i]).toBe(shouldRes[i])
        })
    }
}