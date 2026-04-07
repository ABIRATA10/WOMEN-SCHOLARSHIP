import React, { useState, useEffect } from 'react';
import { Download, X, Share, MonitorSmartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptInstall: any;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose, promptInstall }) => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setTimeout(() => setShowInstructions(false), 300);
    }
  }, [isOpen]);

  const handleInstall = async (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault();
    if (!promptInstall) {
      setShowInstructions(true);
      return;
    }
    promptInstall.prompt();
    const choiceResult = await promptInstall.userChoice;
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsInstalled(true);
      onClose();
    } else {
      console.log('User dismissed the install prompt');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative text-center"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MonitorSmartphone size={32} />
          </div>
          
          <h3 className="text-2xl font-black text-slate-900 mb-3">Download MeritUs App</h3>
          <p className="text-slate-500 font-medium mb-8">
            Install our app on your device for a faster, native-like experience. Access scholarships anytime, anywhere!
          </p>
          
          {isInstalled ? (
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl font-bold mb-4">
              App is already installed on your device!
            </div>
          ) : showInstructions ? (
            <div className="p-5 bg-blue-50 text-blue-800 rounded-2xl text-sm text-left border border-blue-100">
              <p className="font-bold mb-2">How to install manually:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>iOS (Safari):</strong> Tap the <Share size={14} className="inline" /> Share button at the bottom, then select <strong>"Add to Home Screen"</strong>.</li>
                <li><strong>Android (Chrome):</strong> Tap the menu (⋮) and select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                <li><strong>Desktop:</strong> Click the install icon (🖥️/⬇️) in the right side of the address bar.</li>
              </ul>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={handleInstall}
                className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
              >
                <Download size={18} /> Install App Now
              </button>
              {!promptInstall && (
                <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1">
                  <Share size={12} /> Use browser options to "Add to Home Screen"
                </p>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
