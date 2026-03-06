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

const makeOpenAIRequest = async (requestBody, languageModelUrl) => {
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

    const choice = data.choices[0];
    let answer = choice?.message?.content?.trim() || "No response received";

    if (
      choice?.finish_reason === "length" &&
      (!answer || answer === "No response received")
    ) {
      answer =
        "Response truncated due to length limit (reasoning may have consumed the token budget)";
      logger.warn("Azure OpenAI response truncated due to length limit");
    }

    return {
      success: true,
      answer: answer,
      usage: data.usage,
    };
  } catch (error) {
    logger.error("Error making request to Azure OpenAI:", error);
    throw new Error("Failed to connect to Azure OpenAI service");
  }
};

const askContextualQuestion = async (messageBody, prompt, languageModelUrl) => {
  messageBody.max_completion_tokens = 2000;
  return await makeOpenAIRequest(messageBody, languageModelUrl);
};

const askQuestion = async (question, prompt, languageModelUrl) => {
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
  };
  return await makeOpenAIRequest(requestBody, languageModelUrl);
};

// Initialize configuration validation
validateConfig();

module.exports = {
  askQuestion,
  askContextualQuestion,
};
