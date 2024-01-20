import Fastify from "fastify";
import { MOCK_EVENT_TYPES } from "./mocks.js";

const fastify = Fastify({
  logger: true,
});

fastify.get(
  "/api/gateway/webhooks/eventtypes/schemas",
  function schemasEndpointHandler(_request, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Credentials", "true");
    reply.send(MOCK_EVENT_TYPES);
  }
);

fastify.get(
  "/api/distribution/v3/webhooks/eventypes/schemas",
  function schemasEndpointHandler(_request, reply) {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Credentials", "true");
    reply.send(MOCK_EVENT_TYPES);
  }
);

const servicePort = 28888;
fastify.listen({ port: servicePort }, function serverListen(err, address) {
  console.log(`Server address:`, address);
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
