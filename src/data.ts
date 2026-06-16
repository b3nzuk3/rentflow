/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Organization,
  User,
  Property,
  Block,
  Unit,
  Tenant,
  Lease,
  Payment,
  AuditLog,
  RentNotification
} from "./types";

export const IMAGES = {
  greenwood: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
  kilimani: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
  karen: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
  sunset: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
  avatar_female: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80",
  avatar_male: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&h=200&q=80"
};

export const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    id: "org-amani",
    uuid: "org-uuid-1",
    name: "Amani Property Group Ltd",
    subscriptionPlan: "Growth",
    isActive: true,
    activeUnitsCount: 44
  },
  {
    id: "org-rift",
    uuid: "org-uuid-2",
    name: "Rift Management Services",
    subscriptionPlan: "Starter",
    isActive: true,
    activeUnitsCount: 8
  },
  {
    id: "org-prime",
    uuid: "org-uuid-3",
    name: "Peak Prime Realty Agency",
    subscriptionPlan: "Enterprise",
    isActive: true,
    activeUnitsCount: 154
  }
];

export const INITIAL_USERS: User[] = [
  // Amani Property Group Users
  {
    id: "user-fatuma",
    uuid: "u-uuid-1",
    organizationId: "org-amani",
    firstName: "Fatuma",
    lastName: "Ali",
    phoneNumber: "+254 712 345 678",
    email: "fatuma.ali@amani.com",
    role: "org_owner",
    isActive: true
  },
  {
    id: "user-mwangi",
    uuid: "u-uuid-2",
    organizationId: "org-amani",
    firstName: "Mwangi",
    lastName: "Karanja",
    phoneNumber: "+254 722 987 654",
    email: "mwangi.k@amani.com",
    role: "property_manager",
    isActive: true
  },
  {
    id: "user-grace",
    uuid: "u-uuid-3",
    organizationId: "org-amani",
    firstName: "Grace",
    lastName: "Kendi",
    phoneNumber: "+254 733 456 789",
    email: "grace.kendi@amani.com",
    role: "accountant",
    isActive: true
  },
  {
    id: "user-josphat",
    uuid: "u-uuid-4",
    organizationId: "org-amani",
    firstName: "Josphat",
    lastName: "Njoroge",
    phoneNumber: "+254 701 555 123",
    email: "j.njoroge@amani.com",
    role: "caretaker",
    isActive: true
  },
  {
    id: "user-tenant-jane",
    uuid: "u-uuid-5",
    organizationId: "org-amani",
    firstName: "Jane",
    lastName: "Doe",
    phoneNumber: "+254 725 333 444",
    email: "jane.doe@gmail.com",
    role: "tenant",
    isActive: true
  },

  // Rift Management Users
  {
    id: "user-rift-owner",
    uuid: "u-uuid-r1",
    organizationId: "org-rift",
    firstName: "David",
    lastName: "Kiprono",
    phoneNumber: "+254 750 111 222",
    email: "kiprono@rift.com",
    role: "org_owner",
    isActive: true
  },
  {
    id: "user-rift-tenant",
    uuid: "u-uuid-r2",
    organizationId: "org-rift",
    firstName: "Alex",
    lastName: "Mwenda",
    phoneNumber: "+254 755 888 999",
    email: "alex@gmail.com",
    role: "tenant",
    isActive: true
  }
];

export const INITIAL_PROPERTIES: Property[] = [
  // Amani Property Group Properties
  {
    id: "greenwood",
    uuid: "p-uuid-1",
    organizationId: "org-amani",
    name: "Greenwood Apartments",
    location: "Nairobi, Westlands",
    description: "Premium model duplex complex with secure boundary, borehole, and fiber internet.",
    status: "Active",
    image: IMAGES.greenwood
  },
  {
    id: "kilimani",
    uuid: "p-uuid-2",
    organizationId: "org-amani",
    name: "Kilimani Heights",
    location: "Nairobi, Kilimani",
    description: "Multi-family residential complex featuring stunning city views.",
    status: "Active",
    image: IMAGES.kilimani
  },
  {
    id: "karen",
    uuid: "p-uuid-3",
    organizationId: "org-amani",
    name: "Karen Palms Retreat",
    location: "Nairobi, Karen",
    description: "Boutique high-security townhouse community for high net worth clients.",
    status: "Active",
    image: IMAGES.karen
  },

  // Rift Management Properties
  {
    id: "rift-villas",
    uuid: "p-uuid-r1",
    organizationId: "org-rift",
    name: "Rift Valley Villas",
    location: "Nakuru, Milimani",
    description: "Stunning family units overlooking Nakuru town.",
    status: "Active",
    image: IMAGES.sunset
  }
];

export const INITIAL_BLOCKS: Block[] = [
  // Greenwood Blocks
  { id: "block-green-a", uuid: "b-uuid-1", propertyId: "greenwood", name: "Block A" },
  { id: "block-green-b", uuid: "b-uuid-2", propertyId: "greenwood", name: "Block B" },
  // Kilimani Blocks
  { id: "block-kili-east", uuid: "b-uuid-3", propertyId: "kilimani", name: "East Wing" },
  { id: "block-kili-west", uuid: "b-uuid-4", propertyId: "kilimani", name: "West Wing" }
];

export const INITIAL_UNITS: Unit[] = [
  // Greenwood Units (Amani)
  {
    id: "unit-g-b12",
    uuid: "unit-uuid-1",
    organizationId: "org-amani",
    propertyId: "greenwood",
    blockId: "block-green-b",
    unitCode: "Unit B12",
    rentAmount: 35000,
    status: "Occupied"
  },
  {
    id: "unit-g-b13",
    uuid: "unit-uuid-2",
    organizationId: "org-amani",
    propertyId: "greenwood",
    blockId: "block-green-b",
    unitCode: "Unit B13",
    rentAmount: 35000,
    status: "Vacant"
  },
  {
    id: "unit-g-a03",
    uuid: "unit-uuid-3",
    organizationId: "org-amani",
    propertyId: "greenwood",
    blockId: "block-green-a",
    unitCode: "Unit A03",
    rentAmount: 22000,
    status: "Occupied"
  },
  {
    id: "unit-g-a05",
    uuid: "unit-uuid-4",
    organizationId: "org-amani",
    propertyId: "greenwood",
    blockId: "block-green-a",
    unitCode: "Unit A05",
    rentAmount: 45000,
    status: "Reserved"
  },
  {
    id: "unit-g-b20",
    uuid: "unit-uuid-5",
    organizationId: "org-amani",
    propertyId: "greenwood",
    blockId: "block-green-b",
    unitCode: "Unit B20",
    rentAmount: 36000,
    status: "Under Maintenance"
  },

  // Kilimani Units (Amani)
  {
    id: "unit-k-101",
    uuid: "unit-uuid-6",
    organizationId: "org-amani",
    propertyId: "kilimani",
    blockId: "block-kili-east",
    unitCode: "Unit 101",
    rentAmount: 65000,
    status: "Occupied"
  },
  {
    id: "unit-k-102",
    uuid: "unit-uuid-7",
    organizationId: "org-amani",
    propertyId: "kilimani",
    blockId: "block-kili-west",
    unitCode: "Unit 102",
    rentAmount: 48000,
    status: "Occupied"
  },
  {
    id: "unit-k-103",
    uuid: "unit-uuid-8",
    organizationId: "org-amani",
    propertyId: "kilimani",
    blockId: "block-kili-west",
    unitCode: "Unit 103",
    rentAmount: 48000,
    status: "Vacant"
  },

  // Karen Units (Amani)
  {
    id: "unit-kr-v01",
    uuid: "unit-uuid-9",
    organizationId: "org-amani",
    propertyId: "karen",
    blockId: null,
    unitCode: "Villa 01",
    rentAmount: 120000,
    status: "Occupied"
  },
  {
    id: "unit-kr-v02",
    uuid: "unit-uuid-10",
    organizationId: "org-amani",
    propertyId: "karen",
    blockId: null,
    unitCode: "Villa 02",
    rentAmount: 125000,
    status: "Notice Given"
  },

  // Rift Units (Rift)
  {
    id: "unit-r-1",
    uuid: "unit-uuid-r1",
    organizationId: "org-rift",
    propertyId: "rift-villas",
    blockId: null,
    unitCode: "Villa A1",
    rentAmount: 40000,
    status: "Occupied"
  },
  {
    id: "unit-r-2",
    uuid: "unit-uuid-r2",
    organizationId: "org-rift",
    propertyId: "rift-villas",
    blockId: null,
    unitCode: "Villa A2",
    rentAmount: 40000,
    status: "Vacant"
  }
];

export const INITIAL_TENANTS: Tenant[] = [
  // Amani tenants
  {
    id: "tenant-jane",
    uuid: "t-uuid-1",
    organizationId: "org-amani",
    firstName: "Jane",
    lastName: "Doe",
    phoneNumber: "+254 725 333 444",
    email: "jane.doe@gmail.com",
    nationalId: "30521456",
    status: "Active"
  },
  {
    id: "tenant-kamau",
    uuid: "t-uuid-2",
    organizationId: "org-amani",
    firstName: "John",
    lastName: "Kamau",
    phoneNumber: "+254 712 111 222",
    email: "j.kamau@gmail.com",
    nationalId: "24509121",
    status: "Active"
  },
  {
    id: "tenant-wanjiku",
    uuid: "t-uuid-3",
    organizationId: "org-amani",
    firstName: "Sarah",
    lastName: "Wanjiku",
    phoneNumber: "+254 733 999 000",
    email: "s.wanjiku@yahoo.com",
    nationalId: "28456102",
    status: "Active"
  },
  {
    id: "tenant-kizito",
    uuid: "t-uuid-4",
    organizationId: "org-amani",
    firstName: "Amos",
    lastName: "Kizito",
    phoneNumber: "+254 710 444 555",
    email: "amos.kizito@outlook.com",
    nationalId: "31890241",
    status: "Invited"
  },
  {
    id: "tenant-moraa",
    uuid: "t-uuid-5",
    organizationId: "org-amani",
    firstName: "Faith",
    lastName: "Moraa",
    phoneNumber: "+254 721 222 333",
    email: "f.moraa@gmail.com",
    nationalId: "29451121",
    status: "Notice Given"
  },

  // Rift tenants
  {
    id: "tenant-rift-alex",
    uuid: "t-uuid-r1",
    organizationId: "org-rift",
    firstName: "Alex",
    lastName: "Mwenda",
    phoneNumber: "+254 755 888 999",
    email: "alex@gmail.com",
    nationalId: "25441021",
    status: "Active"
  }
];

export const INITIAL_LEASES: Lease[] = [
  // Amani leases
  {
    id: "lease-jane",
    uuid: "l-uuid-1",
    organizationId: "org-amani",
    tenantId: "tenant-jane",
    unitId: "unit-g-b12",
    monthlyRent: 35000,
    securityDeposit: 35000,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "Active"
  },
  {
    id: "lease-kamau",
    uuid: "l-uuid-2",
    organizationId: "org-amani",
    tenantId: "tenant-kamau",
    unitId: "unit-g-a03",
    monthlyRent: 22000,
    securityDeposit: 22000,
    startDate: "2024-02-15",
    endDate: "2025-02-14",
    status: "Active"
  },
  {
    id: "lease-wanjiku",
    uuid: "l-uuid-3",
    organizationId: "org-amani",
    tenantId: "tenant-wanjiku",
    unitId: "unit-g-a05",
    monthlyRent: 45000,
    securityDeposit: 45000,
    startDate: "2024-06-01",
    endDate: "2025-05-31",
    status: "Active"
  },

  // Rift leases
  {
    id: "lease-rift-alex",
    uuid: "l-uuid-r1",
    organizationId: "org-rift",
    tenantId: "tenant-rift-alex",
    unitId: "unit-r-1",
    monthlyRent: 40000,
    securityDeposit: 40000,
    startDate: "2024-01-10",
    endDate: "2025-01-09",
    status: "Active"
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  // Amani Payments
  {
    id: "pay-1",
    uuid: "pay-uuid-1",
    organizationId: "org-amani",
    leaseId: "lease-jane",
    amount: 35000,
    paymentMethod: "M-Pesa Paybill",
    transactionCode: "RG812M12P",
    paymentDate: "2026-06-01",
    submittedBy: "Tenant Jane Doe",
    verifiedBy: "grace.kendi@amani.com",
    verificationNotes: "Automatic reconciliation matched against MPesa statement.",
    status: "Verified",
    createdAt: "2026-06-01T08:12:00Z"
  },
  {
    id: "pay-2",
    uuid: "pay-uuid-2",
    organizationId: "org-amani",
    leaseId: "lease-kamau",
    amount: 22000,
    paymentMethod: "M-Pesa Buy Goods",
    transactionCode: "RF923N12O",
    paymentDate: "2026-06-02",
    submittedBy: "Tenant John Kamau",
    verifiedBy: "grace.kendi@amani.com",
    verificationNotes: "Reference RF923N12O verified physically in accounting portal.",
    status: "Verified",
    createdAt: "2026-06-02T10:15:00Z"
  },
  {
    id: "pay-new-pending-1",
    uuid: "pay-uuid-3",
    organizationId: "org-amani",
    leaseId: "lease-jane",
    amount: 35000,
    paymentMethod: "M-Pesa Paybill",
    transactionCode: "RKX73L89P",
    paymentDate: "2026-06-12",
    submittedBy: "Tenant Jane Doe",
    verifiedBy: null,
    verificationNotes: "",
    status: "Pending",
    createdAt: "2026-06-12T11:02:00Z"
  },
  {
    id: "pay-new-pending-2",
    uuid: "pay-uuid-4",
    organizationId: "org-amani",
    leaseId: "lease-wanjiku",
    amount: 45000,
    paymentMethod: "Bank Transfer",
    transactionCode: "TX_ST_902120",
    paymentDate: "2026-06-11",
    submittedBy: "Tenant Sarah Wanjiku",
    verifiedBy: null,
    verificationNotes: "",
    status: "Pending",
    createdAt: "2026-06-11T16:40:00Z"
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "log-1",
    user: "fatuma.ali@amani.com",
    role: "org_owner",
    action: "INVITE_TENANT",
    entity: "Tenant",
    previousValue: "None",
    newValue: "Amos Kizito (+254 710 444 555)",
    timestamp: "2026-06-11 10:22:45"
  },
  {
    id: "log-2",
    user: "grace.kendi@amani.com",
    role: "accountant",
    action: "VERIFY_PAYMENT",
    entity: "Payment",
    previousValue: "Pending",
    newValue: "Verified (TXN: RF923N12O - Amount: KSh 22,000)",
    timestamp: "2026-06-02 12:00:10"
  },
  {
    id: "log-3",
    user: "mwangi.k@amani.com",
    role: "property_manager",
    action: "CREATE_LEASE",
    entity: "Lease",
    previousValue: "None",
    newValue: "Lease Active (Tenant: John Kamau, Unit: A03)",
    timestamp: "2024-02-15 09:30:00"
  }
];

export const INITIAL_NOTIFICATIONS: RentNotification[] = [
  {
    id: "not-1",
    channel: "SMS",
    trigger: "Tenant Invited",
    recipient: "+254 710 444 555",
    message: "Amani Property Group has invited you to activate your RentFlow tenant portal. Click to register: rentflow.ke/a/invite-284x",
    timestamp: "2026-06-11 10:22:45",
    status: "Sent"
  },
  {
    id: "not-2",
    channel: "SMS",
    trigger: "Rent Due",
    recipient: "+254 725 333 444",
    message: "Rent announcement: KSh 35,000 is due on 2026-06-15 for Unit B12.",
    timestamp: "2026-06-12 08:00:00",
    status: "Sent"
  },
  {
    id: "not-3",
    channel: "In-App",
    trigger: "Payment Submitted",
    recipient: "grace.kendi@amani.com",
    message: "New rent payment submitted for Unit B12 (KSh 35,000, Ref: RKX73L89P) pending verification.",
    timestamp: "2026-06-12 11:02:00",
    status: "Sent"
  }
];
