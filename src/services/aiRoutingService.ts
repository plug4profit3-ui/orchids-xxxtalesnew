/**
 * Hybrid AI Routing Service
 * Optimizes AI infrastructure costs by routing requests to the most cost-effective provider
 * 
 * Strategy:
 * - Cheap/Simple tasks → Bittensor (Ridges, Chutes)
 * - Complex/Premium tasks → Venice AI
 * 
 * Context: 1 DIEM ≈ $1/day compute, 112 VVV tokens available
 */

import { supabase } from '../lib/supabase';

export type AIProvider = 'venice' | 'bittensor-ridges' | 'bittensor-chutes';

export type TaskComplexity = 'simple' | 'moderate' | 'complex' | 'premium';

export interface RoutingDecision {
  provider: AIProvider;
  estimatedCost: number; // in credits
  estimatedUsdCost: number;
  routingReason: string;
  priority: 'cheap' | 'balanced' | 'quality';
}

export class AIRoutingService {
  private static instance: AIRoutingService;
  
  // Cost constants (credits per operation)
  private COSTS = {
    chat: {
      simple: { venice: 1, bittensor: 0.7 },
      complex: { venice: 1.5, bittensor: 1.2 }
    },
    image: {
      simple: { venice: 5, bittensor: 3 },
      premium: { venice: 8, bittensor: 6 }
    },
    tts: {
      standard: { venice: 0.5, bittensor: 0.3 },
      premium: { venice: 1, bittensor: 0.7 }
    },
    video: {
      standard: { venice: 12, bittensor: 9 },
      premium: { venice: 15, bittensor: 12 }
    }
  };

  // User tier routing preferences
  private TIER_ROUTING = {
    free: 'cheap',       // Route 80% to Bittensor
    starter: 'balanced', // Route 50/50
    popular: 'balanced', // Route 50/50
    intense: 'quality',  // Route 30/70 Venice
    elite: 'quality',    // Route 20/80 Venice
    vip: 'quality'       // Route 10/90 Venice (premium experience)
  };

  static getInstance(): AIRoutingService {
    if (!AIRoutingService.instance) {
      AIRoutingService.instance = new AIRoutingService();
    }
    return AIRoutingService.instance;
  }

  /**
   * Determine optimal AI provider based on task and user tier
   */
  async routeRequest(
    taskType: 'chat' | 'image' | 'tts' | 'video',
    userId: string,
    complexity: TaskComplexity = 'moderate',
    isPremium: boolean = false
  ): Promise<RoutingDecision> {
    // Get user tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_tier, is_vip')
      .eq('id', userId)
      .single();

    const userTier = profile?.is_vip ? 'vip' : (profile?.user_tier || 'free');
    const routingPriority = this.TIER_ROUTING[userTier as keyof typeof this.TIER_ROUTING] || 'balanced';

    // Determine provider based on routing priority and task
    let provider: AIProvider;
    let routingReason: string;

    switch (routingPriority) {
      case 'cheap':
        // For free tier: prioritize Bittensor for cost savings
        if (taskType === 'chat') {
          provider = Math.random() < 0.8 ? 'bittensor-ridges' : 'venice';
          routingReason = 'Cost-optimized routing for free tier (80/20 split)';
        } else {
          provider = 'bittensor-ridges';
          routingReason = 'Maximum cost savings for free tier user';
        }
        break;

      case 'balanced':
        // For paid tiers: balanced 50/50 split
        if (taskType === 'chat') {
          provider = Math.random() < 0.5 ? 'bittensor-ridges' : 'venice';
          routingReason = 'Balanced cost/quality split for paid tier';
        } else if (complexity === 'complex' || isPremium) {
          provider = 'venice';
          routingReason = 'Complex task routed to Venice for quality';
        } else {
          provider = Math.random() < 0.5 ? 'bittensor-ridges' : 'venice';
          routingReason = 'Balanced routing for standard task';
        }
        break;

      case 'quality':
        // For VIP/elite: prioritize Venice for premium experience
        if (complexity === 'premium' || isPremium || taskType === 'video') {
          provider = 'venice';
          routingReason = 'Premium task routed to Venice for best quality';
        } else {
          provider = Math.random() < 0.3 ? 'bittensor-ridges' : 'venice';
          routingReason = 'Quality-optimized routing (30/70 split)';
        }
        break;

      default:
        provider = 'venice';
        routingReason = 'Default to Venice for reliability';
    }

    // Calculate costs
    const estimatedCost = this.calculateCost(taskType, complexity, isPremium, provider);
    const estimatedUsdCost = estimatedCost * 0.005; // Approx $0.005 per credit

    return {
      provider,
      estimatedCost,
      estimatedUsdCost,
      routingReason,
      priority: routingPriority
    };
  }

  /**
   * Calculate cost for a specific task with a specific provider
   */
  private calculateCost(
    taskType: 'chat' | 'image' | 'tts' | 'video',
    complexity: TaskComplexity,
    isPremium: boolean,
    provider: AIProvider
  ): number {
    const providerKey = provider.startsWith('bittensor') ? 'bittensor' : 'venice';

    switch (taskType) {
      case 'chat':
        return complexity === 'simple' 
          ? this.COSTS.chat.simple[providerKey as keyof typeof this.COSTS.chat.simple]
          : this.COSTS.chat.complex[providerKey as keyof typeof this.COSTS.chat.complex];

      case 'image':
        return isPremium
          ? this.COSTS.image.premium[providerKey as keyof typeof this.COSTS.image.premium]
          : this.COSTS.image.simple[providerKey as keyof typeof this.COSTS.image.simple];

      case 'tts':
        return isPremium
          ? this.COSTS.tts.premium[providerKey as keyof typeof this.COSTS.tts.premium]
          : this.COSTS.tts.standard[providerKey as keyof typeof this.COSTS.tts.standard];

      case 'video':
        return isPremium
          ? this.COSTS.video.premium[providerKey as keyof typeof this.COSTS.video.premium]
          : this.COSTS.video.standard[providerKey as keyof typeof this.COSTS.video.standard];

      default:
        return 1;
    }
  }

  /**
   * Get cost analysis for different user scales
   */
  async getScalingCostAnalysis(userCount: number): Promise<{
    dailyCost: number;
    monthlyCost: number;
    breakdown: Record<string, number>;
    recommendations: string[];
  }> {
    // Get user tier distribution
    const { data: tierDistribution } = await supabase
      .from('profiles')
      .select('user_tier, is_vip, count(*)')
      .group('user_tier', 'is_vip');

    // Estimate daily usage per user tier
    const dailyUsage = {
      free: 5,      // 5 messages/day
      starter: 15,  // 15 messages/day
      popular: 25, // 25 messages/day
      intense: 40,  // 40 messages/day
      elite: 60,    // 60 messages/day
      vip: 80       // 80 messages/day
    };

    // Calculate weighted average cost per message
    let totalDailyCost = 0;
    const breakdown: Record<string, number> = {};

    for (const tier of tierDistribution || []) {
      const tierName = tier.is_vip ? 'vip' : tier.user_tier;
      const tierUsers = (tier.count / 100) * userCount; // Estimate based on distribution
      const dailyMessages = dailyUsage[tierName as keyof typeof dailyUsage] || 5;
      
      // Average cost per message (blended Venice/Bittensor)
      const avgCostPerMessage = tierName === 'free' ? 0.7 : 0.85;
      const tierDailyCost = tierUsers * dailyMessages * avgCostPerMessage * 0.005; // Convert to USD
      
      totalDailyCost += tierDailyCost;
      breakdown[tierName] = tierDailyCost;
    }

    const monthlyCost = totalDailyCost * 30;

    return {
      dailyCost: totalDailyCost,
      monthlyCost,
      breakdown,
      recommendations: [
        `Scale to ${userCount} users: $${monthlyCost.toFixed(2)}/month estimated AI costs`,
        'Implement hybrid routing to save 30-40% on AI costs',
        'Free tier users routed 80% to Bittensor for cost savings',
        'VIP users get premium Venice routing for best experience',
        'Consider rate limiting at 100+ users to prevent cost spikes'
      ]
    };
  }

  /**
   * Log routing decision for analytics
   */
  async logRoutingDecision(
    userId: string,
    taskType: string,
    provider: AIProvider,
    cost: number,
    reason: string
  ): Promise<void> {
    // Fire and forget - don't block on logging
    supabase
      .from('ai_routing_logs')
      .insert({
        user_id: userId,
        task_type: taskType,
        provider,
        cost,
        reason,
        created_at: new Date().toISOString()
      })
      .then(() => {})
      .catch(() => {});
  }
}

export const aiRoutingService = AIRoutingService.getInstance();