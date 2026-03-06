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
      const { messageBody, prompt, languageModelUrl } = req.body;
      if (!messageBody || !prompt) {
        return res.status(400).json({
          success: false,
          error: "Question and prompt are required",
        });
      }

      const latestUserQuestion = Array.isArray(messageBody?.messages)
        ? [...messageBody.messages].reverse().find((m) => m?.role === "user")
            ?.content
        : undefined;

      logger.info(
        `Making request to Azure OpenAI | question=${latestUserQuestion} | prompt=${prompt}`,
      );
      const result = await askContextualQuestion(
        messageBody,
        prompt,
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
      const { question, prompt, languageModelUrl } = req.body;

      if (!question || !prompt) {
        return res.status(400).json({
          success: false,
          error: "Question and prompt are required",
        });
      }

      logger.info(`Received question: ${question} with prompt: ${prompt} ...`);

      const result = await askQuestion(question, prompt, languageModelUrl);
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
