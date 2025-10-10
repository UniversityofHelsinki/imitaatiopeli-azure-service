const { logger } = require("../logger");
const {
  askQuestion,
  askContextualQuestion,
} = require("../services/azureService");

module.exports = (router) => {
  router.get("/hello", (req, res) => {
    logger.info("hello world");
    res.json({ message: "Hello, world!" });
  });

  router.post("/askWithContext", async (req, res) => {
    try {
      const { messageBody, prompt, temperature, languageModelUrl } = req.body;

      if (!messageBody || !prompt || !temperature) {
        return res.status(400).json({
          success: false,
          error: "Question, prompt and temperature are required",
        });
      }

      logger.info(
        `Received message body: ${messageBody} with prompt: ${prompt} and temperature ${temperature}...`,
      );

      const result = await askContextualQuestion(
        messageBody,
        prompt,
        temperature,
        languageModelUrl,
      );
      res.json(result);
    } catch (error) {
      logger.error("Error processing question:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process question",
      });
    }
  });

  router.post("/ask", async (req, res) => {
    try {
      const { question, prompt, temperature, languageModelUrl } = req.body;

      if (!question || !prompt || !temperature) {
        return res.status(400).json({
          success: false,
          error: "Question, prompt and temperature are required",
        });
      }

      logger.info(
        `Received question: ${question} with prompt: ${prompt} and temperature ${temperature}...`,
      );

      const result = await askQuestion(
        question,
        prompt,
        temperature,
        languageModelUrl,
      );
      res.json(result);
    } catch (error) {
      logger.error("Error processing question:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process question",
      });
    }
  });
};
