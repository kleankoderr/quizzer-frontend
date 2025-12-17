import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '../services/subscription.service';
import type { Subscription } from '../types';

/**
 * Query key for subscription data
 */
export const SUBSCRIPTION_QUERY_KEY = ['subscription'];

/**
 * Hook to fetch current user's subscription
 */
export const useSubscription = () => {
  return useQuery<Subscription | null>({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: () => subscriptionService.getMySubscription(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to initiate checkout for a subscription plan
 * Automatically redirects to Paystack on success
 */
export const useCheckout = () => {
  return useMutation({
    mutationFn: (planId: string) => subscriptionService.checkout(planId),
    onSuccess: (data) => {
      // Redirect to Paystack authorization URL
      window.location.href = data.authorizationUrl;
    },
    onError: (error: any) => {
      console.error('Checkout failed:', error);
    },
  });
};

/**
 * Hook to cancel current subscription
 * Automatically refetches subscription data on success
 */
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => subscriptionService.cancelSubscription(),
    onSuccess: () => {
      // Invalidate and refetch subscription data
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
    },
    onError: (error: any) => {
      console.error('Failed to cancel subscription:', error);
    },
  });
};

/**
 * Hook to verify payment after Paystack redirect
 * Automatically refetches subscription data on success
 */
export const useVerifyPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reference: string) =>
      subscriptionService.verifyPayment(reference),
    onSuccess: () => {
      // Invalidate and refetch subscription data
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
    },
    onError: (error: any) => {
      console.error('Payment verification failed:', error);
    },
  });
};
