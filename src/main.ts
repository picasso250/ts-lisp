
import { AstNode } from "./ast";
import { parse } from "./parse";
import { evalLisp } from "./eval";
import { car, cdr, atom } from "./primary";

function showCodeResults(codeName: string, resName: string, prelude: string) {
    const code = document.getElementById(codeName);
    if ((<HTMLInputElement>code).value) {
        const astList = parse(prelude).concat(parse((<HTMLInputElement>code).value))
        console.log(astList)
        const r = evalLisp(astList)
        console.log(r)
        const res = document.getElementById(resName);
        if (res !== null)
            res.innerText = r.join("\r\n")
    } else {
        alert("Invalid textarea id")
    }
}
function bindRun(runName: string) {
    const run = document.getElementById(runName);
    if (run !== null) {
        fetch("../src/" + "sicp" + '.lisp')
            .then(response => response.text())
            .then(code => {
                run.addEventListener("click", function () {
                    showCodeResults("code", "res", code);
                });
            })
    }
}

function test(files: Array<string>) {
    for (const file of files) {
        fetch("../src/test/" + file + '.lisp')
            .then(response => response.text())
            .then(code => {
                const astList = parse(code)
                // console.log(astList)
                const r = evalLisp(astList)
                fetch("../src/test/" + file + '.res')
                    .then(response => response.text())
                    .then(data => {
                        let res = data.match(/[^\r\n]+/g);;
                        if (!arraysEqual(r, <Array<string>>res)) {
                            console.log("!!!TEST FAIL!!!", file)
                            console.log("   got:", r)
                            console.log("should:", res)
                            console.log("code:", code)
                            // console.log("ast:")
                            // for (const ast of astList) {
                            //     console.log(astToString(ast))
                            // }
                        } else {
                            console.log("test pass", file)
                        }
                    })
            });
    }
}

function arraysEqual<T>(a: Array<T>, b: Array<T>): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

bindRun("run");
// test(["add", "cond", "list", "define", "prog"]);
// test(["define"]);