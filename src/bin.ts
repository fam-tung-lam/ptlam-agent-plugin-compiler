#!/usr/bin/env node

import { runPluginCompilerProcess } from "./cli/main.js";

process.exitCode = await runPluginCompilerProcess(process.argv.slice(2));
