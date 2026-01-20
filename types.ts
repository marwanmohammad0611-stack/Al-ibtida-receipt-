
export interface FeeCategory {
  id: string;
  name: string;
  defaultAmount: number;
  isEnabled: boolean;
  isCustom?: boolean;
}

export interface SelectedFee {
  categoryId: string;
  amount: number;
  paid: number;
  due: number;
}

export interface SchoolProfile {
  name: string;
  address: string;
  trustName: string;
  logo: string | null;
}

export interface Receipt {
  id: string;
  receiptNo: string;
  studentName: string;
  class: string;
  section: string;
  rollNo: string;
  guardianName: string;
  mobileNumber: string;
  dateOfPayment: string;
  monthYear: string;
  fees: SelectedFee[];
  totalAmount: number;
  totalPaid: number;
  totalDue: number;
  createdAt: number;
}

export type PrintLayout = 'single' | 'grid';
