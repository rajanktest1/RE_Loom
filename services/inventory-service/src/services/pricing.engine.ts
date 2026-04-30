import { PricingRule } from '../models/pricing-rule.model';
import { IUnitDocument } from '../models/unit.model';

export interface PricingBreakdown {
  baseAmount: number;
  floorRise: number;
  viewPremium: number;
  demandFactor: number;
  timeBased: number;
  bulkDiscount: number;
  totalPrice: number;
  applicableRules: string[];
}

/**
 * Dynamic Pricing Engine
 * Calculates unit price based on active pricing rules for a project.
 * Rule types:
 *   - area_rate: basePrice = ratePerSqft * superBuiltupArea
 *   - floor_rise: add amountPerFloor * (floor - startFloor)
 *   - view_premium: add premium based on facing direction
 *   - demand_factor: multiply by multiplier (e.g., 1.05 = 5% increase)
 *   - time_based: add/subtract amount if within validity window
 *   - bulk_discount: subtract flat amount (for multi-unit buyers)
 */
interface PricingRuleDoc {
  projectId: string;
  type: string;
  params: Record<string, any>;
  priority: number;
  isActive: boolean;
  validFrom?: Date;
  validTo?: Date;
}

export class PricingEngine {
  private rules: PricingRuleDoc[] = [];

  async loadRules(projectId: string): Promise<void> {
    const docs = await PricingRule.find({
      projectId,
      isActive: true,
      $or: [
        { validFrom: { $exists: false } },
        { validFrom: null },
        { validFrom: { $lte: new Date() } },
      ],
    }).sort({ priority: -1 }).lean();
    this.rules = docs as unknown as PricingRuleDoc[];

    // Filter out expired rules
    const now = new Date();
    this.rules = this.rules.filter((rule) => {
      if (rule.validTo && new Date(rule.validTo) < now) return false;
      return true;
    });
  }

  calculatePrice(unit: {
    superBuiltupArea: number;
    floor: number;
    facing: string;
    basePrice: number;
  }): PricingBreakdown {
    const breakdown: PricingBreakdown = {
      baseAmount: 0,
      floorRise: 0,
      viewPremium: 0,
      demandFactor: 0,
      timeBased: 0,
      bulkDiscount: 0,
      totalPrice: 0,
      applicableRules: [],
    };

    // Area rate
    const areaRule = this.rules.find((r) => r.type === 'area_rate');
    if (areaRule) {
      const { ratePerSqft } = areaRule.params;
      breakdown.baseAmount = ratePerSqft * unit.superBuiltupArea;
      breakdown.applicableRules.push(`area_rate: ₹${ratePerSqft}/sqft × ${unit.superBuiltupArea} sqft`);
    } else {
      breakdown.baseAmount = unit.basePrice;
    }

    // Floor rise
    const floorRule = this.rules.find((r) => r.type === 'floor_rise');
    if (floorRule) {
      const { amountPerFloor, startFloor = 1 } = floorRule.params;
      const floorsAbove = Math.max(0, unit.floor - startFloor);
      breakdown.floorRise = amountPerFloor * floorsAbove;
      breakdown.applicableRules.push(`floor_rise: ₹${amountPerFloor} × ${floorsAbove} floors`);
    }

    // View premium
    const viewRule = this.rules.find((r) => r.type === 'view_premium');
    if (viewRule) {
      const premium = viewRule.params[unit.facing] || 0;
      breakdown.viewPremium = premium;
      if (premium > 0) {
        breakdown.applicableRules.push(`view_premium: ₹${premium} (${unit.facing})`);
      }
    }

    // Calculate subtotal before multiplicative factors
    let subtotal = breakdown.baseAmount + breakdown.floorRise + breakdown.viewPremium;

    // Demand factor (multiplicative)
    const demandRule = this.rules.find((r) => r.type === 'demand_factor');
    if (demandRule) {
      const { multiplier } = demandRule.params;
      breakdown.demandFactor = Math.round(subtotal * (multiplier - 1));
      subtotal += breakdown.demandFactor;
      breakdown.applicableRules.push(`demand_factor: ×${multiplier} (${demandRule.params.reason || ''})`);
    }

    // Time-based adjustment (promotional pricing)
    const timeRule = this.rules.find((r) => r.type === 'time_based');
    if (timeRule) {
      const { adjustmentAmount, adjustmentType } = timeRule.params;
      if (adjustmentType === 'discount') {
        breakdown.timeBased = -Math.abs(adjustmentAmount);
      } else {
        breakdown.timeBased = adjustmentAmount;
      }
      subtotal += breakdown.timeBased;
      breakdown.applicableRules.push(`time_based: ${breakdown.timeBased > 0 ? '+' : ''}₹${breakdown.timeBased}`);
    }

    // Bulk discount
    const bulkRule = this.rules.find((r) => r.type === 'bulk_discount');
    if (bulkRule) {
      breakdown.bulkDiscount = -Math.abs(bulkRule.params.discountAmount || 0);
      subtotal += breakdown.bulkDiscount;
      breakdown.applicableRules.push(`bulk_discount: -₹${Math.abs(breakdown.bulkDiscount)}`);
    }

    breakdown.totalPrice = Math.round(subtotal);
    return breakdown;
  }

  /**
   * Recalculate current price for a single unit
   */
  async recalculateUnitPrice(unit: IUnitDocument): Promise<{ newPrice: number; breakdown: PricingBreakdown }> {
    await this.loadRules(unit.projectId);
    const breakdown = this.calculatePrice({
      superBuiltupArea: unit.superBuiltupArea,
      floor: unit.floor,
      facing: unit.facing,
      basePrice: unit.basePrice,
    });
    return { newPrice: breakdown.totalPrice, breakdown };
  }

  /**
   * Batch recalculate prices for all units in a project
   */
  async recalculateProjectPrices(projectId: string, units: IUnitDocument[]): Promise<{
    updated: number;
    breakdown: Record<string, PricingBreakdown>;
  }> {
    await this.loadRules(projectId);
    const result: Record<string, PricingBreakdown> = {};
    let updated = 0;

    for (const unit of units) {
      const breakdown = this.calculatePrice({
        superBuiltupArea: unit.superBuiltupArea,
        floor: unit.floor,
        facing: unit.facing,
        basePrice: unit.basePrice,
      });

      if (breakdown.totalPrice !== unit.currentPrice) {
        unit.currentPrice = breakdown.totalPrice;
        await unit.save();
        updated++;
      }
      result[unit._id.toString()] = breakdown;
    }

    return { updated, breakdown: result };
  }
}

export const pricingEngine = new PricingEngine();
