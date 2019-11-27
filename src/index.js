import path from "path"

import {exec} from "@actions/exec"
import getActionTag from "lib/getActionTag"
import {getInput} from "@actions/core"
import fsp from "@absolunet/fsp"

async function main() {
  const tag = getActionTag()
  if (!tag) {
    console.log("No tag found for this trigger, skipping")
    return
  }
  console.log(`Tag: ${tag}`)
  const pkgFile = path.resolve("package.json")
  const pkgFileExists = await fsp.pathExists(pkgFile)
  if (!pkgFileExists) {
    console.log("package.json does not exist, skipping")
    return
  }
  const pkg = await fsp.readJson5(pkgFile)
  const packageName = pkg?.name
  if (!packageName) {
    console.log("package.json[name] is not set, skipping")
    return
  }
  if (pkg.private) {
    console.log("package.json[private] is true, skipping")
    return
  }
  const npmToken = getInput("npmToken")
  if (npmToken) {
    const npmrcFileName = getInput("npmrcFile", {required: true})
    const registryHost = getInput("npmRegistry", {required: true})
    console.log(`Writing and registry host and npm token to ${npmrcFileName}`)
    await fsp.outputFile(npmrcFileName, `//${registryHost}/:_authToken=${npmToken}`)
    await exec("npm", ["publish"])
  }
}

main()