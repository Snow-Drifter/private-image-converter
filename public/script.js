import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let ffmpeg = null;
let isConverting = false;

async function initFFmpeg() {
    if (ffmpeg?.loaded) return;
    ffmpeg = new FFmpeg();
    const workerURL = new URL('/ffmpeg/worker.js', window.location.origin).href;
    await ffmpeg.load({ classWorkerURL: workerURL });
}

function updateButton() {
    const file = document.getElementById('image').files[0];
    const btn = document.getElementById('convertBtn');
    btn.disabled = !file || isConverting;
}

async function handleConvert(event) {
    event.preventDefault();
    
    const file = document.getElementById('image').files[0];
    const filenameInput = document.getElementById('filename');
    const extensionInput = document.getElementById('extension');
    const filename = filenameInput.value.trim() || filenameInput.placeholder;
    const extension = extensionInput.value.trim() || extensionInput.placeholder;
    const errorMessage = document.getElementById('error-message');
    
    if (!file) return;
    
    // Check if FFmpeg is still loading
    if (!ffmpeg?.loaded) {
        errorMessage.textContent = 'Conversion engine is still loading. Please wait.';
        errorMessage.classList.add('warning');
        errorMessage.style.display = 'block';
        return;
    }
    
    // Disable button during conversion
    isConverting = true;
    updateButton();
    errorMessage.classList.remove('warning');
    errorMessage.style.display = 'none';
    
    // FFmpeg uses 'jpg' internally
    const format = extension.toLowerCase().replace('jpeg', 'jpg');
    const outputFilename = `${filename}.${extension}`;
    // Files need extensions for FFmpeg
    const inputExt = file.name.split('.').pop() || 'bin';
    const inputName = `input.${inputExt}`;
    const outputName = `output.${format}`;
    
    try {
        await ffmpeg.writeFile(inputName, await fetchFile(file));
        const exitCode = await ffmpeg.exec(['-i', inputName, '-y', outputName]);
        
        if (exitCode !== 0) {
            throw new Error('Conversion failed');
        }
        
        const data = await ffmpeg.readFile(outputName);
        const blob = new Blob([data], { type: `image/${format}` });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = outputFilename;
        a.click();
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
        await ffmpeg.deleteFile(outputName);
    } catch (err) {
        errorMessage.textContent = `Couldn't convert ${inputExt} to ${format}.`;
        errorMessage.style.display = 'block';
    } finally {
        try { await ffmpeg.deleteFile(inputName); } catch {}
        isConverting = false;
        updateButton();
    }
}

window.handleConvert = handleConvert;

window.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('image');
    imageInput.value = '';
    document.getElementById('convertBtn').disabled = true;
    const preview = document.getElementById('preview');
    const uploadText = document.querySelector('.upload-text');
    const uploadNote = document.querySelector('.upload-content .upload-note');
    const uploadArea = document.querySelector('.upload-area');
    
    imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';
                uploadText.style.display = 'none';
                if (uploadNote) uploadNote.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
        updateButton();
    });
    
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files[0]?.type.startsWith('image/')) {
            imageInput.files = e.dataTransfer.files;
            imageInput.dispatchEvent(new Event('change'));
        }
    });
    
    const filenameInput = document.getElementById('filename');
    const extensionInput = document.getElementById('extension');
    
    filenameInput.addEventListener('input', (e) => {
        const value = filenameInput.value;
        if (value.includes('.')) {
            const lastDot = value.lastIndexOf('.');
            filenameInput.value = value.slice(0, lastDot);
            extensionInput.value = value.slice(lastDot + 1);
            extensionInput.focus();
        }
        updateButton();
    });
    extensionInput.addEventListener('input', updateButton);
    initFFmpeg().then(updateButton);
});
