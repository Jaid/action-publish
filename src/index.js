import {exec} from "@actions/exec"
import getActionTag from "lib/getActionTag"

async function main() {
  const tag = getActionTag()
  if (!tag) {
    console.log("No tag found for this trigger, skipping")
    return
  }
  console.log(`Tag: ${tag}`)
  await exec("echo", ["Hello3"])
}

main()