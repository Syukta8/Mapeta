import type { TollBreakdownItem } from '../types/navigation';

/**
 * Lembaga Lebuhraya Malaysia (LLM) Gazetted Toll Database & Calculator (Class 1 Passenger Car)
 */
interface ExpresswayDef {
  name: string;
  code: string;
  keywords: string[];
  type: 'open' | 'closed';
  openRate?: number; // Flat fee per gantry (RM)
  closedRatePerKm?: number; // Rate per km (RM/km)
  minFee?: number;
}

const LLM_EXPRESSWAYS: ExpresswayDef[] = [
  // 1. Closed Toll System (Distance-based)
  {
    name: 'Lebuhraya Utara-Selatan (PLUS)',
    code: 'E1/E2',
    keywords: ['plus', 'utara-selatan', 'north-south expressway', 'lebuhraya utara selatan', 'e1', 'e2', 'ah2'],
    type: 'closed',
    closedRatePerKm: 0.136, // LLM standard ~13.6 sen/km
    minFee: 1.40,
  },
  {
    name: 'Lebuhraya Pantai Timur (LPT 1/2)',
    code: 'E8',
    keywords: ['lpt', 'pantai timur', 'east coast expressway', 'e8'],
    type: 'closed',
    closedRatePerKm: 0.125,
    minFee: 2.50,
  },
  {
    name: 'Lebuhraya Pesisiran Pantai Barat (WCE)',
    code: 'E32',
    keywords: ['wce', 'pesisiran pantai barat', 'west coast expressway', 'e32'],
    type: 'closed',
    closedRatePerKm: 0.139,
    minFee: 1.60,
  },
  {
    name: 'Lebuhraya Lembah Klang Selatan (SKVE)',
    code: 'E26',
    keywords: ['skve', 'south klang valley', 'lembah klang selatan', 'e26'],
    type: 'closed',
    closedRatePerKm: 0.145,
    minFee: 1.30,
  },

  // 2. Open Toll System (Fixed Plaza / Gantry Rates)
  {
    name: 'Maju Expressway (MEX)',
    code: 'E20',
    keywords: ['mex', 'maju expressway', 'e20'],
    type: 'open',
    openRate: 3.50,
  },
  {
    name: 'Lebuhraya Damansara-Puchong (LDP)',
    code: 'E11',
    keywords: ['ldp', 'damansara-puchong', 'litrak', 'e11'],
    type: 'open',
    openRate: 2.10,
  },
  {
    name: 'Duta-Ulu Kelang Expressway (DUKE)',
    code: 'E33',
    keywords: ['duke', 'duta-ulu kelang', 'kesturi', 'e33'],
    type: 'open',
    openRate: 2.50,
  },
  {
    name: 'Lebuhraya Shah Alam (KESAS)',
    code: 'E5',
    keywords: ['kesas', 'shah alam expressway', 'e5'],
    type: 'open',
    openRate: 2.00,
  },
  {
    name: 'New Pantai Expressway (NPE)',
    code: 'E10',
    keywords: ['npe', 'new pantai expressway', 'e10'],
    type: 'open',
    openRate: 2.30,
  },
  {
    name: 'Sistem Penguraian Trafik KL Barat (SPRINT)',
    code: 'E23',
    keywords: ['sprint', 'kerinchi', 'damansara link', 'penchala link', 'e23'],
    type: 'open',
    openRate: 2.50,
  },
  {
    name: 'Kajang SILK Highway',
    code: 'E18',
    keywords: ['silk', 'kajang silk', 'e18'],
    type: 'open',
    openRate: 1.80,
  },
  {
    name: 'Guthrie Corridor Expressway (GCE)',
    code: 'E35',
    keywords: ['gce', 'guthrie', 'e35'],
    type: 'open',
    openRate: 1.90,
  },
  {
    name: 'KL-Kuala Selangor Expressway (LATAR)',
    code: 'E25',
    keywords: ['latar', 'kuala selangor', 'e25'],
    type: 'open',
    openRate: 2.50,
  },
  {
    name: 'Terowong SMART',
    code: 'E38',
    keywords: ['smart', 'smart tunnel', 'terowong smart', 'e38'],
    type: 'open',
    openRate: 3.00,
  },
  {
    name: 'Ampang-Kuala Lumpur Elevated Highway (AKLEH)',
    code: 'E12',
    keywords: ['akleh', 'ampang-kuala lumpur', 'e12'],
    type: 'open',
    openRate: 2.50,
  },
  {
    name: 'Lebuhraya Bertingkat Sungai Besi-Ulu Kelang (SUKE)',
    code: 'E19',
    keywords: ['suke', 'sungai besi-ulu kelang', 'e19'],
    type: 'open',
    openRate: 2.30,
  },
  {
    name: 'Damansara-Shah Alam Elevated Expressway (DASH)',
    code: 'E31',
    keywords: ['dash', 'damansara-shah alam', 'e31'],
    type: 'open',
    openRate: 2.30,
  },
  {
    name: 'Jambatan Pulau Pinang',
    code: 'E36',
    keywords: ['jambatan pulau pinang', 'penang bridge', 'e36'],
    type: 'open',
    openRate: 5.60,
  },
  {
    name: 'Lebuhraya KL-Karak',
    code: 'E8 (Karak)',
    keywords: ['karak', 'kl-karak', 'plaza tol gombak', 'bentong'],
    type: 'open',
    openRate: 6.00,
  },
];

/**
 * Calculates LLM Toll Fares and Itemized Expressway Breakdown from Route Steps
 */
export function calculateLLMTolls(steps: { name: string; distance: number }[]): {
  hasTolls: boolean;
  totalFare: number;
  formattedTotal: string;
  breakdown: TollBreakdownItem[];
} {
  const breakdownMap = new Map<string, TollBreakdownItem>();

  steps.forEach((step) => {
    const roadName = (step.name || '').toLowerCase();
    if (!roadName || roadName === 'unnamed road') return;

    for (const exp of LLM_EXPRESSWAYS) {
      const isMatch = exp.keywords.some((k) => roadName.includes(k));
      if (isMatch) {
        const distKm = step.distance / 1000;
        const existing = breakdownMap.get(exp.code);

        if (existing) {
          existing.distanceKm += distKm;
          if (exp.type === 'closed' && exp.closedRatePerKm) {
            existing.fare = Math.max(exp.minFee || 1.40, Number((existing.distanceKm * exp.closedRatePerKm).toFixed(2)));
          }
        } else {
          let fare = 0;
          if (exp.type === 'open') {
            fare = exp.openRate || 2.00;
          } else if (exp.type === 'closed' && exp.closedRatePerKm) {
            fare = Math.max(exp.minFee || 1.40, Number((distKm * exp.closedRatePerKm).toFixed(2)));
          }

          breakdownMap.set(exp.code, {
            expressway: exp.name,
            code: exp.code,
            distanceKm: distKm,
            fare,
            type: exp.type,
          });
        }
        break; // Match first specific expressway
      }
    }
  });

  const breakdown = Array.from(breakdownMap.values()).map((item) => ({
    ...item,
    distanceKm: Number(item.distanceKm.toFixed(1)),
    fare: Number(item.fare.toFixed(2)),
  }));

  const totalFare = Number(breakdown.reduce((sum, item) => sum + item.fare, 0).toFixed(2));
  const hasTolls = totalFare > 0;

  return {
    hasTolls,
    totalFare,
    formattedTotal: hasTolls ? `RM ${totalFare.toFixed(2)}` : 'Free',
    breakdown,
  };
}
