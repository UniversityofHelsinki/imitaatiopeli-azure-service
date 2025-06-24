const { logger } = require('../logger');

// Configuration
const config = {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview'
};

// Validate configuration on module load
const validateConfig = () => {
    if (!config.endpoint || !config.apiKey || !config.deploymentName) {
        throw new Error('Missing required Azure OpenAI configuration. Please set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT_NAME environment variables.');
    }
};

const askQuestion = async (question) => {
    try {
        const url = `${config.endpoint}/openai/deployments/${config.deploymentName}/chat/completions?api-version=${config.apiVersion}`;

        const requestBody = {
            messages: [
                {
                    role: "system",
                    content: "Respond naturally and conversationally as a human would." // replace this with game configuration ai prompt from postgres database
                },
                {
                    role: "user",
                    content: question
                }
            ],
            max_tokens: 20, // replace this with game configuration max tokens from postgres database
            temperature: 0.8 // replace this with game configuration temperature from postgres database
        };

        logger.info(`Making request to Azure OpenAI for question: ${question.substring(0, 50)}...`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': config.apiKey
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
            throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        logger.info('Successfully received response from Azure OpenAI');

        return {
            success: true,
            answer: data.choices[0]?.message?.content || 'No response received',
            usage: data.usage
        };

    } catch (error) {
        logger.error('Error making request to Azure OpenAI:', error);
        throw new Error('Failed to connect to Azure OpenAI service');
    }
};

// Initialize configuration validation
validateConfig();

module.exports = {
    askQuestion
};
