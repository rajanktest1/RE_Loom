// ============ ENUMS ============

export enum UnitStatus {
  AVAILABLE = 'available',
  SOFT_LOCKED = 'soft_locked',
  BLOCKED = 'blocked',
  SOLD = 'sold',
  UNDER_MAINTENANCE = 'under_maintenance',
  HANDED_OVER = 'handed_over',
}

export enum UnitType {
  ONE_BHK = '1BHK',
  TWO_BHK = '2BHK',
  THREE_BHK = '3BHK',
  FOUR_BHK = '4BHK',
  VILLA = 'villa',
  PLOT = 'plot',
  PENTHOUSE = 'penthouse',
  STUDIO = 'studio',
}

export enum UnitFacing {
  NORTH = 'north',
  SOUTH = 'south',
  EAST = 'east',
  WEST = 'west',
  NORTH_EAST = 'north_east',
  NORTH_WEST = 'north_west',
  SOUTH_EAST = 'south_east',
  SOUTH_WEST = 'south_west',
  SEA_FACING = 'sea_facing',
  GARDEN_FACING = 'garden_facing',
}

export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
}

export enum PricingRuleType {
  FLOOR_RISE = 'floor_rise',
  VIEW_PREMIUM = 'view_premium',
  DEMAND_FACTOR = 'demand_factor',
  AREA_RATE = 'area_rate',
}

// ============ INTERFACES ============

export interface IProject {
  _id: string;
  name: string;
  location: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    coordinates?: { lat: number; lng: number };
  };
  totalUnits: number;
  reraNumber: string;
  status: ProjectStatus;
  startDate: Date;
  expectedCompletion: Date;
  description?: string;
  amenities?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IBlock {
  _id: string;
  projectId: string;
  name: string;
  totalFloors: number;
  unitsPerFloor: number;
  totalUnits: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUnit {
  _id: string;
  projectId: string;
  blockId: string;
  floor: number;
  unitNumber: string;
  type: UnitType;
  carpetArea: number;
  superBuiltupArea: number;
  facing: UnitFacing;
  status: UnitStatus;
  basePrice: number;
  currentPrice: number;
  lockedBy?: string;
  lockExpiresAt?: Date;
  soldTo?: string;
  bookingId?: string;
  documents: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IPricingRule {
  _id: string;
  projectId: string;
  type: PricingRuleType;
  params: Record<string, number | string | boolean>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
