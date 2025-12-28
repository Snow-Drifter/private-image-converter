import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let ffmpeg = null;

async function initFFmpeg() {
    if (ffmpeg?.loaded) return;
    ffmpeg = new FFmpeg();
    const workerURL = new URL('/ffmpeg/worker.js', window.location.origin).href;
    await ffmpeg.load({ classWorkerURL: workerURL });
}

function updateButton() {
    const file = document.getElementById('image').files[0];
    const filename = document.getElementById('filename').value.trim();
    const extension = document.getElementById('extension').value.trim();
    const btn = document.getElementById('convertBtn');
    btn.disabled = !file || !filename || !extension || !ffmpeg?.loaded;
}

async function handleConvert(event) {
    event.preventDefault();
    
    const file = document.getElementById('image').files[0];
    const filename = document.getElementById('filename').value.trim();
    const extension = document.getElementById('extension').value.trim();
    
    if (!file || !filename || !extension) return;
    
    await initFFmpeg();
    
    // FFmpeg uses 'jpg' internally
    const format = extension.toLowerCase().replace('jpeg', 'jpg');
    const outputFilename = `${filename}.${extension}`;
    // Files need extensions for FFmpeg
    const inputExt = file.name.split('.').pop() || 'bin';
    const inputName = `input.${inputExt}`;
    const outputName = `output.${format}`;
    
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec(['-i', inputName, '-y', outputName]);
    
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data], { type: `image/${format}` });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = outputFilename;
    a.click();
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
}

window.handleConvert = handleConvert;

window.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('image');
    const preview = document.getElementById('preview');
    const uploadText = document.querySelector('.upload-text');
    const uploadArea = document.querySelector('.upload-area');
    
    imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';
                uploadText.style.display = 'none';
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
    
    document.getElementById('filename').addEventListener('input', updateButton);
    document.getElementById('extension').addEventListener('input', updateButton);
    initFFmpeg().then(updateButton);
});
