// DOM Elements
const loginPrompt = document.querySelector('.login-prompt');
const generatorContent = document.querySelector('.generator-content');
const promptInput = document.getElementById('promptInput');
const modelSelect = document.getElementById('modelSelect');
const maxTokens = document.getElementById('maxTokens');
const temperature = document.getElementById('temperature');
const temperatureValue = document.getElementById('temperatureValue');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const outputText = document.getElementById('outputText');

// Authentication check
let isAuthenticated = false;

firebase.auth().onAuthStateChanged((user) => {
	isAuthenticated = !!user;
	loginPrompt.classList.toggle('hidden', isAuthenticated);
	generatorContent.classList.toggle('hidden', !isAuthenticated);
	
	// Clear the output when logging out
	if (!isAuthenticated) {
		outputText.textContent = 'Your generated text will appear here...';
		copyBtn.disabled = true;
		promptInput.value = '';
	}
});

// Add event listener for logout button
document.querySelector('.logout').addEventListener('click', async (e) => {
	e.preventDefault();
	try {
		await firebase.auth().signOut();
		showToast('Logged out successfully', 'info');
	} catch (error) {
		console.error('Logout error:', error);
		showToast('Failed to log out', 'error');
	}
});

// Event Listeners
temperature.addEventListener('input', (e) => {
	const value = (e.target.value / 100).toFixed(1);
	temperatureValue.textContent = value;
});

generateBtn.addEventListener('click', generateText);
copyBtn.addEventListener('click', copyToClipboard);

// Text Generation Function
async function generateText() {
	if (!isAuthenticated) {
		showToast('Please sign in to use this feature', 'error');
		return;
	}

	const prompt = promptInput.value.trim();
	if (!prompt) {
		showToast('Please enter a prompt', 'error');
		return;
	}

	try {
		generateBtn.disabled = true;
		generateBtn.textContent = 'Generating...';
		outputText.textContent = 'Generating...';

		const apiKey = await getGoogleApiKey();
		console.log('Making API request...');

		const requestBody = {
			contents: [{
				parts: [{
					text: prompt
				}]
			}]
		};

		console.log('Request body:', requestBody);

		const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(requestBody)
		});

		const data = await response.json();
		console.log('API Response:', data);
		
		if (!response.ok) {
			console.error('API Error Details:', {
				status: response.status,
				statusText: response.statusText,
				data: data
			});
			throw new Error(data.error?.message || `API Error: ${response.status} ${response.statusText}`);
		}

		if (!data.candidates || data.candidates.length === 0) {
			throw new Error('No response generated from AI');
		}

		const generatedText = data.candidates[0]?.content?.parts?.[0]?.text;
		if (!generatedText) {
			throw new Error('Invalid response format from API');
		}

		outputText.innerHTML = formatText(generatedText);
		copyBtn.disabled = false;
		showToast('Text generated successfully', 'success');

	} catch (error) {
		console.error('Full error details:', error);
		outputText.textContent = `Error: ${error.message}`;
		showToast(`Generation failed: ${error.message}`, 'error');
	} finally {
		generateBtn.disabled = false;
		generateBtn.textContent = 'Generate';
	}
}


// Helper Functions
async function getGoogleApiKey() {
	return 'AIzaSyDsuK3HDgw9GTlYqEiZgNK_mxnBegiXEZ4';
}


function formatText(text) {
	// Replace "Headline:" with styled version
	return text.replace(/\*\*(.*?):\*\*/g, '<span class="highlight-text">$1:</span>');
}

function copyToClipboard() {
	const textToCopy = outputText.textContent || outputText.innerText;
	navigator.clipboard.writeText(textToCopy)
		.then(() => showToast('Copied to clipboard', 'success'))
		.catch(() => showToast('Failed to copy text', 'error'));
}

function showToast(message, type = 'info') {
	const toast = document.createElement('div');
	toast.className = `toast toast-${type}`;
	toast.textContent = message;
	
	document.querySelector('.toast-container').appendChild(toast);
	
	setTimeout(() => {
		toast.classList.add('fade-out');
		setTimeout(() => toast.remove(), 300);
	}, 3000);
}

// Initialize temperature value
temperatureValue.textContent = (temperature.value / 100).toFixed(1);