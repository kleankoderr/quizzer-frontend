import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { motion, useScroll, useSpring } from 'framer-motion';
import {
  Eye,
  Heart,
  Sparkles,
  Lightbulb,
  Bookmark,
  Share2,
  Copy,
  Check,
  ArrowLeft,
  Loader2,
  Calendar,
  ExternalLink,
  ChevronUp,
} from 'lucide-react';
import { FaXTwitter, FaFacebook, FaLinkedin, FaWhatsapp } from 'react-icons/fa6';
import { summaryService, type Summary, type ReactionType } from '../services/summary.service';
import { useAuth } from '../contexts/AuthContext';
import { Toast } from '../utils/toast';



const REACTION_BUTTONS = [
  { type: 'like' as ReactionType, icon: Heart, label: 'Like', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/10' },
  { type: 'love' as ReactionType, icon: Sparkles, label: 'Love', color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/10' },
  { type: 'helpful' as ReactionType, icon: Lightbulb, label: 'Helpful', color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/10' },
  { type: 'bookmark' as ReactionType, icon: Bookmark, label: 'Bookmark', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
];

export function SummaryPage() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!shortCode) {
      setError('No summary code provided');
      setLoading(false);
      return;
    }

    const fetchSummary = async () => {
      try {
        setLoading(true);
        const data = await summaryService.getSummaryByShortCode(shortCode);
        setSummary(data);
        
        if (data.userReactions) {
          setUserReactions(new Set(data.userReactions));
        }

        await summaryService.trackView(shortCode);
      } catch (err) {
        console.error('Error fetching summary:', err);
        setError('Failed to load summary. It may not exist or is not publicly available.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [shortCode]);

  const handleReaction = async (type: ReactionType) => {
    if (!isAuthenticated) {
      Toast.info('Sign up to react to summaries!');
      return;
    }

    if (!shortCode || !summary) return;

    const isActive = userReactions.has(type);
    const newReactions = new Set(userReactions);
    const newSummary = { ...summary };

    if (isActive) {
      newReactions.delete(type);
      newSummary.reactionCounts[type] = Math.max(0, summary.reactionCounts[type] - 1);
    } else {
      newReactions.add(type);
      newSummary.reactionCounts[type] = summary.reactionCounts[type] + 1;
    }

    setUserReactions(newReactions);
    setSummary(newSummary);

    try {
      if (isActive) {
        await summaryService.removeReaction(shortCode, type);
      } else {
        await summaryService.addReaction(shortCode, type);
      }
    } catch (err) {
      const previousReactions = new Set(summary.userReactions || []);
      setUserReactions(previousReactions);
      setSummary({ ...summary });
      Toast.error('Failed to update reaction');
      console.error('Reaction error:', err);
    }
  };

  const copyLink = async () => {
    const url = globalThis.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      Toast.success('Link copied to clipboard!');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      Toast.error('Failed to copy link');
      console.error('Copy error:', err);
    }
  };

  const shareToSocial = (platform: string) => {
    if (!summary) return;
    const url = encodeURIComponent(globalThis.location.href);
    const text = encodeURIComponent(`Check out this summary of "${summary.studyMaterial.title}" on Quizzer! 🎯`);
    
    const shareUrls: Record<string, string> = {
      x: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'noopener,noreferrer');
    }
  };

  const getExcerpt = (content: string, maxLength = 150): string => {
    const plainText = content.replaceAll(/[#*`[\]()]/g, '').trim();
    return plainText.length > maxLength
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="mb-4"
        >
          <Loader2 className="w-12 h-12 text-primary-600" />
        </motion.div>
        <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">
          Crafting your summary...
        </p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Eye className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Summary Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            {error || 'The summary you are looking for does not exist or is no longer publicly available.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full px-6 py-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-semibold shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const creator = summary.studyMaterial.user;
  const initials = creator.name.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans selection:bg-primary-100 dark:selection:bg-primary-900/30">
      <title>{summary.studyMaterial.title} - Summary | Quizzer</title>
      <meta name="description" content={getExcerpt(summary.content)} />
      <meta property="og:title" content={`${summary.studyMaterial.title} - Summary | Quizzer`} />
      <meta property="og:description" content={getExcerpt(summary.content)} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={globalThis.location.href} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${summary.studyMaterial.title} - Summary | Quizzer`} />
      <meta name="twitter:description" content={getExcerpt(summary.content)} />

      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1.5 bg-primary-600 origin-left z-[60]"
        style={{ scaleX }}
      />

      {/* Header - Glassmorphism */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-6">
              <button
                onClick={() => {
                  if (isAuthenticated && summary?.studyMaterial?.id) {
                    navigate(`/content/${summary.studyMaterial.id}`);
                  } else {
                    navigate('/');
                  }
                }}
                className="flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all font-medium group text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Back</span>
              </button>
              
              <div className="flex items-center">
                <span className="font-bold text-lg hidden md:block tracking-tight text-primary-600">Quizzer</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowShareModal(!showShareModal)}
                className={`
                  flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all
                  ${showShareModal 
                    ? 'bg-primary-600 text-white shadow-lg' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                  }
                `}
              >
                <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">{showShareModal ? 'Close' : 'Share'}</span>
              </button>

              {!isAuthenticated && (
                <button
                  onClick={() => navigate('/signup')}
                  className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all font-semibold text-xs sm:text-sm shadow-md shadow-primary-500/20"
                >
                  <span className="hidden sm:inline">Take A Quiz</span>
                  <span className="sm:hidden">Get Started</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Article Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
            <span className="px-2.5 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg text-[10px] sm:text-xs font-bold tracking-wider uppercase border border-primary-100 dark:border-primary-800">
              Comprehensive Summary
            </span>
            <span className="text-gray-400 dark:text-gray-500">•</span>
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{new Date(summary.generatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
            {summary.studyMaterial.title.replaceAll('`', '')}
          </h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              {creator.avatar ? (
                <img src={creator.avatar} alt={creator.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-primary-500 shadow-md" />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs sm:text-base font-bold shadow-lg">
                  {initials}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white leading-none mb-1.5">Created by {creator.name}</p>
                <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {summary.viewCount.toLocaleString()} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {Object.values(summary.reactionCounts).reduce((a, b) => a + b, 0)} reactions
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Share Section - Top Expandable */}
        <motion.div
           initial={false}
           animate={{ height: showShareModal ? 'auto' : 0, opacity: showShareModal ? 1 : 0 }}
           className="overflow-hidden mb-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl"
        >
          <div className="p-6 sm:p-8">
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-primary-500" />
              Share this summary
            </h3>
            
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Social Networks</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <button onClick={() => shareToSocial('x')} className="flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-xl hover:opacity-90 transition-all font-semibold shadow-lg shadow-black/10">
                    <FaXTwitter className="w-4 h-4" />
                    <span className="text-sm">X</span>
                  </button>
                  <button onClick={() => shareToSocial('whatsapp')} className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white rounded-xl hover:opacity-90 transition-all font-semibold shadow-lg shadow-green-500/10">
                    <FaWhatsapp className="w-5 h-5" />
                    <span className="text-sm">WA</span>
                  </button>
                  <button onClick={() => shareToSocial('facebook')} className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1877F2] text-white rounded-xl hover:opacity-90 transition-all font-semibold shadow-lg shadow-blue-500/10">
                    <FaFacebook className="w-5 h-5" />
                    <span className="text-sm">FB</span>
                  </button>
                  <button onClick={() => shareToSocial('linkedin')} className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0A66C2] text-white rounded-xl hover:opacity-90 transition-all font-semibold shadow-lg shadow-blue-700/10">
                    <FaLinkedin className="w-5 h-5" />
                    <span className="text-sm">IN</span>
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Direct Link</p>
                <div className="flex flex-col sm:flex-row gap-2 relative group">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      value={globalThis.location.href} 
                      readOnly 
                      className="w-full pl-4 pr-12 sm:pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all shadow-inner font-mono" 
                    />
                    <button 
                      onClick={copyLink} 
                      className="absolute right-2 top-1/2 -translate-y-1/2 sm:hidden p-2 text-primary-600"
                    >
                      {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <button 
                    onClick={copyLink} 
                    className="hidden sm:flex items-center gap-2 px-6 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-bold text-sm whitespace-nowrap"
                  >
                    {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{linkCopied ? 'Copied' : 'Copy Link'}</span>
                  </button>
                  <button 
                    onClick={copyLink} 
                    className="sm:hidden w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm"
                  >
                    {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{linkCopied ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Summary Content Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-gray-700 overflow-hidden relative"
        >
          <div className="p-6 sm:p-12">
            <div className="prose prose-sm sm:prose-lg prose-gray dark:prose-invert max-w-none 
              prose-headings:font-extrabold prose-headings:tracking-tight
              prose-h1:text-2xl sm:prose-h1:text-3xl prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-8 sm:prose-h2:mt-12 prose-h2:mb-4 sm:prose-h2:mb-6
              prose-p:leading-relaxed prose-p:text-gray-600 dark:prose-p:text-gray-300
              prose-li:text-gray-600 dark:prose-li:text-gray-300
              prose-strong:text-gray-900 dark:prose-strong:text-white
              prose-blockquote:border-l-4 prose-blockquote:border-primary-500 prose-blockquote:bg-primary-50/50 dark:prose-blockquote:bg-primary-900/10 prose-blockquote:px-6 prose-blockquote:py-2 prose-blockquote:rounded-r-xl prose-blockquote:font-medium prose-blockquote:italic
              prose-img:rounded-2xl prose-img:shadow-xl
              prose-hr:border-gray-200 dark:prose-hr:border-gray-700"
            >
              <MarkdownRenderer content={summary.content} />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 px-4 sm:px-12 py-6 sm:py-8 flex items-center justify-center">
            <div className="grid grid-cols-2 xs:flex xs:flex-wrap items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">
              {REACTION_BUTTONS.map(({ type, icon: Icon, label, color, bg }) => {
                const isActive = userReactions.has(type);
                const count = summary.reactionCounts[type] || 0;
                
                return (
                  <button
                    key={type}
                    onClick={() => handleReaction(type)}
                    disabled={!isAuthenticated}
                    className={`
                      relative group flex items-center justify-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-full border transition-all duration-300
                      ${isActive 
                        ? `border-primary-500 ${bg} sm:scale-105 shadow-sm` 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                      }
                      ${isAuthenticated ? 'hover:-translate-y-1 active:scale-95' : 'cursor-not-allowed opacity-60'}
                    `}
                  >
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isActive ? color : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                    <span className={`text-xs sm:text-sm font-bold ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      {count > 0 ? count : label.replaceAll('`', '')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* CTA for Non-Authenticated Users */}
        {!isAuthenticated && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mt-12 sm:mt-16 bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl sm:rounded-[2.5rem] shadow-2xl shadow-primary-500/20 p-6 sm:p-12 text-center text-white relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl group-hover:bg-white/15 transition-colors duration-700" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-400/20 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-bold mb-8 border border-white/20 text-white">
                <span>Join 10,000+ students on Quizzer</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black mb-6 leading-tight">
                Unlock higher grades <br className="hidden sm:block" /> with smarter study tools
              </h2>
              <p className="text-lg text-primary-100 mb-10 font-medium leading-relaxed opacity-90">
                Transform any document into structured notes, interactive quizzes, and flashcards in seconds. It's time to study smarter, not harder.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 bg-white text-primary-700 rounded-2xl hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all font-extrabold shadow-xl shadow-black/10"
                >
                  Create Free Account
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-4 bg-primary-500/30 text-white rounded-2xl hover:bg-primary-500/50 transition-all font-extrabold backdrop-blur-md border border-white/20"
                >
                  Sign In
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 py-12 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6 opacity-40">
            <span className="font-black text-gray-900 dark:text-white tracking-tighter text-xl italic uppercase font-sans">Quizzer</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            © {new Date().getFullYear()} Quizzer. Master your material, save your time.
          </p>
        </div>
      </footer>

      {/* Back to Top */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: showScrollTop ? 1 : 0 }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 p-3 sm:p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl sm:rounded-2xl shadow-2xl hover:-translate-y-1 transition-all z-40 group"
      >
        <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
      </motion.button>
    </div>
  );
}
