import mongoose, { Schema, Document } from 'mongoose';

export interface IPricingRule {
  _id?: string;
  projectId: string;
  type: 'floor_rise' | 'view_premium' | 'demand_factor' | 'area_rate' | 'time_based' | 'bulk_discount';
  params: Record<string, any>;
  priority: number;
  isActive: boolean;
  validFrom?: Date;
  validTo?: Date;
  createdBy?: string;
}

export interface IPricingRuleDocument extends Omit<IPricingRule, '_id'>, Document {}

const PricingRuleSchema = new Schema<IPricingRuleDocument>(
  {
    projectId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['floor_rise', 'view_premium', 'demand_factor', 'area_rate', 'time_based', 'bulk_discount'],
      required: true,
    },
    params: { type: Schema.Types.Mixed, required: true },
    priority: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    validFrom: Date,
    validTo: Date,
    createdBy: String,
  },
  { timestamps: true }
);

PricingRuleSchema.index({ projectId: 1, isActive: 1 });

export const PricingRule = mongoose.model<IPricingRuleDocument>('PricingRule', PricingRuleSchema);
