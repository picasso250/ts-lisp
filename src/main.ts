
import { AstNode } from "./ast";
import { parse } from "./parse";
import { evalLisp } from "./eval";
import {  atom } from "./primary";

function showCodeResults(codeName: string, resName: string, prelude: string) {
    const code = document.getElementById(codeName);
    if ((<HTMLInputElement>code).value) {
        // const astList = parse(prelude).concat(parse((<HTMLInputElement>code).value))
        const astList = parse((<HTMLInputElement>code).value)
        if (astList instanceof Error) {
            console.log("error")
            return
        }
        console.log(astList.toString())
        const r = evalLisp(<AstNode[]>astList)
        if(r instanceof Error){
            console.log(r)
            return
        }
        const res = document.getElementById(resName);
        if (res !== null){
            res.innerText = (r as String[]).join("\r\n")
        }
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

bindRun("run");
// test(["add", "cond", "list", "define", "prog"]);
// test(["define"]);