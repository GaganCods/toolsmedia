const express = require('express');
const router = express.Router();
const path = require('path');
const { LanguageServiceClient } = require('@google-cloud/language');

// Initialize the Language client with credentials
const languageClient = new LanguageServiceClient({
	keyFilename: path.join(__dirname, '../config/google-credentials.json')
});

router.post('/analyze', async (req, res) => {
	try {
		const { text } = req.body;
		
		if (!text) {
			return res.status(400).json({ 
				error: 'Text is required',
				errors: [] 
			});
		}

		// Prepare the request
		const document = {
			content: text,
			type: 'PLAIN_TEXT',
		};

		try {
			// Analyze syntax and entities
			const [syntaxResult] = await languageClient.analyzeSyntax({ document });
			const [entityResult] = await languageClient.analyzeEntities({ document });

			// Process results
			const errors = [];

			// Check syntax
			syntaxResult.tokens.forEach((token, index) => {
				const { text: { content }, partOfSpeech } = token;

				// Check capitalization for proper nouns
				if (partOfSpeech.proper === 'PROPER' && content[0] !== content[0].toUpperCase()) {
					errors.push({
						type: 'Capitalization Error',
						context: content,
						suggestion: `Capitalize "${content}"`
					});
				}

				// Check verb agreement
				if (partOfSpeech.tag === 'VERB') {
					const prevToken = index > 0 ? syntaxResult.tokens[index - 1] : null;
					if (prevToken && prevToken.partOfSpeech.tag === 'PRON') {
						// Add verb agreement checks
						// This is a simplified example
						if (prevToken.text.content.toLowerCase() === 'i' && 
							content.toLowerCase() === 'is') {
							errors.push({
								type: 'Grammar Error',
								context: `${prevToken.text.content} ${content}`,
								suggestion: 'Use "am" instead of "is" with "I"'
							});
						}
					}
				}
			});

			// Check entities
			entityResult.entities.forEach(entity => {
				if (entity.type === 'PERSON' || entity.type === 'LOCATION' || entity.type === 'ORGANIZATION') {
					const mention = entity.mentions[0];
					if (mention.text.content[0] !== mention.text.content[0].toUpperCase()) {
						errors.push({
							type: 'Proper Noun Error',
							context: mention.text.content,
							suggestion: `Capitalize "${mention.text.content}"`
						});
					}
				}
			});

			res.json({ errors });
		} catch (apiError) {
			console.error('Google API Error:', apiError);
			// Return empty errors array to allow frontend fallback
			res.json({ errors: [] });
		}
	} catch (error) {
		console.error('Grammar analysis error:', error);
		res.status(500).json({ 
			error: 'Error analyzing text',
			errors: [] 
		});
	}
});

module.exports = router;