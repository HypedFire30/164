/**
 * Mock Data Generators for MVP Development
 * 
 * These generate consistent, realistic fake data for properties, units, tenants, and leases.
 * All data is deterministic based on property ID to ensure consistency across page reloads.
 */

import type { Unit, Tenant, Lease, Property, Mortgage } from "@/types";

// Deterministic random number generator based on seed
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  let value = Math.abs(hash) / 2147483647;
  
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

// Fake names for tenants
const FIRST_NAMES = [
  "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
  "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Christopher", "Karen", "Daniel", "Nancy", "Matthew", "Lisa",
  "Anthony", "Betty", "Mark", "Margaret", "Donald", "Sandra", "Steven", "Ashley"
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor",
  "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris", "Sanchez"
];

function generateTenantName(seed: string): string {
  const random = seededRandom(seed);
  const firstName = FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(random() * LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
}

function generateEmail(name: string): string {
  return `${name.toLowerCase().replace(/\s+/g, '.')}@email.com`;
}

function generatePhone(seed: string): string {
  const random = seededRandom(seed);
  const area = Math.floor(200 + random() * 800); // 200-999
  const exchange = Math.floor(200 + random() * 800);
  const number = Math.floor(1000 + random() * 9000);
  return `(${area}) ${exchange}-${number}`;
}

// Unit types with typical square footage ranges
const UNIT_TYPES = [
  { type: "Studio" as const, minSqFt: 400, maxSqFt: 600, bedrooms: 0, bathrooms: 1 },
  { type: "1BR" as const, minSqFt: 600, maxSqFt: 900, bedrooms: 1, bathrooms: 1 },
  { type: "2BR" as const, minSqFt: 900, maxSqFt: 1200, bedrooms: 2, bathrooms: 1 },
  { type: "3BR" as const, minSqFt: 1200, maxSqFt: 1800, bedrooms: 3, bathrooms: 2 },
  { type: "4BR" as const, minSqFt: 1800, maxSqFt: 2500, bedrooms: 4, bathrooms: 2 },
];

// Generate units for a property
export function generateUnits(propertyId: string, totalUnits: number): Unit[] {
  const random = seededRandom(propertyId);
  const units: Unit[] = [];
  
  for (let i = 1; i <= totalUnits; i++) {
    const unitSeed = `${propertyId}-unit-${i}`;
    const unitRandom = seededRandom(unitSeed);
    const unitType = UNIT_TYPES[Math.floor(unitRandom() * UNIT_TYPES.length)];
    const sqFt = Math.floor(unitType.minSqFt + unitRandom() * (unitType.maxSqFt - unitType.minSqFt));
    
    // Market rent: $1.50-$3.00 per sq ft per month (Portland area)
    const rentPerSqFt = 1.5 + unitRandom() * 1.5;
    const marketRent = Math.round(sqFt * rentPerSqFt);
    
    units.push({
      id: `unit-${propertyId}-${i}`,
      propertyId,
      unitNumber: i <= 9 ? `10${i}` : `${i}`,
      unitType: unitType.type,
      squareFootage: sqFt,
      bedrooms: unitType.bedrooms,
      bathrooms: unitType.bathrooms,
      marketRent,
      notes: null,
    });
  }
  
  return units;
}

// Generate tenants
export function generateTenants(count: number, seed: string): Tenant[] {
  const tenants: Tenant[] = [];
  const random = seededRandom(seed);
  
  for (let i = 0; i < count; i++) {
    const tenantSeed = `${seed}-tenant-${i}`;
    const name = generateTenantName(tenantSeed);
    const tenantRandom = seededRandom(tenantSeed);
    
    tenants.push({
      id: `tenant-${seed}-${i}`,
      name,
      email: generateEmail(name),
      phone: generatePhone(tenantSeed),
      emergencyContact: generateTenantName(`${tenantSeed}-emergency`),
      emergencyPhone: generatePhone(`${tenantSeed}-emergency`),
      notes: null,
    });
  }
  
  return tenants;
}

// Generate leases for units
export function generateLeases(
  propertyId: string,
  units: Unit[],
  tenants: Tenant[]
): Lease[] {
  const random = seededRandom(`${propertyId}-leases`);
  const leases: Lease[] = [];
  const occupiedCount = Math.floor(units.length * (0.75 + random() * 0.2)); // 75-95% occupancy
  
  // Shuffle tenants
  const shuffledTenants = [...tenants].sort(() => random() - 0.5);
  
  for (let i = 0; i < Math.min(occupiedCount, units.length, tenants.length); i++) {
    const unit = units[i];
    const tenant = shuffledTenants[i];
    const leaseSeed = `${propertyId}-lease-${unit.id}`;
    const leaseRandom = seededRandom(leaseSeed);
    
    // Lease dates: start 6-24 months ago, end 6-18 months from now
    const monthsAgo = 6 + Math.floor(leaseRandom() * 18);
    const leaseLength = 12 + Math.floor(leaseRandom() * 12); // 12-24 months
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsAgo);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + leaseLength);
    
    // Rent: 90-100% of market rent
    const rentMultiplier = 0.9 + leaseRandom() * 0.1;
    const monthlyRent = Math.round(unit.marketRent! * rentMultiplier);
    
    // Fees
    const hasParking = leaseRandom() > 0.5;
    const hasStorage = leaseRandom() > 0.3;
    const parkingFee = hasParking ? Math.round(50 + leaseRandom() * 100) : null;
    const storageFee = hasStorage ? Math.round(30 + leaseRandom() * 50) : null;
    const otherFees = leaseRandom() > 0.7 ? Math.round(20 + leaseRandom() * 30) : null;
    
    const totalMonthlyRent = monthlyRent + (parkingFee || 0) + (storageFee || 0) + (otherFees || 0);
    
    // Security deposit: typically 1 month rent
    const securityDeposit = monthlyRent;
    const petDeposit = leaseRandom() > 0.6 ? Math.round(200 + leaseRandom() * 300) : null;
    
    // Payment status
    const isCurrent = leaseRandom() > 0.15; // 85% current
    const paymentStatus = isCurrent ? "Current" : "Past Due";
    const daysPastDue = isCurrent ? null : Math.floor(1 + leaseRandom() * 30);
    
    // Last payment: within last 30 days if current
    const lastPaymentDate = new Date();
    if (isCurrent) {
      lastPaymentDate.setDate(lastPaymentDate.getDate() - Math.floor(leaseRandom() * 30));
    } else {
      lastPaymentDate.setDate(lastPaymentDate.getDate() - (31 + daysPastDue!));
    }
    
    leases.push({
      id: `lease-${propertyId}-${unit.id}`,
      propertyId,
      unitId: unit.id,
      tenantId: tenant.id,
      tenant, // Populate tenant
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      monthlyRent,
      securityDeposit,
      petDeposit,
      parkingFee,
      storageFee,
      otherFees,
      totalMonthlyRent,
      leaseType: leaseRandom() > 0.2 ? "Fixed-Term" : "Month-to-Month",
      renewalOption: leaseRandom() > 0.5 ? "Option to Renew" : "None",
      renewalTerms: leaseRandom() > 0.5 ? "5% increase or market rate" : null,
      status: endDate > new Date() ? "Active" : "Expired",
      lastPaymentDate: lastPaymentDate.toISOString(),
      paymentStatus: paymentStatus as "Current" | "Past Due",
      daysPastDue,
      guarantorName: leaseRandom() > 0.7 ? generateTenantName(`${leaseSeed}-guarantor`) : null,
      guarantorContact: null,
      specialTerms: null,
      leaseDocumentUrl: null,
      notes: null,
    });
  }
  
  return leases;
}

// Calculate property totals from units and leases
export function calculatePropertyTotals(
  units: Unit[],
  leases: Lease[]
): {
  totalUnits: number;
  occupiedUnits: number;
  monthlyRentalIncome: number;
  occupancyRate: number;
} {
  const totalUnits = units.length;
  const occupiedUnits = leases.filter(l => l.status === "Active").length;
  const monthlyRentalIncome = leases
    .filter(l => l.status === "Active")
    .reduce((sum, lease) => sum + lease.totalMonthlyRent, 0);
  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
  
  return {
    totalUnits,
    occupiedUnits,
    monthlyRentalIncome,
    occupancyRate,
  };
}

// Generate all mock data for a property
export function generatePropertyMockData(property: Property): {
  units: Unit[];
  tenants: Tenant[];
  leases: Lease[];
  totals: ReturnType<typeof calculatePropertyTotals>;
} {
  // Determine number of units based on property value (rough estimate)
  // Assume $150k-$200k per unit
  const estimatedUnits = Math.max(1, Math.floor(property.currentValue / 175000));
  const totalUnits = property.totalUnits || estimatedUnits;
  
  // Generate units
  const units = generateUnits(property.id, totalUnits);
  
  // Generate tenants (more than units for variety)
  const tenants = generateTenants(Math.ceil(totalUnits * 1.2), property.id);
  
  // Generate leases
  const leases = generateLeases(property.id, units, tenants);
  
  // Calculate totals
  const totals = calculatePropertyTotals(units, leases);
  
  return { units, tenants, leases, totals };
}
