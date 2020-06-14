import { parse } from "./parse";
import { evalLisp } from "./eval";
function showCodeResults(codeName: string, resName: string) {
    const code = document.getElementById(codeName);
    if ((<HTMLInputElement>code).value) {
        const astList = parse((<HTMLInputElement>code).value)
        console.log(astList)
        const r = evalLisp(astList)
        console.log(r)
        const res = document.getElementById(resName);
        res.innerText = r.join("\r\n")
    } else {
        alert("Invalid textarea id")
    }
}
function bindRun(runName: string) {
    const run = document.getElementById(runName);
    run.addEventListener("click", function () {
        showCodeResults("code", "res");
    });
}
bindRun("run");