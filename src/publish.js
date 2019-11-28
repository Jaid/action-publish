import {exec} from "@actions/exec"
import {getInput} from "@actions/core"
import fsp from "@absolunet/fsp"
import chalk from "chalk"

export default async function ({registry, publishDirectory, dry, npmrcFileName}) {
  const {id} = registry
  const token = getInput(`${id}Token`)
  if (!token) {
    console.log("No token given, skipping")
    return
  }
  console.log(`Token given! (Length: ${token.length})`)
  const host = getInput(`${id}Registry`, {required: true})
  const rc = `registry=https://${host}\n//${host}/:_authToken=${token}`
  console.log(`${chalk.yellow(npmrcFileName)} content:`)
  console.log(chalk.bgBlue(rc))
  await fsp.outputFile(npmrcFileName, rc)
  const args = ["publish", publishDirectory]
  if (dry) {
    args.push("--dry-run")
  }
  await exec("npm", args)
  await fsp.unlink(npmrcFileName)
}