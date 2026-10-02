import type { TollBreakdownItem } from '../models/navigation.js';

/**
 * Lembaga Lebuhraya Malaysia (LLM) Gazetted Toll Database & Calculator (Class 1 Passenger Car)
 */
interface ExpresswayDef {
  name: string;
  code: string;
  patterns: RegExp[];
  type: 'open' | 'closed';
  openRate?: number; // Flat fee per gantry (RM)
  closedRatePerKm?: number; // Rate per km (RM/km)
  minFee?: number;
}

const LLM_EXPRESSWAYS: ExpresswayDef[] = [
  // 1. Closed Toll System (Distance-based)
  {
    name: 'Lebuhraya Utara-Selatan (PLUS)',
    code: 'PLUS (E1/E2)',
    patterns: [/\be1\b/i, /\be2\b/i, /plus/i, /utara[-–\s]selatan/i, /north[-–\s]south/i, /\bah2\b/i],
    type: 'closed',
    closedRatePerKm: 0.136, // ~13.6 sen/km
    minFee: 1.40,
  },
  {
    name: 'Lebuhraya Hubungan Tengah (ELITE)',
    code: 'ELITE (E6)',
    patterns: [/\be6\b/i, /elite/i, /hubungan\s*tengah/i],
    type: 'closed',
    closedRatePerKm: 0.142,
    minFee: 1.40,
  },
  {
    name: 'Lebuhraya Seremban-Port Dickson (SPDH)',
    code: 'SPDH (E29)',
    patterns: [/\be29\b/i, /spdh/i, /seremban[-–\s]port\s*dickson/i],
    type: 'open',
    openRate: 3.20, // Total Mambau (RM 1.60) + Lukut (RM 1.60)
  },
  {
    name: 'Lebuhraya Pantai Timur (LPT 1/2)',
    code: 'LPT (E8)',
    patterns: [/\be8\b/i, /lpt/i, /pantai\s*timur/i, /east\s*coast/i],
    type: 'closed',
    closedRatePerKm: 0.125,
    minFee: 2.50,
  },
  {
    name: 'Lebuhraya Pesisiran Pantai Barat (WCE)',
    code: 'WCE (E32)',
    patterns: [/\be32\b/i, /wce/i, /pesisiran\s*pantai\s*barat/i, /west\s*coast/i],
    type: 'closed',
    closedRatePerKm: 0.139,
    minFee: 1.60,
  },
  {
    name: 'Lebuhraya Lembah Klang Selatan (SKVE)',
    code: 'SKVE (E26)',
    patterns: [/\be26\b/i, /skve/i, /lembah\s*klang\s*selatan/i, /south\s*klang\s*valley/i],
    type: 'closed',
    closedRatePerKm: 0.145,
    minFee: 1.30,
  },

  // 2. Open Toll System (Fixed Plaza / Gantry Rates)
  {
    name: 'Maju Expressway (MEX)',
    code: 'MEX (E20)',
    patterns: [/\be20\b/i, /mex/i, /maju\s*expressway/i],
    type: 'open',
    openRate: 3.50,
  },
  {
    name: 'Lebuhraya Damansara-Puchong (LDP)',
    code: 'LDP (E11)',
    patterns: [/\be11\b/i, /ldp/i, /damansara[-–\s]puchong/i, /litrak/i],
    type: 'open',
    openRate: 2.10,
  },
  {
    name: 'Duta-Ulu Kelang Expressway (DUKE)',
    code: 'DUKE (E33)',
    patterns: [/\be33\b/i, /duke/i, /duta[-–\s]ulu\s*kelang/i, /kesturi/i],
    type: 'open',
    openRate: 2.50,
  },
  {
    name: 'Lebuhraya Shah Alam (KESAS)',
    code: 'KESAS (E5)',
    patterns: [/\be5\b/i, /kesas/i, /shah\s*alam\s*expressway/i],
    type: 'open',
    openRate: 2.00,
  },
  {
    name: 'New Pantai Expressway (NPE)',
    code: 'NPE (E10)',
    patterns: [/\be10\b/i, /npe/i, /new\s*pantai/i, /pantai\s*baru/i],
    type: 'open',
    openRate: 2.30,
  },
  {
    name: 'Sistem Penguraian Trafik KL Barat (SPRINT)',
    code: 'SPRINT (E23)',
    patterns: [/\be23\b/i, /sprint/i, /kerinchi/i, /damansara\s*link/i, /penchala\s*link/i],
    type: 'open',
    openRate: 2.50,
  },
  {
    name: 'Kajang SILK Highway',
    code: 'SILK (E18)',
    patterns: [/\be18\b/i, /silk/i, /kajang\s*silk/i],
    type: 'open',
    openRate: 1.80,
  },
  {
    name: 'Guthrie Corridor Expressway (GCE)',
    code: 'GCE (E35)',
    patterns: [/\be35\b/i, /gce/i, /guthrie/i],
    type: 'open',
    openRate: 1.90,
  },
  {
    name: 'KL-Kuala Selangor Expressway (LATAR)',
    code: 'LATAR (E25)',
    patterns: [/\be25\b/i, /latar/i, /kuala\s*selangor/i],
    type: 'open',
    openRate: 2.50,
  },
  {
    name: 'Terowong SMART',
    code: 'SMART (E38)',
    patterns: [/\be38\b/i, /smart/i, /terowong\s*smart/i],
    type: 'open',
    openRate: 3.00,
  },
  {
    name: 'Ampang-KL Elevated Highway (AKLEH)',
    code: 'AKLEH (E12)',
    patterns: [/\be12\b/i, /akleh/i, /ampang[-–\s]kuala\s*lumpur/i],
    type: 'open',
    openRate: 2.50,
  },
  {
    name: 'Lebuhraya Bertingkat Sungai Besi-Ulu Kelang (SUKE)',
    code: 'SUKE (E19)',
    patterns: [/\be19\b/i, /suke/i, /sungai\s*besi[-–\s]ulu\s*kelang/i],
    type: 'open',
    openRate: 2.30,
  },
  {
    name: 'Damansara-Shah Alam Elevated Expressway (DASH)',
    code: 'DASH (E31)',
    patterns: [/\be31\b/i, /dash/i, /damansara[-–\s]shah\s*alam/i],
    type: 'open',
    openRate: 2.30,
  },
  {
    name: 'Jambatan Pulau Pinang',
    code: 'Penang Bridge (E36)',
    patterns: [/\be36\b/i, /jambatan\s*pulau\s*pinang/i, /penang\s*bridge/i],
    type: 'open',
    openRate: 5.60,
  },
  {
    name: 'Lebuhraya KL-Karak',
    code: 'KL-Karak (E8)',
    patterns: [/karak/i, /kl[-–\s]karak/i, /plaza\s*tol\s*gombak/i, /bentong/i],
    type: 'open',
    openRate: 6.00,
  },
];

/**
 * Calculates LLM Toll Fares and Itemized Expressway Breakdown from Route Steps
 */
export function calculateLLMTolls(steps: { name?: string; ref?: string; distance: number }[]): {
  hasTolls: boolean;
  totalFare: number;
  formattedTotal: string;
  breakdown: TollBreakdownItem[];
} {
  const breakdownMap = new Map<string, TollBreakdownItem>();

  steps.forEach((step) => {
    // Normalize string: convert Unicode en-dash, em-dash to hyphen
    const nameStr = (step.name || '').replace(/[\u2010-\u2015]/g, '-').toLowerCase();
    const refStr = (step.ref || '').replace(/[\u2010-\u2015]/g, '-').toLowerCase();
    const combined = `${nameStr} ${refStr}`.trim();

    if (!combined) return;

    for (const exp of LLM_EXPRESSWAYS) {
      const isMatch = exp.patterns.some((regex) => regex.test(combined));
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
        break; // Matched primary expressway
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
