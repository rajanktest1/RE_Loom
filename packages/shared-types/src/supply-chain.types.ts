export enum VendorCategory {
  CIVIL = 'civil',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  INTERIOR = 'interior',
  MATERIAL_SUPPLIER = 'material_supplier',
  EQUIPMENT_RENTAL = 'equipment_rental',
  LANDSCAPING = 'landscaping',
  OTHER = 'other',
}

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  DISPATCHED = 'dispatched',
  RECEIVED = 'received',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum MilestoneStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DELAYED = 'delayed',
}

export enum QCStatus {
  PENDING = 'pending',
  PASSED = 'passed',
  FAILED = 'failed',
}

export interface IVendor {
  _id: string;
  name: string;
  category: VendorCategory;
  contactPerson: string;
  phone: string;
  email: string;
  gstin?: string;
  address?: string;
  rating: number;
  contracts: IContract[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IContract {
  contractNumber: string;
  startDate: Date;
  endDate: Date;
  value: number;
  description: string;
}

export interface IPurchaseOrder {
  _id: string;
  vendorId: string;
  projectId: string;
  poNumber: string;
  items: IPurchaseOrderItem[];
  totalAmount: number;
  status: PurchaseOrderStatus;
  approvedBy?: string;
  approvedAt?: Date;
  deliveryDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPurchaseOrderItem {
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface IMilestone {
  _id: string;
  projectId: string;
  blockId?: string;
  name: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  status: MilestoneStatus;
  percentage: number;
  dependencies: string[];
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQCChecklist {
  _id: string;
  milestoneId: string;
  unitId?: string;
  blockId?: string;
  inspectorId: string;
  items: IQCItem[];
  overallStatus: QCStatus;
  remarks?: string;
  inspectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQCItem {
  name: string;
  description?: string;
  status: QCStatus;
  remarks?: string;
  photos: string[];
}
