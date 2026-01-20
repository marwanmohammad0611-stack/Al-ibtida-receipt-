
import { FeeCategory, SchoolProfile } from './types';

export const DEFAULT_FEE_CATEGORIES: FeeCategory[] = [
  { id: '1', name: 'Admission Fee', defaultAmount: 5000, isEnabled: true },
  { id: '2', name: 'Monthly Tuition Fee', defaultAmount: 1200, isEnabled: true },
  { id: '3', name: 'Examination Fee', defaultAmount: 500, isEnabled: true },
  { id: '4', name: 'Computer Fee', defaultAmount: 300, isEnabled: true },
  { id: '5', name: 'Sports & Cultural Fee', defaultAmount: 400, isEnabled: true },
  { id: '6', name: 'Miscellaneous Fee', defaultAmount: 100, isEnabled: true },
];

export const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  name: 'AL-IBTIDA PUBLIC SCHOOL',
  address: 'New Town, Sector-V, West Bengal, India - 700001',
  trustName: 'AL-IBTIDA EDUCATIONAL TRUST',
  logo: 'https://cdn-icons-png.flaticon.com/512/2910/2910791.png'
};
