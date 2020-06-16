import { parse } from './parse'
import { evalLisp, astToString } from './eval'
import fs from "fs"

for (const name of ["add", "cond", "list", "define", "prog"]) {
    let data = fs.readFileSync("test/" + name + ".lisp")
    let should = fs.readFileSync("test/" + name + ".res")
    let shouldRes = <Array<string>>(should.toString().match(/[^\r\n]+/g))

    let exprs = parse(data.toString())
    let rs = evalLisp(exprs)
    for (let i = 0; i < exprs.length; i++) {
        test('should be ' + shouldRes[i] + ' when eval ' + astToString(exprs[i]), () => {
            expect(rs[i]).toBe(shouldRes[i])
        })
    }
}
