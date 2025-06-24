require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const compression = require("compression");
const routes = require("./api/routes.js");
const { logger, errorLogger } = require("./logger.js");

const app = express();
const router = express.Router();

const ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
const port = process.env.OPENSHIFT_NODEJS_PORT || 5000;

app.use(compression());
app.use(helmet());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/api", router);
routes(router);

// Start the server
app.listen(port, ipaddress, () => {
  logger.info(
    `Node.js HTTP server is running on port ${port} and ip address ${ipaddress}`,
  );
});
