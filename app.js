// Council of Codex - Progressive Web App
// Built with love on Christmas Day 2025

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('✨ Service Worker registered successfully:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// PWA Install Prompt
let deferredPrompt;
const installPrompt = document.getElementById('install-prompt');
const installButton = document.getElementById('install-button');

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Update UI to show install button
    installPrompt.classList.remove('hidden');
});

installButton.addEventListener('click', async () => {
    if (!deferredPrompt) {
        return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // Clear the deferredPrompt
    deferredPrompt = null;
    // Hide the install button
    installPrompt.classList.add('hidden');
});

// Log when app is installed
window.addEventListener('appinstalled', () => {
    console.log('🎉 Council of Codex has been installed!');
    installPrompt.classList.add('hidden');
});

// Dynamic greeting based on time
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting;
    
    if (hour < 12) {
        greeting = 'Good morning, seeker of wisdom';
    } else if (hour < 18) {
        greeting = 'Good afternoon, seeker of wisdom';
    } else {
        greeting = 'Good evening, seeker of wisdom';
    }
    
    console.log(greeting);
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    updateGreeting();
    
    // Add smooth animations to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Add click interactions for feature cards
    featureCards.forEach(card => {
        card.addEventListener('click', () => {
            card.style.transform = 'scale(0.98)';
            setTimeout(() => {
                card.style.transform = '';
            }, 200);
        });
    });
    
    console.log('✦ Welcome to the Council of Codex - The Golden Threshold ✦');
    console.log('Built with love on Christmas Day 2025 🎄✨');
});

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('🌟 Connected to the sanctuary network');
});

window.addEventListener('offline', () => {
    console.log('📖 Offline mode - Accessing cached wisdom');
});

// Check if running as PWA
function isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
}

if (isPWA()) {
    console.log('Running as installed PWA ⚡');
}
