import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const MONGO_URI = process.env.MONGO_SUPPLY_CHAIN_URI || 'mongodb://localhost:27017/realestate_supply_chain';

async function seed() {
  const conn = await mongoose.connect(MONGO_URI);
  console.log('Connected to supply-chain DB');

  await conn.connection.db!.dropDatabase();
  console.log('Cleared supply-chain DB');

  // --- Vendors ---
  const VendorSchema = new mongoose.Schema({
    name: String, category: String, contactPerson: String,
    phone: String, email: String, gstin: String, address: String,
    rating: Number, contracts: [Object], isActive: Boolean,
  }, { timestamps: true });
  const Vendor = mongoose.model('Vendor', VendorSchema);

  const vendors = await Vendor.insertMany([
    {
      name: 'Tata Steel Dealers',
      category: 'material_supplier',
      contactPerson: 'Suresh Menon',
      phone: '+91 9800000001',
      email: 'suresh@tatasteel-dealer.com',
      gstin: '27AABCT1332L1ZD',
      address: '12 Industrial Area, Navi Mumbai',
      rating: 4.5,
      contracts: [{ contractNumber: 'CTR-2024-001', startDate: new Date('2024-06-01'), endDate: new Date('2025-12-31'), value: 25000000, description: 'TMT Steel supply for Sunrise Heights' }],
      isActive: true,
    },
    {
      name: 'UltraTech Cement Co.',
      category: 'material_supplier',
      contactPerson: 'Manoj Deshmukh',
      phone: '+91 9800000002',
      email: 'manoj@ultratech-supply.com',
      gstin: '27AABCU8765P1ZC',
      address: '45 MIDC, Pune',
      rating: 4.2,
      contracts: [{ contractNumber: 'CTR-2024-002', startDate: new Date('2024-06-01'), endDate: new Date('2026-03-31'), value: 18000000, description: 'OPC & PPC cement supply' }],
      isActive: true,
    },
    {
      name: 'Sharma Electrical Works',
      category: 'electrical',
      contactPerson: 'Deepak Sharma',
      phone: '+91 9800000003',
      email: 'deepak@sharmaelectrical.com',
      gstin: '27AABCS5432K1ZA',
      address: '78 Lamington Road, Mumbai',
      rating: 3.8,
      contracts: [],
      isActive: true,
    },
    {
      name: 'AquaFlow Plumbing',
      category: 'plumbing',
      contactPerson: 'Rajan Nair',
      phone: '+91 9800000004',
      email: 'rajan@aquaflow.in',
      gstin: '27AABCA3210H1ZB',
      address: '23 Andheri East, Mumbai',
      rating: 4.0,
      contracts: [{ contractNumber: 'CTR-2024-005', startDate: new Date('2024-08-01'), endDate: new Date('2026-06-30'), value: 8500000, description: 'Complete plumbing work for Tower A & B' }],
      isActive: true,
    },
    {
      name: 'BuildRight Equipment Rentals',
      category: 'equipment_rental',
      contactPerson: 'Anil Kapoor',
      phone: '+91 9800000005',
      email: 'anil@buildright.com',
      gstin: '27AABCB7654M1ZE',
      address: '90 Thane Industrial Estate',
      rating: 4.3,
      contracts: [{ contractNumber: 'CTR-2024-003', startDate: new Date('2024-06-01'), endDate: new Date('2027-03-31'), value: 12000000, description: 'Tower cranes & heavy machinery rental' }],
      isActive: true,
    },
    {
      name: 'Greenscape Landscaping',
      category: 'landscaping',
      contactPerson: 'Meera Joshi',
      phone: '+91 9800000006',
      email: 'meera@greenscape.co.in',
      gstin: '27AABCG9876N1ZF',
      address: '15 Powai, Mumbai',
      rating: 4.7,
      contracts: [],
      isActive: true,
    },
  ]);
  console.log(`Seeded ${vendors.length} vendors`);

  // --- Purchase Orders ---
  const POSchema = new mongoose.Schema({
    vendorId: String, projectId: String, poNumber: String, items: [Object],
    totalAmount: Number, status: String, approvedBy: String, approvedAt: Date,
    deliveryDate: Date, notes: String,
  }, { timestamps: true });
  const PurchaseOrder = mongoose.model('PurchaseOrder', POSchema);

  // Use a placeholder projectId (would match inventory seed's Sunrise Heights)
  const projectId = 'sunrise-heights-placeholder';

  await PurchaseOrder.insertMany([
    {
      vendorId: vendors[0]._id.toString(),
      projectId,
      poNumber: 'PO-2024-001',
      items: [
        { name: 'TMT Steel 12mm', quantity: 500, unit: 'tons', unitPrice: 55000, totalPrice: 27500000 },
        { name: 'TMT Steel 16mm', quantity: 300, unit: 'tons', unitPrice: 56000, totalPrice: 16800000 },
      ],
      totalAmount: 44300000,
      status: 'received',
      approvedBy: 'admin',
      approvedAt: new Date('2024-06-15'),
      deliveryDate: new Date('2024-07-01'),
      notes: 'First batch for foundation work',
    },
    {
      vendorId: vendors[1]._id.toString(),
      projectId,
      poNumber: 'PO-2024-002',
      items: [
        { name: 'OPC 53 Grade Cement', quantity: 2000, unit: 'bags', unitPrice: 380, totalPrice: 760000 },
        { name: 'PPC Cement', quantity: 3000, unit: 'bags', unitPrice: 350, totalPrice: 1050000 },
      ],
      totalAmount: 1810000,
      status: 'paid',
      approvedBy: 'admin',
      approvedAt: new Date('2024-06-20'),
      deliveryDate: new Date('2024-07-05'),
    },
    {
      vendorId: vendors[0]._id.toString(),
      projectId,
      poNumber: 'PO-2025-003',
      items: [
        { name: 'TMT Steel 12mm', quantity: 200, unit: 'tons', unitPrice: 57000, totalPrice: 11400000 },
      ],
      totalAmount: 11400000,
      status: 'approved',
      approvedBy: 'admin',
      approvedAt: new Date('2025-03-01'),
      deliveryDate: new Date('2025-04-15'),
      notes: 'For floors 15-20 structural work',
    },
    {
      vendorId: vendors[3]._id.toString(),
      projectId,
      poNumber: 'PO-2025-004',
      items: [
        { name: 'CPVC Pipes 1 inch', quantity: 5000, unit: 'meters', unitPrice: 120, totalPrice: 600000 },
        { name: 'GI Pipes 2 inch', quantity: 2000, unit: 'meters', unitPrice: 280, totalPrice: 560000 },
        { name: 'Bathroom Fittings Set', quantity: 160, unit: 'sets', unitPrice: 15000, totalPrice: 2400000 },
      ],
      totalAmount: 3560000,
      status: 'dispatched',
      approvedBy: 'admin',
      approvedAt: new Date('2025-02-15'),
      deliveryDate: new Date('2025-04-01'),
    },
  ]);
  console.log('Seeded 4 purchase orders');

  // --- Milestones ---
  const MilestoneSchema = new mongoose.Schema({
    projectId: String, blockId: String, name: String, description: String,
    targetDate: Date, completedDate: Date, status: String, percentage: Number,
    dependencies: [String], assignedTo: String,
  }, { timestamps: true });
  const Milestone = mongoose.model('Milestone', MilestoneSchema);

  const milestones = await Milestone.insertMany([
    { projectId, blockId: 'tower-a', name: 'Foundation Complete', description: 'Piling and raft foundation for Tower A', targetDate: new Date('2024-09-30'), completedDate: new Date('2024-10-05'), status: 'completed', percentage: 100, dependencies: [], assignedTo: 'Vikram Singh' },
    { projectId, blockId: 'tower-a', name: 'Structure (Floors 1-5)', description: 'RCC structural work for floors 1-5', targetDate: new Date('2025-01-31'), completedDate: new Date('2025-02-10'), status: 'completed', percentage: 100, dependencies: [], assignedTo: 'Vikram Singh' },
    { projectId, blockId: 'tower-a', name: 'Structure (Floors 6-10)', description: 'RCC structural work for floors 6-10', targetDate: new Date('2025-05-31'), completedDate: new Date('2025-05-28'), status: 'completed', percentage: 100, dependencies: [], assignedTo: 'Vikram Singh' },
    { projectId, blockId: 'tower-a', name: 'Structure (Floors 11-15)', description: 'RCC structural work for floors 11-15', targetDate: new Date('2025-09-30'), completedDate: null, status: 'in_progress', percentage: 65, dependencies: [], assignedTo: 'Vikram Singh' },
    { projectId, blockId: 'tower-a', name: 'Structure (Floors 16-20)', description: 'RCC structural work for floors 16-20', targetDate: new Date('2026-01-31'), completedDate: null, status: 'pending', percentage: 0, dependencies: [], assignedTo: 'Vikram Singh' },
    { projectId, blockId: 'tower-a', name: 'MEP Work (Floors 1-5)', description: 'Mechanical, electrical, plumbing for floors 1-5', targetDate: new Date('2025-04-30'), completedDate: new Date('2025-04-20'), status: 'completed', percentage: 100, dependencies: [], assignedTo: 'Deepak Sharma' },
    { projectId, blockId: 'tower-a', name: 'Interior Finishing (Floors 1-5)', description: 'Flooring, painting, fixtures for floors 1-5', targetDate: new Date('2025-07-31'), completedDate: new Date('2025-07-25'), status: 'completed', percentage: 100, dependencies: [], assignedTo: 'Vikram Singh' },
    { projectId, blockId: 'tower-a', name: 'MEP Work (Floors 6-10)', description: 'Mechanical, electrical, plumbing for floors 6-10', targetDate: new Date('2025-08-31'), completedDate: null, status: 'in_progress', percentage: 40, dependencies: [], assignedTo: 'Deepak Sharma' },
  ]);
  console.log(`Seeded ${milestones.length} milestones`);

  // --- QC Checklists ---
  const QCSchema = new mongoose.Schema({
    milestoneId: String, unitId: String, blockId: String, inspectorId: String,
    items: [Object], overallStatus: String, remarks: String, inspectedAt: Date,
  }, { timestamps: true });
  const QCChecklist = mongoose.model('QCChecklist', QCSchema);

  await QCChecklist.insertMany([
    {
      milestoneId: milestones[1]._id.toString(),
      blockId: 'tower-a',
      inspectorId: 'engineer-vikram',
      items: [
        { name: 'Column alignment check', status: 'passed', remarks: 'Within tolerance', photos: [] },
        { name: 'Concrete strength test', status: 'passed', remarks: 'M40 achieved - 42 MPa', photos: [] },
        { name: 'Rebar spacing verification', status: 'passed', remarks: 'As per drawing', photos: [] },
        { name: 'Plumb check', status: 'passed', remarks: 'OK', photos: [] },
      ],
      overallStatus: 'passed',
      remarks: 'All structural checks passed for floors 1-5',
      inspectedAt: new Date('2025-02-12'),
    },
    {
      milestoneId: milestones[5]._id.toString(),
      blockId: 'tower-a',
      inspectorId: 'engineer-vikram',
      items: [
        { name: 'Electrical wiring continuity', status: 'passed', remarks: 'All circuits tested', photos: [] },
        { name: 'Plumbing pressure test', status: 'passed', remarks: '5 bar for 30 min - no leak', photos: [] },
        { name: 'Fire safety compliance', status: 'passed', remarks: 'Sprinklers & detectors installed', photos: [] },
        { name: 'HVAC duct installation', status: 'passed', remarks: 'Installed as per design', photos: [] },
      ],
      overallStatus: 'passed',
      remarks: 'MEP work completed satisfactorily for floors 1-5',
      inspectedAt: new Date('2025-04-22'),
    },
  ]);
  console.log('Seeded 2 QC checklists');

  await conn.disconnect();
  console.log('Supply Chain seed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
