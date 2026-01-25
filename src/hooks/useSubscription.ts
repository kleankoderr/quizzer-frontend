import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '../services/subscription.service';
import type { Subscription, CurrentPlan } from '../types';

/**
 * Query key for subscription data
 */
export const SUBSCRIPTION_QUERY_KEY = ['subscription'];

/**
 * Query key for current plan data
 */
export const CURRENT_PLAN_QUERY_KEY = ['currentPlan'];

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
 * Hook to fetch current user's plan with all quota information
 * Creates a free tier plan if user has no subscription
 */
export const useCurrentPlan = () => {
  return useQuery<CurrentPlan>({
    queryKey: CURRENT_PLAN_QUERY_KEY,
    queryFn: () => subscriptionService.getCurrentPlan(),
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter because quota changes frequently)
    refetchOnWindowFocus: true,
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
      globalThis.location.href = data.authorizationUrl;
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
      // Invalidate and refetch subscription and current plan data
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CURRENT_PLAN_QUERY_KEY });
    },
  });
};

/**
 * Hook to verify payment after Paystack redirect
 * Automatically refetches subscription, current plan, and quota data on success
 */
export const useVerifyPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reference: string) =>
      subscriptionService.verifyPayment(reference),
    onSuccess: () => {
      // Invalidate and refetch all subscription and quota related data
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CURRENT_PLAN_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['quota'] }); // Also invalidate quota to update UI
    },
  });
};

/**
 * Hook to schedule a plan downgrade
 * Automatically refetches subscription data on success
 */
export const useScheduleDowngrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) =>
      subscriptionService.scheduleDowngrade(planId),
    onSuccess: () => {
      // Invalidate and refetch subscription and current plan data
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CURRENT_PLAN_QUERY_KEY });
    },
  });
};
