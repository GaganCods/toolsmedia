// Import image compression library
const imageCompression = window.imageCompression;

document.addEventListener('DOMContentLoaded', () => {
	const dropZone = document.getElementById('dropZone');
	const fileInput = document.getElementById('fileInput');
	const imagesList = document.getElementById('imagesList');
	const compressBtn = document.getElementById('compressBtn');
	const downloadBtn = document.getElementById('downloadBtn');
	const qualitySlider = document.getElementById('qualitySlider');
	const qualityValue = document.getElementById('qualityValue');
	const formatSelect = document.getElementById('formatSelect');

	let imagesToCompress = [];

	// Quality slider handler
	qualitySlider.addEventListener('input', (e) => {
		const quality = parseInt(e.target.value);
		qualityValue.textContent = `${quality}%`;
		
		// Update quality value background color based on level
		const getColor = (q) => {
			if (q <= 30) return '#dc2626'; // red
			if (q <= 50) return '#ea580c'; // orange
			if (q <= 70) return '#ca8a04'; // yellow
			if (q <= 90) return '#16a34a'; // green
			return '#15803d'; // dark green
		};
		
		const color = getColor(quality);
		qualityValue.style.background = color;
		
		// Update tooltip text
		const qualityLevel = quality <= 30 ? 'Maximum Compression' :
							quality <= 50 ? 'High Compression' :
							quality <= 70 ? 'Balanced' :
							quality <= 90 ? 'High Quality' : 'Maximum Quality';
		
		qualityValue.title = `${qualityLevel} - ${quality}% quality`;
	});


	// Trigger initial quality slider update
	qualitySlider.dispatchEvent(new Event('input'));

	// File input click handler
	dropZone.addEventListener('click', () => fileInput.click());

	// File input change handler
	fileInput.addEventListener('change', handleFiles);

	// Drag and drop handlers
	dropZone.addEventListener('dragover', (e) => {
		e.preventDefault();
		dropZone.classList.add('dragover');
	});

	dropZone.addEventListener('dragleave', () => {
		dropZone.classList.remove('dragover');
	});

	dropZone.addEventListener('drop', (e) => {
		e.preventDefault();
		dropZone.classList.remove('dragover');
		handleFiles({ target: { files: e.dataTransfer.files } });
	});

	// Handle selected files
	function handleFiles(e) {
		const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
		
		if (files.length === 0) {
			showToast('error', 'Please select valid image files');
			return;
		}

		// Clear previous images if any
		imagesList.innerHTML = '';
		imagesToCompress = [];

		files.forEach(file => {
			const reader = new FileReader();
			reader.onload = (e) => {
				const imageItem = createImageItem(file, e.target.result);
				imagesList.appendChild(imageItem);
				imagesToCompress.push({
					file,
					element: imageItem,
					originalSize: file.size
				});
				updateButtons();
			};
			reader.readAsDataURL(file);
		});
	}


	// Create image item element with remove button
	function createImageItem(file, preview) {
		const div = document.createElement('div');
		div.className = 'image-item';
		const fileSize = file.size > 1024 * 1024 
			? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
			: `${(file.size / 1024).toFixed(2)} KB`;
			
		div.innerHTML = `
			<button class="remove-btn" title="Remove Image">
				<i class="fas fa-trash-alt"></i>
			</button>
			<img src="${preview}" class="image-preview" alt="${file.name}">
			<div class="image-info">
				<div>${file.name}</div>
				<div>Original: ${fileSize}</div>
			</div>
			<div class="image-progress">
				<div class="progress-bar"></div>
			</div>
		`;

		// Add remove button handler
		const removeBtn = div.querySelector('.remove-btn');
		removeBtn.addEventListener('click', () => {
			imagesToCompress = imagesToCompress.filter(img => img.element !== div);
			div.remove();
			updateButtons();
			showToast('success', 'Image removed');
		});

		return div;
	}

	async function compressImage(file, options) {
		const maxDimension = 4096;
		const quality = options.quality;
		
		// Calculate target size based on quality level and original file size
		const getTargetSize = (q, size) => {
			const baseSizeMB = size / (1024 * 1024);
			if (q <= 0.3) return Math.min(baseSizeMB * 0.2, 0.5);  // 80% reduction
			if (q <= 0.5) return Math.min(baseSizeMB * 0.4, 1);    // 60% reduction
			if (q <= 0.7) return Math.min(baseSizeMB * 0.6, 2);    // 40% reduction
			if (q <= 0.9) return Math.min(baseSizeMB * 0.8, 3);    // 20% reduction
			return Math.min(baseSizeMB * 0.9, 5);                  // 10% reduction
		};

		const targetSizeMB = getTargetSize(quality, file.size);
		
		const compressOptions = {
			maxWidthOrHeight: maxDimension,
			useWebWorker: true,
			fileType: options.format === 'original' ? undefined : `image/${options.format}`,
			initialQuality: quality,
			maxSizeMB: targetSizeMB,
			alwaysKeepResolution: true,
			maxIteration: 15,
			onProgress: (progress) => {
				const progressBar = options.progressBar;
				if (progressBar) {
					progressBar.style.width = `${Math.round(progress * 100)}%`;
				}
			}
		};

		try {
			let compressedFile = await imageCompression(file, compressOptions);
			
			// If compression didn't achieve desired reduction, try again with more aggressive settings
			if (compressedFile.size > targetSizeMB * 1024 * 1024 && quality > 0.3) {
				compressOptions.maxSizeMB = targetSizeMB * 0.8;
				compressOptions.initialQuality = Math.max(0.3, quality * 0.8);
				compressedFile = await imageCompression(file, compressOptions);
			}
			
			return compressedFile;
		} catch (error) {
			console.error('Compression error:', error);
			throw error;
		}
	}


	// Compress images
	compressBtn.addEventListener('click', async () => {
		const quality = parseInt(qualitySlider.value) / 100;
		const format = formatSelect.value;

		compressBtn.disabled = true;
		let completed = 0;

		for (const image of imagesToCompress) {
			const progressBar = image.element.querySelector('.progress-bar');
			try {
				progressBar.style.width = '0%';
				const compressedFile = await compressImage(image.file, {
					quality,
					format,
					progressBar
				});

				const sizeInfo = image.element.querySelector('.image-info');
				const compressionRatio = ((1 - compressedFile.size / image.originalSize) * 100).toFixed(1);
				const savedSize = formatSize(image.originalSize - compressedFile.size);
				
				const qualityLevel = quality <= 0.3 ? 'Maximum Compression' :
								   quality <= 0.5 ? 'High Compression' :
								   quality <= 0.7 ? 'Balanced' :
								   quality <= 0.9 ? 'High Quality' : 'Maximum Quality';
				
				sizeInfo.innerHTML = `
					<div>${image.file.name}</div>
					<div>Original: ${formatSize(image.originalSize)}</div>
					<div>Compressed: ${formatSize(compressedFile.size)} (${qualityLevel})</div>
					<div>Saved: ${savedSize} (${compressionRatio}%)</div>
				`;

				image.compressedFile = compressedFile;
				completed++;
			} catch (error) {
				console.error('Compression error:', error);
				progressBar.style.width = '0%';
				showToast('error', `Failed to compress ${image.file.name}`);
			}
		}

		if (completed > 0) {
			downloadBtn.disabled = false;
			showToast('success', `${completed} image${completed > 1 ? 's' : ''} compressed successfully`);
		}
		compressBtn.disabled = false;
	});

	// Download handler
	downloadBtn.addEventListener('click', async () => {
		if (imagesToCompress.length === 1) {
			// Single file download
			const image = imagesToCompress[0];
			if (image.compressedFile) {
				const link = document.createElement('a');
				link.href = URL.createObjectURL(image.compressedFile);
				link.download = `compressed_${image.file.name}`;
				link.click();
				URL.revokeObjectURL(link.href);
			}
		} else {
			// Multiple files - create ZIP
			const zip = new JSZip();
			const downloadText = downloadBtn.querySelector('.download-text');
			downloadBtn.disabled = true;
			downloadText.textContent = 'Creating ZIP...';

			try {
				imagesToCompress.forEach(image => {
					if (image.compressedFile) {
						zip.file(`compressed_${image.file.name}`, image.compressedFile);
					}
				});

				const zipBlob = await zip.generateAsync({ type: 'blob' });
				const link = document.createElement('a');
				link.href = URL.createObjectURL(zipBlob);
				link.download = 'compressed_images.zip';
				link.click();
				URL.revokeObjectURL(link.href);
				showToast('success', 'ZIP file downloaded successfully');
			} catch (error) {
				console.error('ZIP creation error:', error);
				showToast('error', 'Failed to create ZIP file');
			} finally {
				downloadBtn.disabled = false;
				downloadText.textContent = 'Download All';
			}
		}
	});

	// Helper functions
	function formatSize(bytes) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function updateButtons() {
		compressBtn.disabled = imagesToCompress.length === 0;
		downloadBtn.disabled = !imagesToCompress.some(img => img.compressedFile);
	}

	// Toast notification
	function showToast(type, message) {
		const toast = document.createElement('div');
		toast.className = `toast ${type}`;
		toast.textContent = message;
		
		const container = document.querySelector('.toast-container');
		container.appendChild(toast);
		
		setTimeout(() => {
			toast.style.animation = 'slideOut 0.3s ease forwards';
			setTimeout(() => toast.remove(), 300);
		}, 3000);
	}
});