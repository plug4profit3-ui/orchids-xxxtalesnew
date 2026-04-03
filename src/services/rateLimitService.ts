/**
 * Rate Limiting Service
 * Prevents cost explosions and ensures fair usage during scaling
 */

import { supabase } from '../lib/supabase';

export interface RateLimitCheck {
  allowed: boolean;
  currentCount: number;
  limit: number;
  resetAt: string;
  message: string;
}

export class RateLimitService {
  private static instance: RateLimitService;
  
  static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService();
    }
    return RateLimitService.instance;
  }

  /**
   * Check if user is allowed to make a request
   */
  async checkRateLimit(
    userId: string,
    resourceType: 'chat' | 'image' | 'video' | 'tts' | 'api',
    creditsToConsume: number = 1
  ): Promise<RateLimitCheck> {
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_user_id: userId,
        p_resource_type: resourceType,
        p_credits_to_consume: creditsToConsume
      });

      if (error) {
        console.warn('Rate limit check failed:', error.message);
        // On error, allow but warn
        return {
          allowed: true,
          currentCount: 0,
          limit: 999999,
          resetAt: new Date(Date.now() + 3600000).toISOString(),
          message: 'Error in rate limiting - request allowed'
        };
      }

      if (data && data.length > 0) {
        const result = data[0];
        return {
          allowed: result.allowed,
          currentCount: result.current_count,
          limit: result.limit,
          resetAt: result.reset_at,
          message: result.message
        };
      }

      // Default allow if no data
      return {
        allowed: true,
        currentCount: 0,
        limit: 999999,
        resetAt: new Date(Date.now() + 3600000).toISOString(),
        message: 'Request allowed'
      };
    } catch (error) {
      console.warn('Rate limit check failed:', error);
      // On error, allow but warn
      return {
        allowed: true,
        currentCount: 0,
        limit: 999999,
        resetAt: new Date(Date.now() + 3600000).toISOString(),
        message: 'Error in rate limiting - request allowed'
      };
    }
  }

  /**
   * Increment rate limit counter after successful request
   */
  async incrementRateLimit(
    userId: string,
    resourceType: 'chat' | 'image' | 'video' | 'tts' | 'api',
    creditsConsumed: number = 1
  ): Promise<void> {
    try {
      await supabase.rpc('increment_rate_limit', {
        p_user_id: userId,
        p_resource_type: resourceType,
        p_credits_consumed: creditsConsumed
      });
    } catch (error) {
      // Silently fail - don't block on rate limit logging
      console.warn('Failed to increment rate limit:', error);
    }
  }

  /**
   * Get user's current rate limit status
   */
  async getUserRateLimitStatus(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('user_id', userId)
        .order('window_start', { ascending: false })
        .limit(10);

      if (error) {
        console.warn('Failed to get rate limit status:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Failed to get rate limit status:', error);
      return null;
    }
  }

  /**
   * Get recent rate limit violations
   */
  async getRecentViolations(userId: string, limit: number = 10): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('rate_limit_violations')
        .select('*')
        .eq('user_id', userId)
        .order('attempted_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Failed to get rate limit violations:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.warn('Failed to get rate limit violations:', error);
      return [];
    }
  }
}

export const rateLimitService = RateLimitService.getInstance();