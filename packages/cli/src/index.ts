import chalk from "chalk";
import { Command } from "commander";

export function makeCommand(name: string) {
  return new Command(name);
}

export function printLint(line: string) {
  console.log(line);
}

export function printSuccessLine(line: string) {
  const formattedLine = chalk.bgGreen.white(line);
  console.log(formattedLine);
}

export function printErrorLine(line: string) {
  const formattedLine = chalk.bgRed.white(line);
  console.log(formattedLine);
}
