// Test script to force Spanish language
// Open browser console (F12) and paste this code

console.log('🌍 Current browser language:', navigator.language);

// Override navigator.language to Spanish
Object.defineProperty(navigator, 'language', {
    get: function () {
        return 'es-ES';
    },
    configurable: true
});

console.log('🌍 New browser language:', navigator.language);
console.log('✅ Language changed to Spanish! Reloading page...');

// Reload the page
setTimeout(() => {
    location.reload();
}, 1000);
