if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('sw.js').then(function(reg) {
            console.log('280 Days SW registered:', reg.scope);
            reg.addEventListener('updatefound', function() {
                const worker = reg.installing;
                if (!worker) return;
                worker.addEventListener('statechange', function() {
                    if (worker.state === 'installed' && navigator.serviceWorker.controller && typeof window.showUpdateToast === 'function') {
                        window.showUpdateToast();
                    }
                });
            });
        }).catch(function(err) {
            console.log('SW registration failed:', err);
        });
    });

    navigator.serviceWorker.addEventListener('controllerchange', function() {
        window.location.reload();
    });
}
