export enum LeadSource {
  SOCIAL_MEDIA = 'social_media',
  WALK_IN = 'walk_in',
  BROKER = 'broker',
  REFERRAL = 'referral',
  WEBSITE = 'website',
  PHONE_INQUIRY = 'phone_inquiry',
  EMAIL_CAMPAIGN = 'email_campaign',
}

export enum LeadStage {
  NEW = 'new',
  CONTACTED = 'contacted',
  SITE_VISIT = 'site_visit',
  NEGOTIATION = 'negotiation',
  BOOKED = 'booked',
  LOST = 'lost',
}

export enum BookingStatus {
  BOOKED = 'booked',
  AGREEMENT_SIGNED = 'agreement_signed',
  REGISTERED = 'registered',
  CANCELLED = 'cancelled',
}

export enum PaymentPlanType {
  CONSTRUCTION_LINKED = 'construction_linked',
  TIME_LINKED = 'time_linked',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CHEQUE = 'cheque',
  UPI = 'upi',
  CASH = 'cash',
}

export interface ILead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  assignedTo?: string;
  stage: LeadStage;
  notes: Array<{ content: string; createdAt: Date; createdBy: string }>;
  projectInterest: string[];
  unitInterest: string[];
  budget?: { min: number; max: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface IFollowUp {
  _id: string;
  leadId: string;
  scheduledAt: Date;
  type: 'call' | 'email' | 'whatsapp' | 'meeting';
  notes?: string;
  completedAt?: Date;
  outcome?: string;
  createdBy: string;
}

export interface IBooking {
  _id: string;
  leadId: string;
  unitId: string;
  buyerId: string;
  agreementNumber: string;
  bookingDate: Date;
  totalPrice: number;
  discount?: number;
  paymentPlan: PaymentPlanType;
  installments: IInstallment[];
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInstallment {
  installmentNumber: number;
  description: string;
  amount: number;
  dueDate: Date;
  percentage: number;
}

export interface IPayment {
  _id: string;
  bookingId: string;
  installmentNumber: number;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  method?: PaymentMethod;
  transactionId?: string;
  receiptUrl?: string;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}
