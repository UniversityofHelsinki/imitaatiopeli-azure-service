const { logger } = require("../logger");
const { askQuestion } = require("../services/azureService");

module.exports = (router) => {
  router.get("/hello", (req, res) => {
    logger.info("hello world");
    res.json({ message: "Hello, world!" });
  });

  router.post("/ask", async (req, res) => {
    try {
      const { question, prompt } = req.body;

      if (!question || !prompt) {
        return res.status(400).json({
          success: false,
          error: "Both question and prompt are required",
        });
      }

      logger.info(`Received question: ${question} with prompt: ${prompt}`);

      const result = await askQuestion(question, prompt);
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
