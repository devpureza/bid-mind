// Entry point: constrói o app e dá listen.

import { buildServer } from "./server.js";
import { config } from "./config.js";

async function main() {
  const app = await buildServer();
  try {
    await app.listen({ host: config.HOST, port: config.PORT });
    app.log.info(`BidMind API ready on http://${config.HOST}:${config.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
