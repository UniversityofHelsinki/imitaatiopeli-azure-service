const { logger } = require("../logger");

// Configuration
const config = {
  apiKey: process.env.AZURE_OPENAI_API_KEY,
};

// Validate configuration on module load
const validateConfig = () => {
  if (!config.apiKey) {
    throw new Error(
      "Missing required Azure OpenAI configuration. Please set AZURE_OPENAI_API_KEY environment variable.",
    );
  }
};

const makeOpenAIRequest = async (requestBody, languageModelUrl, logContext) => {
  try {
    const response = await fetch(languageModelUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": config.apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
      throw new Error(
        `Azure OpenAI API error: ${response.status} - ${errorText}`,
      );
    }

    const data = await response.json();
    logger.info("Successfully received response from Azure OpenAI");

    return {
      success: true,
      answer: data.choices[0]?.message?.content || "No response received",
      usage: data.usage,
    };
  } catch (error) {
    logger.error("Error making request to Azure OpenAI:", error);
    throw new Error("Failed to connect to Azure OpenAI service");
  }
};

const askContextualQuestion = async (
  messageBody,
  prompt,
  temperature,
  languageModelUrl,
  context,
) => {
  messageBody.max_completion_tokens = 550;
  messageBody.temperature = temperature;
  const logContext = `${messageBody.messages[0].content}`;
  return await makeOpenAIRequest(messageBody, languageModelUrl, logContext);
};

const askQuestion = async (question, prompt, temperature, languageModelUrl) => {
  const requestBody = {
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: question,
      },
    ],
    temperature: temperature,
  };

  const logContext = `question: ${question.substring(0, 50)}`;

  return await makeOpenAIRequest(requestBody, languageModelUrl, logContext);
};

// Initialize configuration validation
validateConfig();

module.exports = {
  askQuestion,
  askContextualQuestion,
};
