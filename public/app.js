class VoiceAssistant {
    constructor() {
        this.isRecording = false;
        this.isPlaying = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.speechSynthesis = window.speechSynthesis;
        
        this.startBtn = document.getElementById('start-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.statusEl = document.getElementById('status');
        this.chatMessages = document.getElementById('chat-messages');
        this.audioPlayer = document.getElementById('audio-player');
        this.waveContainer = document.getElementById('wave-container');
        
        this.startBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => this.stopRecording());
        
        this.checkMicrophonePermission();
    }
    
    async checkMicrophonePermission() {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            this.updateStatus('Ready to listen');
        } catch (error) {
            this.updateStatus('Microphone access denied. Please allow microphone access.');
            this.startBtn.disabled = true;
        }
    }
    
    async startRecording() {
        try {
            // Stop any ongoing speech
            if (this.speechSynthesis.speaking) {
                this.speechSynthesis.cancel();
            }
            
            this.updateStatus('Starting recording...');
            this.isRecording = true;
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.waveContainer.classList.add('recording');
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    sampleSize: 16
                } 
            });
            
            this.audioChunks = [];
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm; codecs=opus'
            });
            
            this.mediaRecorder.addEventListener('dataavailable', event => {
                this.audioChunks.push(event.data);
            });
            
            this.mediaRecorder.addEventListener('stop', () => {
                this.processAudio();
            });
            
            this.mediaRecorder.start(100);
            this.updateStatus('Listening...');
            
        } catch (error) {
            console.error('Error starting recording:', error);
            this.updateStatus('Error: ' + error.message);
            this.resetRecording();
        }
    }
    
    stopRecording() {
        if (this.isRecording && this.mediaRecorder) {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            this.updateStatus('Processing your question...');
            this.waveContainer.classList.remove('recording');
        }
    }
    
    resetRecording() {
        this.isRecording = false;
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.mediaRecorder = null;
    }
    
    async processAudio() {
        try {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm; codecs=opus' });
            
            // Display user message
            this.addMessage('You', 'user-message', 'Audio message...');
            
            // Send to server
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            
            const response = await fetch('/api/process-audio', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            
            // Display bot response
            this.addMessage('Rev', 'bot-message', result.text);
            
            // Speak the response using text-to-speech
            this.speakText(result.text);
            
        } catch (error) {
            console.error('Error processing audio:', error);
            this.addMessage('System', 'error-message', 'Sorry, I encountered an error. Please try again.');
            this.updateStatus('Error: ' + error.message);
            this.resetRecording();
        }
    }
    
    speakText(text) {
        try {
            // Stop any ongoing speech
            if (this.speechSynthesis.speaking) {
                this.speechSynthesis.cancel();
            }
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            utterance.onstart = () => {
                this.updateStatus('Assistant speaking...');
                this.isPlaying = true;
            };
            
            utterance.onend = () => {
                this.updateStatus('Ready to listen');
                this.isPlaying = false;
                this.resetRecording();
            };
            
            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                this.updateStatus('Error speaking text');
                this.isPlaying = false;
                this.resetRecording();
            };
            
            this.speechSynthesis.speak(utterance);
            
        } catch (error) {
            console.error('Error with text-to-speech:', error);
            this.updateStatus('Ready to listen');
            this.resetRecording();
        }
    }
    
    addMessage(sender, cssClass, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', cssClass);
        messageDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    updateStatus(message) {
        this.statusEl.textContent = message;
    }
}

// Initialize the assistant when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new VoiceAssistant();
});