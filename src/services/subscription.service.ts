import { apiClient } from './api';
import { SUBSCRIPTION_ENDPOINTS } from '../config/api';
import type {
  SubscriptionPlan,
  Subscription,
  CheckoutResponse,
  VerifyPaymentResponse,
} from '../types';

/**
 * Subscription Service
 * Handles all subscription-related API calls using cookie-based authentication
 */
export const subscriptionService = {
  /**
   * Get all available subscription plans
   * @returns Promise<SubscriptionPlan[]> Array of active subscription plans
   */
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await apiClient.get<SubscriptionPlan[]>(
      SUBSCRIPTION_ENDPOINTS.GET_PLANS
    );
    return response.data;
  },

  /**
   * Initiate checkout for a subscription plan
   * @param planId - The ID of the plan to subscribe to
   * @returns Promise<CheckoutResponse> Contains authorization URL and payment reference
   */
  checkout: async (planId: string): Promise<CheckoutResponse> => {
    const response = await apiClient.post<CheckoutResponse>(
      SUBSCRIPTION_ENDPOINTS.CHECKOUT,
      { planId }
    );
    return response.data;
  },

  /**
   * Verify payment after successful Paystack transaction
   * @param reference - Payment reference from Paystack
   * @returns Promise<VerifyPaymentResponse> Verification result with subscription details
   */
  verifyPayment: async (reference: string): Promise<VerifyPaymentResponse> => {
    const response = await apiClient.post<VerifyPaymentResponse>(
      SUBSCRIPTION_ENDPOINTS.VERIFY_PAYMENT,
      { reference }
    );
    return response.data;
  },

  /**
   * Get current user's subscription
   * @returns Promise<Subscription | null> Current subscription or null if none exists
   */
  getMySubscription: async (): Promise<Subscription | null> => {
    try {
      const response = await apiClient.get<Subscription>(
        SUBSCRIPTION_ENDPOINTS.GET_MY_SUBSCRIPTION
      );
      return response.data;
    } catch (error: any) {
      // Return null if user has no subscription (404)
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Cancel current subscription
   * Will cancel at the end of the current billing period
   * @returns Promise<{ message: string }> Success message
   */
  cancelSubscription: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      SUBSCRIPTION_ENDPOINTS.CANCEL_SUBSCRIPTION
    );
    return response.data;
  },
};
