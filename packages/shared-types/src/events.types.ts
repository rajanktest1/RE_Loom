// Event names for RabbitMQ
export enum EventName {
  // Supply Chain → Inventory
  MILESTONE_COMPLETED = 'milestone.completed',
  QC_PASSED = 'qc.passed',
  QC_FAILED = 'qc.failed',

  // Inventory events
  UNIT_SOFT_LOCKED = 'unit.soft_locked',
  UNIT_LOCK_EXPIRED = 'unit.lock_expired',
  UNIT_SOLD = 'unit.sold',
  UNIT_STATUS_CHANGED = 'unit.status_changed',

  // CRM events
  BOOKING_CREATED = 'booking.created',
  BOOKING_CANCELLED = 'booking.cancelled',
  PAYMENT_RECEIVED = 'payment.received',
  PAYMENT_OVERDUE = 'payment.overdue',
  LEAD_STAGE_CHANGED = 'lead.stage_changed',
  LEAD_CREATED = 'lead.created',

  // Notification triggers
  SEND_EMAIL = 'notification.send_email',
  SEND_WHATSAPP = 'notification.send_whatsapp',
  SEND_PUSH = 'notification.send_push',
}

export interface IBaseEvent {
  eventName: EventName;
  timestamp: Date;
  correlationId: string;
  source: string;
}

export interface IMilestoneCompletedEvent extends IBaseEvent {
  eventName: EventName.MILESTONE_COMPLETED;
  payload: {
    milestoneId: string;
    projectId: string;
    blockId?: string;
    milestoneName: string;
  };
}

export interface IQCPassedEvent extends IBaseEvent {
  eventName: EventName.QC_PASSED;
  payload: {
    checklistId: string;
    milestoneId: string;
    unitId?: string;
    blockId?: string;
    projectId: string;
  };
}

export interface IUnitSoftLockedEvent extends IBaseEvent {
  eventName: EventName.UNIT_SOFT_LOCKED;
  payload: {
    unitId: string;
    lockedBy: string;
    lockExpiresAt: Date;
    projectId: string;
  };
}

export interface IUnitSoldEvent extends IBaseEvent {
  eventName: EventName.UNIT_SOLD;
  payload: {
    unitId: string;
    buyerId: string;
    bookingId: string;
    projectId: string;
    salePrice: number;
  };
}

export interface IBookingCreatedEvent extends IBaseEvent {
  eventName: EventName.BOOKING_CREATED;
  payload: {
    bookingId: string;
    unitId: string;
    buyerId: string;
    leadId: string;
    totalPrice: number;
  };
}

export interface IPaymentReceivedEvent extends IBaseEvent {
  eventName: EventName.PAYMENT_RECEIVED;
  payload: {
    paymentId: string;
    bookingId: string;
    buyerId: string;
    amount: number;
    installmentNumber: number;
  };
}

export interface ILeadStageChangedEvent extends IBaseEvent {
  eventName: EventName.LEAD_STAGE_CHANGED;
  payload: {
    leadId: string;
    previousStage: string;
    newStage: string;
    leadName: string;
    leadEmail: string;
    leadPhone: string;
  };
}

export type AppEvent =
  | IMilestoneCompletedEvent
  | IQCPassedEvent
  | IUnitSoftLockedEvent
  | IUnitSoldEvent
  | IBookingCreatedEvent
  | IPaymentReceivedEvent
  | ILeadStageChangedEvent;
