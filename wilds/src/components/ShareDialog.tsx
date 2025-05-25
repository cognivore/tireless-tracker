import { useState } from 'react';
import '../styles/ShareDialog.css';

interface ShareDialogProps {
  shareUrl: string;
  onClose: () => void;
}

export default function ShareDialog({ shareUrl, onClose }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      
      // Reset copy status after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="share-overlay">
      <div className="share-dialog">
        <header className="share-header">
          <h2>Share Tracker</h2>
          <button className="share-close-button" onClick={onClose}>×</button>
        </header>
        
        <div className="share-content">
          <p>Share this tracker with others using the link below:</p>
          
          <div className="share-url-container">
            <input
              type="text"
              className="share-url-input"
              value={shareUrl}
              readOnly
              onClick={(e) => e.currentTarget.select()}
            />
            <button 
              className="share-copy-button"
              onClick={handleCopy}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          
          <p className="share-note">
            When someone opens this link, they'll be able to import your tracker with all its data.
          </p>
        </div>
      </div>
    </div>
  );
} 