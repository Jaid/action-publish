import fsp from "@absolunet/fsp"
import {getInput} from "@actions/core"
import {exec} from "@actions/exec"
import chalk from "chalk"

export default async function ({registry, publishDirectory, dry, npmrcFileName, pkgFile}) {
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
  await fsp.outputFile(pkgFile, JSON.stringify(registry.pkg))
  await fsp.outputFile(npmrcFileName, rc)
  const args = ["publish", publishDirectory]
  if (dry) {
    args.push("--dry-run")
  }
  await exec("npm", args)
  await fsp.unlink(npmrcFileName)
}