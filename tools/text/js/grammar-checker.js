document.addEventListener('DOMContentLoaded', () => {
	const textInput = document.getElementById('textInput');
	const wordCount = document.getElementById('wordCount');
	const charCount = document.getElementById('charCount');
	const clearBtn = document.getElementById('clearText');
	const checkGrammarBtn = document.getElementById('checkGrammar');
	const resultsContainer = document.getElementById('resultsContainer');
	const errorCount = document.getElementById('errorCount');
	const suggestionCount = document.getElementById('suggestionCount');

	// Update word and character count
	function updateCounts() {
		const text = textInput.value;
		const words = text.trim() ? text.trim().split(/\s+/).length : 0;
		const chars = text.length;
		
		wordCount.textContent = words;
		charCount.textContent = chars;
	}

	// Clear text
	clearBtn.addEventListener('click', () => {
		textInput.value = '';
		updateCounts();
		resetResults();
	});

	// Check grammar
	checkGrammarBtn.addEventListener('click', async () => {
		const text = textInput.value.trim();
		if (!text) {
			showToast('error', 'Please enter some text to check');
			return;
		}

		try {
			showLoading();
			const errors = await analyzeText(text);
			displayResults(errors);
		} catch (error) {
			console.error('Error checking grammar:', error);
			showToast('error', 'Error checking grammar. Please try again.');
		} finally {
			hideLoading();
		}
	});

	async function analyzeText(text) {
		try {
			const response = await fetch('https://api.languagetool.org/v2/check', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: `text=${encodeURIComponent(text)}&language=en-US`
			});

			if (!response.ok) {
				throw new Error('API request failed');
			}

			const data = await response.json();
			
			if (data.matches) {
				const apiErrors = data.matches.map(match => ({
					type: getErrorType(match.rule.category.id),
					context: text.substring(match.offset, match.offset + match.length),
					suggestion: match.replacements.length > 0 
						? `Replace "${match.context.text}" with "${match.replacements[0].value}"`
						: match.message
				}));
				
				// Combine API results with basic checks
				const basicErrors = await performBasicChecks(text);
				return [...apiErrors, ...basicErrors];
			} else {
				// Fallback to basic checks if API response is invalid
				return performBasicChecks(text);
			}
		} catch (error) {
			console.error('API Error:', error);
			// Fallback to basic checks if API fails
			return performBasicChecks(text);
		}
	}

	// Helper function to convert API error types to user-friendly messages
	function getErrorType(category) {
		const errorTypes = {
			'GRAMMAR': 'Grammar Error',
			'TYPOS': 'Spelling Error',
			'PUNCTUATION': 'Punctuation Error',
			'STYLE': 'Style Suggestion',
			'TYPOGRAPHY': 'Typography Error',
			'CASING': 'Capitalization Error',
			'REDUNDANCY': 'Redundancy Error',
			'COLLOQUIALISMS': 'Informal Language',
			'CONFUSED_WORDS': 'Word Choice Error'
		};
		return errorTypes[category] || 'Grammar Error';
	}


	function performBasicChecks(text) {
		const errors = [];
		
		// Common grammar patterns
		const grammarRules = [
			{
				pattern: /(\w+)\s+(want|wants|forgets|puts|make|helps)\s+to\s+(\w+)s\b/g,
				check: (match, subject, verb, infinitive) => ({
					type: 'Grammar Error',
					context: match[0],
					suggestion: `Replace "${match[0]}" with "${subject} ${verb} to ${infinitive}"`
				})
			},
			{
				pattern: /\b(\w+)\s+(?:is|are|was|were)\s+hard\s+to\s+understood\b/g,
				fix: (match) => match.replace('understood', 'understand')
			},
			{
				pattern: /\bmore better\b/g,
				fix: 'better'
			},
			{
				pattern: /\b(they|we|you|I|he|she|it)\s+(?:forgets|puts|makes)\b/g,
				check: (match, pronoun) => ({
					type: 'Subject-Verb Agreement',
					context: match[0],
					suggestion: `Use "forget/put/make" after "${pronoun}"`
				})
			}
		];

		// Common spelling mistakes with context
		const spellingRules = {
			'writting': 'writing',
			'sentenses': 'sentences',
			'grammer': 'grammar',
			'cheker': 'checker',
			'improves': 'improve',
			'alot': 'a lot',
			'dont': "don't",
			'its': (context) => context.match(/\bits\s+[a-z]/i) ? "it's" : "its",
			'than': (context) => context.match(/\bthan\s+(?:they|we|you|I|he|she|it)\b/i) ? "then" : "than"
		};

		// Check for capitalization
		const capitalizationRules = [
			{
				pattern: /\benglish\b/g,
				fix: 'English'
			},
			{
				pattern: /(?:^|\.\s+)([a-z])/g,
				check: (match) => ({
					type: 'Capitalization Error',
					context: match[0],
					suggestion: 'Capitalize the first letter of sentences'
				})
			}
		];

		// Check for punctuation
		const punctuationRules = [
			{
				pattern: /\b(but|so|and|or|nor|for|yet)\s+(?![,"])/g,
				check: (match) => ({
					type: 'Punctuation Error',
					context: match[0],
					suggestion: `Add a comma before "${match[1]}"`
				})
			},
			{
				pattern: /\s+([,.!?])/g,
				check: (match) => ({
					type: 'Punctuation Error',
					context: match[0],
					suggestion: 'Remove space before punctuation'
				})
			}
		];

		// Apply all rules
		const sentences = text.split(/(?<=[.!?])\s+/);
		sentences.forEach(sentence => {
			// Apply grammar rules
			grammarRules.forEach(rule => {
				const matches = sentence.match(rule.pattern);
				if (matches) {
					matches.forEach(match => {
						errors.push({
							type: 'Grammar Error',
							context: sentence,
							suggestion: rule.fix ? `Replace "${match}" with "${rule.fix}"` : rule.check(match).suggestion
						});
					});
				}
			});

			// Apply spelling rules
			Object.entries(spellingRules).forEach(([incorrect, correction]) => {
				const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
				if (sentence.match(regex)) {
					const correctedWord = typeof correction === 'function' ? correction(sentence) : correction;
					errors.push({
						type: 'Spelling Error',
						context: sentence,
						suggestion: `Replace "${incorrect}" with "${correctedWord}"`
					});
				}
			});

			// Apply capitalization rules
			capitalizationRules.forEach(rule => {
				const matches = sentence.match(rule.pattern);
				if (matches) {
					matches.forEach(match => {
						errors.push(rule.check ? rule.check(match) : {
							type: 'Capitalization Error',
							context: sentence,
							suggestion: `Replace "${match}" with "${rule.fix}"`
						});
					});
				}
			});

			// Apply punctuation rules
			punctuationRules.forEach(rule => {
				const matches = sentence.match(rule.pattern);
				if (matches) {
					matches.forEach(match => {
						errors.push(rule.check(match));
					});
				}
			});
		});

		return errors;
	}

	function displayResults(errors) {
		resultsContainer.innerHTML = '';
		errorCount.textContent = errors.length;
		suggestionCount.textContent = errors.length;

		if (errors.length === 0) {
			resultsContainer.innerHTML = `
				<div class="placeholder-message">
					<i class="fas fa-check-circle"></i>
					<p>No grammar errors found!</p>
				</div>
			`;
			return;
		}

		// Create corrected text with proper sentence structure
		let correctedText = textInput.value;
		
		// First, fix capitalization and punctuation
		errors.filter(error => 
			error.type === 'Capitalization Error' || 
			error.type === 'Punctuation Error'
		).forEach(error => {
			if (error.suggestion.startsWith('Replace')) {
				const matches = error.suggestion.match(/Replace "([^"]+)" with "([^"]+)"/);
				if (matches && matches.length === 3) {
					const [_, toReplace, replaceWith] = matches;
					const regex = new RegExp(toReplace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
					correctedText = correctedText.replace(regex, replaceWith);
				}
			}
		});

			// Then fix grammar and spelling
		errors.filter(error => 
			error.type === 'Grammar Error' || 
			error.type === 'Spelling Error' ||
			error.type === 'Subject-Verb Agreement'
		).forEach(error => {
			if (error.suggestion.startsWith('Replace')) {
				const matches = error.suggestion.match(/Replace "([^"]+)" with "([^"]+)"/);
				if (matches && matches.length === 3) {
					const [_, toReplace, replaceWith] = matches;
					const regex = new RegExp(toReplace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
					correctedText = correctedText.replace(regex, replaceWith);
				}
			}
		});

		// Fix spacing around punctuation
		correctedText = correctedText
			.replace(/\s+([,.!?])/g, '$1')  // Remove space before punctuation
			.replace(/([,.!?])(\w)/g, '$1 $2')  // Add space after punctuation
			.replace(/\s+/g, ' ')  // Remove multiple spaces
			.replace(/\s*,\s*/g, ', ')  // Fix comma spacing
			.replace(/\s*\.\s*/g, '. ')  // Fix period spacing
			.trim();

		// Add corrected text section
		const correctedSection = document.createElement('div');
		correctedSection.className = 'corrected-text-section';
		correctedSection.innerHTML = `
			<div class="section-header">
				<h3>Corrected Text</h3>
			</div>
			<div class="corrected-text-container">
				<pre class="corrected-text">${correctedText}</pre>
			</div>
		`;
		resultsContainer.appendChild(correctedSection);

		// Add copy button
		const copyButton = createCopyButton(correctedText);
		correctedSection.querySelector('.section-header').appendChild(copyButton);

		// Add errors section
		const errorsSection = document.createElement('div');
		errorsSection.className = 'errors-section';
		errorsSection.innerHTML = '<h3>Detailed Suggestions</h3>';
		
		// Group errors by type
		const groupedErrors = errors.reduce((acc, error) => {
			acc[error.type] = acc[error.type] || [];
			acc[error.type].push(error);
			return acc;
		}, {});

		Object.entries(groupedErrors).forEach(([type, typeErrors]) => {
			const typeSection = document.createElement('div');
			typeSection.className = 'error-type-section';
			typeSection.innerHTML = `<h4>${type} (${typeErrors.length})</h4>`;
			
			typeErrors.forEach(error => {
				const errorElement = document.createElement('div');
				errorElement.className = 'error-item';
				errorElement.innerHTML = `
					<div class="error-context">${error.context}</div>
					<div class="suggestion">
						<i class="fas fa-lightbulb"></i>
						${error.suggestion}
					</div>
				`;
				typeSection.appendChild(errorElement);
			});
			
			errorsSection.appendChild(typeSection);
		});

		resultsContainer.appendChild(errorsSection);
	}

	function resetResults() {
		resultsContainer.innerHTML = `
			<div class="placeholder-message">
				<i class="fas fa-spell-check"></i>
				<p>Your grammar check results will appear here</p>
			</div>
		`;
		errorCount.textContent = '0';
		suggestionCount.textContent = '0';
	}

	function showLoading() {
		resultsContainer.innerHTML = `
			<div class="placeholder-message">
				<i class="fas fa-spinner fa-spin"></i>
				<p>Checking grammar...</p>
			</div>
		`;
	}

	function hideLoading() {
		// Results will be updated by displayResults
	}

	function showToast(type, message) {
		const toast = document.createElement('div');
		toast.className = `toast ${type}`;
		toast.innerHTML = `
			<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
			<span>${message}</span>
		`;
		
		const container = document.querySelector('.toast-container');
		container.appendChild(toast);
		setTimeout(() => toast.remove(), 3000);
	}

	function createCopyButton(text) {
		const button = document.createElement('button');
		button.className = 'copy-btn';
		button.textContent = 'Copy';
		
		button.addEventListener('click', () => {
			navigator.clipboard.writeText(text).then(() => {
				button.textContent = 'Copied!';
				button.classList.add('copied');
				
				setTimeout(() => {
					button.textContent = 'Copy';
					button.classList.remove('copied');
				}, 2000);
			});
		});
		
		return button;
	}

	// Initialize
	textInput.addEventListener('input', updateCounts);
	updateCounts();
});