import exec from "@actions/exec"

async function main() {
  await exec("echo", ["Hello"])
}

main()