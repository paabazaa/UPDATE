// Starts the API server: node server/index.js
import http from "node:http";
import {loadConfig, checkConfig} from "./config.js";
import {createDatabase} from "./db.js";
import {createMailer} from "./mailer.js";
import {createApp} from "./app.js";

const config = loadConfig();
const problems = checkConfig(config);
if (problems.length) {
  console.error("Cannot start the API:\n- " + problems.join("\n- "));
  process.exit(1);
}

const db = createDatabase(config.database);
const handler = createApp({db, config, mailer: createMailer(config)});
const server = http.createServer(handler);
server.listen(config.port, () => console.log(`SURGICISS API listening on port ${config.port}`));

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => db.close().finally(() => process.exit(0))));
}
