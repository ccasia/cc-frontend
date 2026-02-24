// Bank name (as stored in paymentForm.bankName) 
export const BANK_CODE_MAP = {
  'Affin Bank Berhad': 'PHBMMYKL',
  'Alliance Bank Malaysia Berhad': 'MFBBMYKL',
  'AmBank (M) Berhad': 'ARBKMYKL',
  'Bank Islam Malaysia Berhad': 'BIMBMYKL',
  'Bank Muamalat Malaysia Berhad': 'BMMBMYKL',
  'Bank Rakyat': 'BKRMMYKL',
  'Bank Simpanan Nasional': 'BSNAMYK1',
  'CIMB Bank Berhad': 'CIBBMYKL',
  'Hong Leong Bank Berhad': 'HLBBMYKL',
  'HSBC Bank Malaysia Berhad': 'HBMBMYKL',
  Maybank: 'MBBEMYKL',
  'OCBC Bank (Malaysia) Berhad': 'OCBCMYKL',
  'Public Bank Berhad': 'PBBEMYKL',
  'RHB Bank Berhad': 'RHBBMYKL',
  'Standard Chartered Bank Malaysia Berhad': 'SCBLMYKX',
  'United Overseas Bank (Malaysia) Bhd': 'UOVBMYKL',
  'Agrobank / Bank Pertanian Malaysia Berhad': 'AGOBMYKL',
  'Citibank Berhad': 'CITIMYKL',
};

// Alliance intrabank codes (Payment Mode = LIP)
const ALLIANCE_CODES = ['MFBBMYKL', 'ALSRMYKL', 'MBAMMYKL', 'MBAMMY21'];

// IBG-participating bank codes (Payment Mode = LGP)
const IBG_CODES = [
  'PHBMMYKL',
  'ARBKMYKL',
  'BIMBMYKL',
  'BMMBMYKL',
  'BKRMMYKL',
  'BSNAMYK1',
  'CIBBMYKL',
  'HLBBMYKL',
  'HBMBMYKL',
  'MBBEMYKL',
  'OCBCMYKL',
  'PBBEMYKL',
  'RHBBMYKL',
  'SCBLMYKX',
  'UOVBMYKL',
  'AGOBMYKL',
  'CITIMYKL',
];

// Get the bank SWIFT code from a bank name string.
// Uses partial matching since stored names may include suffixes.
export function getBankCode(bankName) {
  if (!bankName) return '';
  const normalized = bankName.toLowerCase();
  const match = Object.entries(BANK_CODE_MAP).find(
    ([name]) => normalized.includes(name.toLowerCase()) || name.toLowerCase().includes(normalized)
  );
  return match ? match[1] : '';
}

// Auto-determine Payment Mode based on bank code.
// LIP = Alliance intrabank, LGP = IBG interbank, LSP = RENTAS (non-IBG)
export function getPaymentMode(bankCode) {
  if (!bankCode) return '';
  if (ALLIANCE_CODES.includes(bankCode)) return 'LIP';
  if (IBG_CODES.includes(bankCode)) return 'LGP';
  return 'LSP';
}
