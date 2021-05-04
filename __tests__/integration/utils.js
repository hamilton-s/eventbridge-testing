import { v4 as uuid } from "uuid";
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const filename = `html-file-${uuid()}`;

export const profileArg = process.argv.filter((x) =>
  x.startsWith("--profile=")
)[0];
export const profile = profileArg ? profileArg.split("=")[1] : "default";
