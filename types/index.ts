export type FamilyRole = 'Head' | 'Member';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id?: string;
  name: string;
  role: FamilyRole;
  avatar_color: string;
  phone?: string;
  relation: string; // e.g., 'Head', 'Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Self'
  created_at?: string;
}

export interface Family {
  id: string;
  name: string;
  join_code: string;
  monthly_budget: number;
  currency: 'INR';
  created_by?: string;
  created_at: string;
  members: FamilyMember[];
}

export type CategorySlug =
  | 'kirana'
  | 'sabzi-dairy'
  | 'medical'
  | 'education'
  | 'bills-emi'
  | 'udhaar'
  | 'savings'
  | string;

export type ItemStatus = 'Pending' | 'Bought' | 'Paid' | 'Settled';

export interface UdhaarRepayment {
  id: string;
  amount: number;
  date: string;
  notes?: string;
  recorded_by: string;
}

export interface ExtraData {
  // Kirana
  brand?: string;
  staple_tag?: 'Atta' | 'Rice' | 'Dal' | 'Oil' | 'Sugar' | 'Spices' | 'Cleaning' | 'Snacks' | 'Other';
  
  // Milk Card / Dairy
  milk_daily_liters?: number;
  milk_rate_per_liter?: number;
  milk_days_in_month?: number;
  days_taken?: number;

  // Medical
  patient_name?: string;
  doctor_name?: string;
  clinic_hospital?: string;
  prescription_notes?: string;
  next_checkup_date?: string;
  refill_reminder_date?: string;

  // Education
  student_name?: string;
  school_or_college?: string;
  fee_type?: 'Tuition' | 'School Fee' | 'Books' | 'Uniform' | 'Exam Fee' | 'Bus Fee';
  term_period?: string;

  // Bills & EMI
  bill_type?: 'electricity' | 'lpg' | 'wifi' | 'mobile' | 'dth' | 'emi' | 'water' | 'piped_gas';
  lpg_last_booking_date?: string;
  lpg_estimated_lifespan_days?: number;
  consumer_or_account_no?: string;
  emi_tenure_months_left?: number;

  // Udhaar & Len-Den
  udhaar_direction?: 'given' | 'taken'; // 'given' = We will get (Asset), 'taken' = We owe (Liability)
  person_name?: string;
  person_phone?: string;
  due_settlement_date?: string;
  repayments?: UdhaarRepayment[];

  // Savings & Investments
  savings_type?: 'rd' | 'fd' | 'lic' | 'gold_chit' | 'emergency_fund' | 'ppf';
  account_or_policy_no?: string;
  maturity_date?: string;
  maturity_amount?: number;
  target_amount?: number;
  accumulated_amount?: number;

  [key: string]: unknown;
}

export interface LedgerItem {
  id: string;
  family_id: string;
  category_slug: CategorySlug;
  item_name: string;
  quantity: string | number;
  unit: string;
  expected_price: number;
  actual_price: number;
  status: ItemStatus;
  recurrence: 'One-time' | 'Daily' | 'Monthly' | 'Quarterly' | 'Yearly';
  due_date?: string;
  notes?: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  extra_data?: ExtraData;
}

export interface CategoryMeta {
  slug: CategorySlug;
  name: string;
  hindi_name: string;
  description: string;
  icon_name: string;
  monthly_budget: number;
  is_system: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  parsed_actions?: {
    action: 'add_item' | 'answer' | 'budget_alert';
    items?: Partial<LedgerItem>[];
    summary?: string;
  };
}

export interface BlankTemplateItem {
  item_name: string;
  quantity: string | number;
  unit: string;
  notes?: string;
  extra_data?: ExtraData;
}
