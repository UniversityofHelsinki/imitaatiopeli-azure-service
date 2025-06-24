const { logger } = require('../logger');
const {askQuestion} = require("../services/azureService");

module.exports = (router) => {
    router.get('/hello', (req, res) => {
        logger.info('hello world');
        res.json({ message: 'Hello, world!' });
    });

    router.get('/ask/:question', async (req, res) => {
        try {
            const question = decodeURIComponent(req.params.question);
            logger.info(`Received question: ${question}`);

            const result = await askQuestion(question);
            res.json(result);
        } catch (error) {
            logger.error('Error processing question:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process question'
            });
        }
    });

};
