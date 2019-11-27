import {context} from "@actions/github"

export default function () {
  return /^refs\/tags\/(?<tag>.*)/.exec(context.ref)?.groups?.tag || null
}