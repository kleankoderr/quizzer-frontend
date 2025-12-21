import React, { useState } from 'react';
import { Modal } from './Modal';
import { FaXTwitter, FaFacebook, FaLinkedin, FaWhatsapp } from 'react-icons/fa6';
import { FiLink, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortCode: string;
  title: string;
  topic?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  shortCode,
  title,
  topic,
}) => {
  const [copied, setCopied] = useState(false);

  // Generate share URL
  const shareUrl = `${globalThis.location.origin}/s/${shortCode}`;
  
  // Full share text with topic if provided
  const shareText = topic ? `${title} - ${topic}` : title;

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!', {
        duration: 3000,
        icon: '🔗',
      });
      
      // Reset copied state after 3 seconds
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error('Failed to copy link. Please try again.');
      console.error('Failed to copy:', error);
    }
  };

  // Share handlers for social platforms
  const handleXShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=550,height=420');
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=550,height=420');
  };

  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=550,height=420');
  };

  const handleWhatsAppShare = () => {
    const message = `${shareText} - ${shareUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Summary">
      <div className="space-y-6">
        {/* Summary info */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
            {title}
          </h4>
          {topic && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{topic}</p>
          )}
        </div>

        {/* Copy Link Section */}
        <div>
          <label htmlFor="share-url-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Share Link
          </label>
          <div className="flex gap-2">
            <input
              id="share-url-input"
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.currentTarget.select()}
            />
            <button
              onClick={handleCopyLink}
              aria-label="Copy link to clipboard"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {copied ? (
                <>
                  <FiCheck className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <FiLink className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Social Share Buttons */}
        <div>
          <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Share on Social Media
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* X (Twitter) */}
            <button
              onClick={handleXShare}
              aria-label="Share on X (formerly Twitter)"
              className="flex flex-col items-center justify-center gap-2 p-4 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors group"
            >
              <FaXTwitter className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">X</span>
            </button>

            {/* Facebook */}
            <button
              onClick={handleFacebookShare}
              aria-label="Share on Facebook"
              className="flex flex-col items-center justify-center gap-2 p-4 bg-[#1877F2] hover:bg-[#0C63D4] text-white rounded-lg transition-colors group"
            >
              <FaFacebook className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">Facebook</span>
            </button>

            {/* LinkedIn */}
            <button
              onClick={handleLinkedInShare}
              aria-label="Share on LinkedIn"
              className="flex flex-col items-center justify-center gap-2 p-4 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-lg transition-colors group"
            >
              <FaLinkedin className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">LinkedIn</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={handleWhatsAppShare}
              aria-label="Share on WhatsApp"
              className="flex flex-col items-center justify-center gap-2 p-4 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-lg transition-colors group"
            >
              <FaWhatsapp className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Helper text */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Share this summary with your friends and study partners
        </p>
      </div>
    </Modal>
  );
};
