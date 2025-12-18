// Mock the logger before importing the module
jest.mock("../logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

describe("Azure OpenAI Service", () => {
  let azureOpenAIService;
  let originalEnv;

  beforeAll(() => {
    // Store original environment variables
    originalEnv = { ...process.env };
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Set up environment variables for each test
    process.env.AZURE_OPENAI_API_KEY = "test-api-key";

    // Clear the module cache to ensure fresh imports
    jest.resetModules();
  });

  afterAll(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe("Configuration Validation", () => {
    it("should load successfully with all required environment variables", () => {
      expect(() => {
        azureOpenAIService = require("./azureService");
      }).not.toThrow();
    });

    it("should throw error when AZURE_OPENAI_API_KEY is missing", () => {
      delete process.env.AZURE_OPENAI_API_KEY;

      expect(() => {
        require("./azureService");
      }).toThrow(
        "Missing required Azure OpenAI configuration. Please set AZURE_OPENAI_API_KEY environment variable.",
      );
    });
  });

  describe("askQuestion", () => {
    beforeEach(() => {
      azureOpenAIService = require("./azureService");
    });

    it("should successfully make a request and return response", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: "This is a test response",
            },
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await azureOpenAIService.askQuestion(
        "What is the weather like?",
        "Respond naturally and conversationally as a human would.",
        0.8,
        "https://test-endpoint.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview",
      );

      expect(result).toEqual({
        success: true,
        answer: "This is a test response",
        usage: mockResponse.usage,
      });

      expect(fetch).toHaveBeenCalledWith(
        "https://test-endpoint.openai.azure.com/openai/deployments/test-deployment/chat/completions?api-version=2025-01-01-preview",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": "test-api-key",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content:
                  "Respond naturally and conversationally as a human would.",
              },
              {
                role: "user",
                content: "What is the weather like?",
              },
            ],
            temperature: 0.8,
          }),
        },
      );
    });

    it("should return default message when no content is received", async () => {
      const mockResponse = {
        choices: [
          {
            message: {},
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 0,
          total_tokens: 10,
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await azureOpenAIService.askQuestion("Test question");

      expect(result).toEqual({
        success: true,
        answer: "No response received",
        usage: mockResponse.usage,
      });
    });

    it("should handle API error responses", async () => {
      const errorText = "API rate limit exceeded";

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: jest.fn().mockResolvedValueOnce(errorText),
      });

      await expect(
        azureOpenAIService.askQuestion("Test question"),
      ).rejects.toThrow("Failed to connect to Azure OpenAI service");

      const { logger } = require("../logger");
      expect(logger.error).toHaveBeenCalledWith(
        "Azure OpenAI API error: 429 - API rate limit exceeded",
      );
    });

    it("should handle network errors", async () => {
      fetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(
        azureOpenAIService.askQuestion("Test question"),
      ).rejects.toThrow("Failed to connect to Azure OpenAI service");

      const { logger } = require("../logger");
      expect(logger.error).toHaveBeenCalledWith(
        "Error making request to Azure OpenAI:",
        expect.any(Error),
      );
    });

    it("should log the request and response", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: "Test response",
            },
          },
        ],
        usage: {},
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const longQuestion =
        "This is a very long question that should be truncated in the log message";
      await azureOpenAIService.askQuestion(longQuestion);

      const { logger } = require("../logger");
      expect(logger.info).toHaveBeenCalledWith(
        "Successfully received response from Azure OpenAI",
      );
    });

    it("should handle empty choices array", async () => {
      const mockResponse = {
        choices: [],
        usage: {},
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await azureOpenAIService.askQuestion(
        "Test question",
        "Test prompt",
        0.8,
      );

      expect(result.answer).toBe("No response received");
    });
  });
});
