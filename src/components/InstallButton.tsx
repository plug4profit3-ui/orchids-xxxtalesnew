import React, { useEffect, useState } from 'react';
import Icons from './Icon';

const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it is an iOS device
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Listen for the 'beforeinstallprompt' event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  // If app is already installed (standalone mode), render nothing
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return null;
  }

  // iOS Instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-zinc-900 border border-gold-500/30 p-4 rounded-xl shadow-2xl z-[9999] animate-in slide-in-from-bottom-10">
        <div className="flex items-start gap-3">
            <div className="bg-gold-500/20 p-2 rounded-lg text-gold-500">
                <Icons.Download size={24} />
            </div>
            <div>
                <h4 className="font-bold text-white text-sm">Installeer XXX-Tales</h4>
                <p className="text-xs text-zinc-400 mt-1">
                    Tik op <span className="font-bold">Delen</span> <span className="inline-block bg-zinc-700 px-1 rounded">⎋</span> en daarna op <span className="font-bold">Zet op beginscherm</span> <span className="inline-block bg-zinc-700 px-1 rounded">+</span> voor de beste ervaring.
                </p>
                <button 
                  onClick={() => setIsIOS(false)} 
                  className="mt-3 text-xs text-gold-500 font-bold uppercase tracking-wider hover:text-white"
                >
                    Sluiten
                </button>
            </div>
        </div>
      </div>
    );
  }

  // Android/Desktop Install Button
  if (!isVisible) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="fixed bottom-20 right-4 z-[9999] bg-gold-500 text-black px-4 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(255,215,0,0.4)] flex items-center gap-2 animate-in fade-in zoom-in hover:scale-105 transition-transform"
    >
      <Icons.Download size={20} />
      <span>Installeer App</span>
    </button>
  );
};

export default InstallButton;