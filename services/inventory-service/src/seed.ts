import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const MONGO_URI = process.env.MONGO_INVENTORY_URI || 'mongodb://localhost:27017/realestate_inventory';

async function seed() {
  const conn = await mongoose.connect(MONGO_URI);
  console.log('Connected to inventory DB');

  await conn.connection.db!.dropDatabase();
  console.log('Cleared inventory DB');

  // --- Projects ---
  const ProjectSchema = new mongoose.Schema({
    name: String, location: Object, totalUnits: Number, reraNumber: String,
    status: String, startDate: Date, expectedCompletion: Date,
    description: String, amenities: [String],
  }, { timestamps: true });
  const Project = mongoose.model('Project', ProjectSchema);

  const projects = await Project.insertMany([
    {
      name: 'Sunrise Heights',
      location: { address: '123 MG Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', coordinates: { lat: 19.076, lng: 72.8777 } },
      totalUnits: 120,
      reraNumber: 'RERA-MH-2024-001',
      status: 'active',
      startDate: new Date('2024-06-01'),
      expectedCompletion: new Date('2027-03-31'),
      description: 'Premium residential tower with sea-facing apartments in South Mumbai',
      amenities: ['Swimming Pool', 'Gym', 'Clubhouse', 'Garden', 'Parking', 'Security'],
    },
    {
      name: 'Green Valley Villas',
      location: { address: '45 Whitefield Main Road', city: 'Bangalore', state: 'Karnataka', pincode: '560066', coordinates: { lat: 12.9698, lng: 77.7500 } },
      totalUnits: 48,
      reraNumber: 'RERA-KA-2024-042',
      status: 'active',
      startDate: new Date('2024-09-01'),
      expectedCompletion: new Date('2026-12-31'),
      description: 'Luxury villa community with landscaped gardens and private pools',
      amenities: ['Private Pool', 'Clubhouse', 'Tennis Court', 'Jogging Track', 'Kids Play Area'],
    },
    {
      name: 'Metro Square',
      location: { address: '78 Cyber City', city: 'Gurugram', state: 'Haryana', pincode: '122002', coordinates: { lat: 28.4595, lng: 77.0266 } },
      totalUnits: 200,
      reraNumber: 'RERA-HR-2025-015',
      status: 'planning',
      startDate: new Date('2025-06-01'),
      expectedCompletion: new Date('2028-12-31'),
      description: 'Mixed-use development with residential apartments and retail spaces',
      amenities: ['Rooftop Garden', 'Co-working Space', 'Retail Mall', 'Multi-level Parking'],
    },
  ]);
  console.log(`Seeded ${projects.length} projects`);

  // --- Blocks ---
  const BlockSchema = new mongoose.Schema({
    projectId: String, name: String, totalFloors: Number,
    unitsPerFloor: Number, totalUnits: Number,
  }, { timestamps: true });
  const Block = mongoose.model('Block', BlockSchema);

  const sunriseId = projects[0]._id.toString();
  const greenValleyId = projects[1]._id.toString();

  const blocks = await Block.insertMany([
    { projectId: sunriseId, name: 'Tower A', totalFloors: 20, unitsPerFloor: 4, totalUnits: 80 },
    { projectId: sunriseId, name: 'Tower B', totalFloors: 10, unitsPerFloor: 4, totalUnits: 40 },
    { projectId: greenValleyId, name: 'Phase 1', totalFloors: 2, unitsPerFloor: 8, totalUnits: 16 },
    { projectId: greenValleyId, name: 'Phase 2', totalFloors: 2, unitsPerFloor: 8, totalUnits: 16 },
    { projectId: greenValleyId, name: 'Phase 3', totalFloors: 2, unitsPerFloor: 8, totalUnits: 16 },
  ]);
  console.log(`Seeded ${blocks.length} blocks`);

  // --- Units (Tower A - 20 floors x 4 units) ---
  const UnitSchema = new mongoose.Schema({
    projectId: String, blockId: String, floor: Number, unitNumber: String,
    type: String, carpetArea: Number, superBuiltupArea: Number,
    facing: String, status: String, basePrice: Number, currentPrice: Number,
    lockedBy: String, lockExpiresAt: Date, soldTo: String, bookingId: String,
    documents: [String],
  }, { timestamps: true });
  const Unit = mongoose.model('Unit', UnitSchema);

  const towerAId = blocks[0]._id.toString();
  const towerBId = blocks[1]._id.toString();

  const facings = ['north', 'south', 'east', 'sea_facing'];
  const types = ['2BHK', '2BHK', '3BHK', '3BHK'];
  const areas = [
    { carpet: 850, super: 1100 },
    { carpet: 850, super: 1100 },
    { carpet: 1200, super: 1500 },
    { carpet: 1350, super: 1650 },
  ];

  const units: any[] = [];

  // Tower A units (floors 1-20, 4 units each)
  for (let floor = 1; floor <= 20; floor++) {
    for (let unit = 1; unit <= 4; unit++) {
      const basePrice = areas[unit - 1].super * 15000; // ₹15,000 per sqft base
      const floorPremium = (floor - 1) * 50000; // ₹50K per floor rise
      const viewPremium = facings[unit - 1] === 'sea_facing' ? 2000000 : 0;

      let status = 'available';
      // Mark some as sold/locked for realism
      if (floor <= 5 && unit <= 2) status = 'sold';
      else if (floor === 6 && unit === 1) status = 'soft_locked';
      else if (floor >= 18) status = 'under_maintenance'; // top floors still under construction

      units.push({
        projectId: sunriseId,
        blockId: towerAId,
        floor,
        unitNumber: `A-${floor}${String(unit).padStart(2, '0')}`,
        type: types[unit - 1],
        carpetArea: areas[unit - 1].carpet,
        superBuiltupArea: areas[unit - 1].super,
        facing: facings[unit - 1],
        status,
        basePrice,
        currentPrice: basePrice + floorPremium + viewPremium,
        lockedBy: status === 'soft_locked' ? 'agent1-placeholder' : undefined,
        lockExpiresAt: status === 'soft_locked' ? new Date(Date.now() + 20 * 60 * 1000) : undefined,
        documents: [],
      });
    }
  }

  // Tower B units (floors 1-10, 4 units each)
  for (let floor = 1; floor <= 10; floor++) {
    for (let unit = 1; unit <= 4; unit++) {
      const basePrice = areas[unit - 1].super * 13000; // ₹13,000 per sqft
      const floorPremium = (floor - 1) * 40000;

      let status = 'available';
      if (floor <= 3 && unit <= 2) status = 'sold';

      units.push({
        projectId: sunriseId,
        blockId: towerBId,
        floor,
        unitNumber: `B-${floor}${String(unit).padStart(2, '0')}`,
        type: types[unit - 1],
        carpetArea: areas[unit - 1].carpet,
        superBuiltupArea: areas[unit - 1].super,
        facing: facings[unit - 1],
        status,
        basePrice,
        currentPrice: basePrice + floorPremium,
        documents: [],
      });
    }
  }

  const insertedUnits = await Unit.insertMany(units);
  console.log(`Seeded ${insertedUnits.length} units`);

  // --- Pricing Rules ---
  const PricingRuleSchema = new mongoose.Schema({
    projectId: String, type: String, params: Object, isActive: Boolean,
  }, { timestamps: true });
  const PricingRule = mongoose.model('PricingRule', PricingRuleSchema);

  await PricingRule.insertMany([
    {
      projectId: sunriseId,
      type: 'floor_rise',
      params: { amountPerFloor: 50000, startFloor: 1 },
      isActive: true,
    },
    {
      projectId: sunriseId,
      type: 'view_premium',
      params: { sea_facing: 2000000, garden_facing: 500000, north: 0, south: 0, east: 100000 },
      isActive: true,
    },
    {
      projectId: sunriseId,
      type: 'demand_factor',
      params: { multiplier: 1.05, reason: 'High demand Q4 2025' },
      isActive: false,
    },
    {
      projectId: sunriseId,
      type: 'area_rate',
      params: { ratePerSqft: 15000, appliesTo: 'super_builtup' },
      isActive: true,
    },
  ]);
  console.log('Seeded 4 pricing rules');

  // Summary stats
  const available = units.filter((u) => u.status === 'available').length;
  const sold = units.filter((u) => u.status === 'sold').length;
  const locked = units.filter((u) => u.status === 'soft_locked').length;
  const maintenance = units.filter((u) => u.status === 'under_maintenance').length;
  console.log(`\nUnit Summary: ${available} available, ${sold} sold, ${locked} locked, ${maintenance} under maintenance`);

  await conn.disconnect();
  console.log('Inventory seed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
