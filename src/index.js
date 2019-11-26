import {context} from "@actions/core"
import {exec} from "@actions/exec"

async function main() {
  console.log(JSON.stringify(context))
  await exec("echo", ["Hello2"])
}

main()