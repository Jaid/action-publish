import fsp from "@absolunet/fsp"
import {endGroup, getInput, setFailed, startGroup} from "@actions/core"
import {exec} from "@actions/exec"
import {context} from "@actions/github"
import chalk from "chalk"
import getBooleanInput from "get-boolean-action-input"
import path from "path"
import zahl from "zahl"

import getActionTag from "lib/getActionTag"

import publish from "./publish"

// GitHub Actions CI supports color, chalk just does not know that
chalk.level = chalk.Level.Ansi256

async function main() {
  const tag = getActionTag()
  if (!tag) {
    console.log("No tag found for this trigger, skipping")
    return
  }
  console.log(`Tag: ${tag}`)
  const npmPrepareScript = getInput("npmPrepareScript")
  if (npmPrepareScript) {
    /**
     * @type {import("@actions/exec").ExecOptions}
     */
    const execOptions = {}
    const githubToken = getInput("githubToken")
    if (githubToken) {
      execOptions.env = {
        ...process.env,
        GITHUB_TOKEN: githubToken,
      }
    }
    await exec("npm", ["run", npmPrepareScript], execOptions)
  }
  const publishDirectory = path.resolve(getInput("publishDirectory", {required: true}))
  const publishDirectoryExists = await fsp.pathExists(publishDirectory)
  if (!publishDirectoryExists) {
    console.log(`${chalk.yellow(publishDirectory)} does not exist, skipping`)
    return
  }
  const pkgFile = path.resolve(publishDirectory, "package.json")
  const pkgFileExists = await fsp.pathExists(pkgFile)
  if (!pkgFileExists) {
    console.log(`${chalk.yellow(pkgFile)} does not exist, skipping`)
    return
  }
  const pkg = await fsp.readJson5(pkgFile)
  console.log(`Loaded pkg with ${zahl(Object.keys(pkg), "entry")} from ${chalk.yellow(pkgFile)}`)
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
      pkg: {
        ...pkg,
        name: `@${context.payload.repository.full_name}`,
      },
    },
    {
      title: "npm Inc",
      id: "npm",
      pkg: {...pkg},
    },
  ]
  const publishDirectoryEntries = await fsp.scandir(publishDirectory, "file", true)
  console.log(`Publish directory ${chalk.yellow(publishDirectory)} has ${zahl(publishDirectoryEntries, "file")}`)
  const dry = getBooleanInput("dry", {required: true})
  if (dry) {
    console.log("Dry run is activated")
  }
  for (const registry of registries) {
    startGroup(`Registry: ${registry.title}`)
    await publish({
      registry,
      publishDirectory,
      npmrcFileName,
      dry,
      pkgFile,
    })
    endGroup()
  }
}

main().catch(error => {
  console.error(error)
  setFailed("jaid/action-publish threw an Error")
})