import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { subscriptionService } from '../services/subscription.service';
import { LoadingScreen } from '../components/LoadingScreen';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export const VerifyPaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference = searchParams.get('reference');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Verifying your payment...');

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      if (!reference) {
        setStatus('error');
        setMessage('No payment reference found.');
        return;
      }

      try {
        await subscriptionService.verifyPayment(reference);
        
        if (mounted) {
          setStatus('success');
          setMessage('Payment verified successfully! Redirecting...');
          toast.success('Subscription activated successfully!');
          
          // Redirect after a short delay to let user see success message
          setTimeout(() => {
            navigate('/dashboard'); // or /start-planning if onboarding flow
          }, 2000);
        }
      } catch (error: any) {
        console.error('Payment verification failed:', error);
        if (mounted) {
          setStatus('error');
          setMessage(
            error.response?.data?.message || 
            'Failed to verify payment. Please contact support if you were charged.'
          );
          toast.error('Payment verification failed');
        }
      }
    };

    verify();

    return () => {
      mounted = false;
    };
  }, [reference, navigate]);

  if (status === 'loading') {
    return (
      <LoadingScreen 
        message="Verifying Payment" 
        subMessage="Please wait while we confirm your transaction..." 
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 text-center">
          {status === 'success' ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-8">{message}</p>
              <div className="w-full bg-gray-100 rounded-lg p-4 animate-pulse">
                <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                <XCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
              <p className="text-gray-600 mb-8">{message}</p>
              
              <div className="space-y-3 w-full">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-primary/90 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Return to Pricing
                </button>
                
                <button
                  onClick={() => window.open('mailto:support@quizzer.com', '_blank')}
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors pt-4"
                >
                  Contact Support
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
