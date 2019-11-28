import path from "path"

import {exec} from "@actions/exec"
import getActionTag from "lib/getActionTag"
import {getInput, group} from "@actions/core"
import fsp from "@absolunet/fsp"
import zahl from "zahl"
import chalk from "chalk"

async function main() {
  const tag = getActionTag()
  if (!tag) {
    console.log("No tag found for this trigger, skipping")
    return
  }
  console.log(`Tag: ${tag}`)
  const npmPrepareScript = getInput("npmPrepareScript")
  if (npmPrepareScript) {
    const execOptions = {}
    const githubToken = getInput("githubToken")
    if (githubToken) {
      execOptions.env = {GITHUB_TOKEN: githubToken}
    }
    await exec("npm", ["run", npmPrepareScript], execOptions)
  }
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
  const npmrcFileName = getInput("npmrcFile", {required: true})
  const registries = [
    {
      title: "GitHub Packages",
      id: "github",
    },
    {
      title: "npm Inc",
      id: "npm",
    },
  ]
  const publishDirectory = path.resolve(getInput("publishDirectory", {required: true}))
  const publishDirectoryEntries = await fsp.scandir(publishDirectory, "file", true)
  console.log(`Publish directory ${chalk.yellow(publishDirectory)} has ${zahl(publishDirectoryEntries, "file")}`)
  for (const registry of registries) {
    group(`Registry: ${registry.title}`, async () => {
      const token = getInput(`${registry.id}Token`)
      if (!token) {
        console.log("No token given, skipping")
        return
      }
      console.log(`Token given! (Length: ${token.length})`)
      const host = getInput(`${registry.id}Registry`, {required: true})
      console.log(`Registry host: ${host}`)
      console.log(`Writing and registry host and npm token to ${npmrcFileName}`)
      await fsp.outputFile(npmrcFileName, `//${host}/:_authToken=${token}`)
      await exec("npm", ["publish", publishDirectory])
    })
  }
}

main()