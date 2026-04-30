import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const MONGO_URI = process.env.MONGO_CRM_URI || 'mongodb://localhost:27017/realestate_crm';

async function seed() {
  const conn = await mongoose.connect(MONGO_URI);
  console.log('Connected to CRM DB');

  await conn.connection.db!.dropDatabase();
  console.log('Cleared CRM DB');

  // --- Leads ---
  const LeadSchema = new mongoose.Schema({
    name: String, email: String, phone: String, source: String,
    assignedTo: String, stage: String, notes: [Object],
    projectInterest: [String], unitInterest: [String], budget: Object,
  }, { timestamps: true });
  const Lead = mongoose.model('Lead', LeadSchema);

  const leads = await Lead.insertMany([
    {
      name: 'Arun Krishnamurthy',
      email: 'arun.k@gmail.com',
      phone: '+91 9900000001',
      source: 'website',
      assignedTo: 'Amit Patel',
      stage: 'negotiation',
      notes: [
        { content: 'Interested in 3BHK sea-facing', createdAt: new Date('2025-01-15'), createdBy: 'Amit Patel' },
        { content: 'Site visit done - loved the view from floor 12', createdAt: new Date('2025-01-20'), createdBy: 'Amit Patel' },
        { content: 'Discussing price - asking for 5% discount', createdAt: new Date('2025-02-01'), createdBy: 'Amit Patel' },
      ],
      projectInterest: ['Sunrise Heights'],
      unitInterest: ['A-1203', 'A-1204'],
      budget: { min: 20000000, max: 28000000 },
    },
    {
      name: 'Megha Bansal',
      email: 'megha.bansal@outlook.com',
      phone: '+91 9900000002',
      source: 'social_media',
      assignedTo: 'Sneha Reddy',
      stage: 'site_visit',
      notes: [
        { content: 'Came through Instagram ad', createdAt: new Date('2025-03-10'), createdBy: 'System' },
        { content: 'Called - interested in 2BHK for investment', createdAt: new Date('2025-03-12'), createdBy: 'Sneha Reddy' },
      ],
      projectInterest: ['Sunrise Heights'],
      unitInterest: [],
      budget: { min: 15000000, max: 20000000 },
    },
    {
      name: 'Prakash Hegde',
      email: 'prakash.h@yahoo.com',
      phone: '+91 9900000003',
      source: 'broker',
      assignedTo: 'Amit Patel',
      stage: 'booked',
      notes: [
        { content: 'Referred by broker Ramesh (Star Properties)', createdAt: new Date('2024-11-05'), createdBy: 'System' },
        { content: 'Booked unit A-0501', createdAt: new Date('2024-12-01'), createdBy: 'Amit Patel' },
      ],
      projectInterest: ['Sunrise Heights'],
      unitInterest: ['A-0501'],
      budget: { min: 16000000, max: 22000000 },
    },
    {
      name: 'Nisha Agarwal',
      email: 'nisha.a@gmail.com',
      phone: '+91 9900000004',
      source: 'walk_in',
      assignedTo: 'Sneha Reddy',
      stage: 'contacted',
      notes: [
        { content: 'Walked in during exhibition at Jio Convention Centre', createdAt: new Date('2025-04-01'), createdBy: 'Sneha Reddy' },
      ],
      projectInterest: ['Sunrise Heights', 'Green Valley Villas'],
      unitInterest: [],
      budget: { min: 25000000, max: 45000000 },
    },
    {
      name: 'Sanjay Mittal',
      email: 'sanjay.m@mittalgroup.com',
      phone: '+91 9900000005',
      source: 'referral',
      assignedTo: 'Amit Patel',
      stage: 'new',
      notes: [
        { content: 'Referred by existing buyer Prakash Hegde', createdAt: new Date('2025-04-20'), createdBy: 'System' },
      ],
      projectInterest: ['Sunrise Heights'],
      unitInterest: [],
      budget: { min: 30000000, max: 50000000 },
    },
    {
      name: 'Kavita Sundaram',
      email: 'kavita.s@techcorp.in',
      phone: '+91 9900000006',
      source: 'email_campaign',
      assignedTo: 'Sneha Reddy',
      stage: 'lost',
      notes: [
        { content: 'Responded to Diwali email campaign', createdAt: new Date('2024-10-25'), createdBy: 'System' },
        { content: 'Budget too low for available units', createdAt: new Date('2024-11-10'), createdBy: 'Sneha Reddy' },
        { content: 'Lost - bought elsewhere', createdAt: new Date('2024-12-15'), createdBy: 'Sneha Reddy' },
      ],
      projectInterest: ['Sunrise Heights'],
      unitInterest: [],
      budget: { min: 8000000, max: 12000000 },
    },
    {
      name: 'Rajeev Malhotra',
      email: 'rajeev.m@gmail.com',
      phone: '+91 9900000007',
      source: 'phone_inquiry',
      assignedTo: 'Amit Patel',
      stage: 'site_visit',
      notes: [
        { content: 'Called enquiring about penthouse', createdAt: new Date('2025-04-10'), createdBy: 'Amit Patel' },
        { content: 'Site visit scheduled for April 25', createdAt: new Date('2025-04-15'), createdBy: 'Amit Patel' },
      ],
      projectInterest: ['Sunrise Heights'],
      unitInterest: ['A-2001', 'A-2004'],
      budget: { min: 40000000, max: 60000000 },
    },
  ]);
  console.log(`Seeded ${leads.length} leads`);

  // --- Bookings ---
  const BookingSchema = new mongoose.Schema({
    leadId: String, unitId: String, buyerId: String, agreementNumber: String,
    bookingDate: Date, totalPrice: Number, discount: Number,
    paymentPlan: String, installments: [Object], status: String,
  }, { timestamps: true });
  const Booking = mongoose.model('Booking', BookingSchema);

  const bookings = await Booking.insertMany([
    {
      leadId: leads[2]._id.toString(), // Prakash Hegde
      unitId: 'unit-A-0501-placeholder',
      buyerId: 'buyer-prakash-placeholder',
      agreementNumber: 'AGR-2024-0001',
      bookingDate: new Date('2024-12-01'),
      totalPrice: 18500000,
      discount: 500000,
      paymentPlan: 'construction_linked',
      installments: [
        { installmentNumber: 1, description: 'Booking Amount (10%)', amount: 1850000, dueDate: new Date('2024-12-01'), percentage: 10 },
        { installmentNumber: 2, description: 'On Agreement (15%)', amount: 2775000, dueDate: new Date('2025-01-15'), percentage: 15 },
        { installmentNumber: 3, description: 'Foundation Complete (10%)', amount: 1850000, dueDate: new Date('2025-03-31'), percentage: 10 },
        { installmentNumber: 4, description: 'Plinth Complete (10%)', amount: 1850000, dueDate: new Date('2025-06-30'), percentage: 10 },
        { installmentNumber: 5, description: 'Structure Complete (15%)', amount: 2775000, dueDate: new Date('2025-12-31'), percentage: 15 },
        { installmentNumber: 6, description: 'Brick/Plaster Work (10%)', amount: 1850000, dueDate: new Date('2026-06-30'), percentage: 10 },
        { installmentNumber: 7, description: 'Flooring/Painting (10%)', amount: 1850000, dueDate: new Date('2026-09-30'), percentage: 10 },
        { installmentNumber: 8, description: 'On Possession (20%)', amount: 3700000, dueDate: new Date('2027-03-31'), percentage: 20 },
      ],
      status: 'agreement_signed',
    },
  ]);
  console.log(`Seeded ${bookings.length} bookings`);

  // --- Payments ---
  const PaymentSchema = new mongoose.Schema({
    bookingId: String, installmentNumber: Number, amount: Number,
    dueDate: Date, paidDate: Date, method: String, transactionId: String,
    receiptUrl: String, status: String,
  }, { timestamps: true });
  const Payment = mongoose.model('Payment', PaymentSchema);

  const bookingId = bookings[0]._id.toString();

  await Payment.insertMany([
    { bookingId, installmentNumber: 1, amount: 1850000, dueDate: new Date('2024-12-01'), paidDate: new Date('2024-12-01'), method: 'bank_transfer', transactionId: 'TXN-2024-78901', status: 'paid' },
    { bookingId, installmentNumber: 2, amount: 2775000, dueDate: new Date('2025-01-15'), paidDate: new Date('2025-01-14'), method: 'cheque', transactionId: 'CHQ-456789', status: 'paid' },
    { bookingId, installmentNumber: 3, amount: 1850000, dueDate: new Date('2025-03-31'), paidDate: new Date('2025-03-28'), method: 'bank_transfer', transactionId: 'TXN-2025-12345', status: 'paid' },
    { bookingId, installmentNumber: 4, amount: 1850000, dueDate: new Date('2025-06-30'), paidDate: null, method: null, transactionId: null, status: 'pending' },
    { bookingId, installmentNumber: 5, amount: 2775000, dueDate: new Date('2025-12-31'), paidDate: null, method: null, transactionId: null, status: 'pending' },
    { bookingId, installmentNumber: 6, amount: 1850000, dueDate: new Date('2026-06-30'), paidDate: null, method: null, transactionId: null, status: 'pending' },
    { bookingId, installmentNumber: 7, amount: 1850000, dueDate: new Date('2026-09-30'), paidDate: null, method: null, transactionId: null, status: 'pending' },
    { bookingId, installmentNumber: 8, amount: 3700000, dueDate: new Date('2027-03-31'), paidDate: null, method: null, transactionId: null, status: 'pending' },
  ]);
  console.log('Seeded 8 payments (3 paid, 5 pending)');

  // Pipeline summary
  const stageCounts: Record<string, number> = {};
  leads.forEach((l) => {
    stageCounts[l.stage] = (stageCounts[l.stage] || 0) + 1;
  });
  console.log('\nLead Pipeline:', stageCounts);

  await conn.disconnect();
  console.log('CRM seed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
