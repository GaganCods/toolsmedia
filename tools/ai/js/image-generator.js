import config from './config.js';

class ImageGenerator {
    constructor() {
        this.generateBtn = document.getElementById('generateBtn');
        this.promptInput = document.getElementById('promptInput');
        this.outputImage = document.getElementById('generatedImage');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.qualitySlider = document.getElementById('quality');
        this.qualityValue = document.getElementById('qualityValue');
        
        this.init();
    }

    init() {
        this.generateBtn.addEventListener('click', () => this.generateImage());
        this.downloadBtn.addEventListener('click', () => this.downloadImage());
        this.qualitySlider.addEventListener('input', (e) => {
            this.qualityValue.textContent = e.target.value;
        });
    }

    async generateImage() {
        try {
            const prompt = this.promptInput.value;
            if (!prompt) {
                throw new Error('Please enter a description');
            }

            this.setLoading(true);
            
            const response = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.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}`
                },
                body: JSON.stringify({
                    prompt: prompt,
                    n: 1,
                    size: document.getElementById('sizeSelect').value,
                    quality: this.qualitySlider.value / 10,
                    response_format: 'url'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate image');
            }

            const data = await response.json();
            this.displayImage(data.data[0].url);
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    displayImage(imageUrl) {
        this.outputImage.src = imageUrl;
        this.outputImage.classList.remove('hidden');
        document.querySelector('.placeholder-text').classList.add('hidden');
        this.downloadBtn.disabled = false;
    }

    async downloadImage() {
        try {
            const response = await fetch(this.outputImage.src);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `generated-image-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            this.showError('Failed to download image');
        }
    }

    setLoading(isLoading) {
        this.generateBtn.disabled = isLoading;
        this.generateBtn.innerHTML = isLoading ? 
            '<i class="fas fa-spinner fa-spin"></i> Generating...' : 
            '<i class="fas fa-magic"></i> Generate Image';
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = message;
        document.querySelector('.toast-container').appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ImageGenerator();
});