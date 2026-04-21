export interface StrategyInputs {
  income: number;
  expenses: number;
  currentTaxRate: number;
  futureTaxRate: number;
  investmentRate: number;
  years: number;
  regular401kLimit: number;
  roth401kLimit: number;
  rothBackdoorLimit: number;
  capitalGainsTaxRate: number;
}

export type Parts = Record<string, number>;

export interface ConnectorSpec {
  leftLabel: string;
  rightStart: string;
  rightEnd: string;
}

export interface StrategyResult {
  title: string;
  todayParts: Parts;
  futureParts: Parts;
  keepableParts: Parts;
  connectorSpecs: ConnectorSpec[];
}

function fv(principal: number, rate: number, years: number): number {
  return principal * Math.pow(1 + rate / 100, years);
}

export function computeBaseline(i: StrategyInputs): StrategyResult {
  const incomeTax = i.income * i.currentTaxRate / 100;
  const afterTax = i.income - incomeTax;
  const principal = Math.max(afterTax - i.expenses, 0);
  const futureVal = fv(principal, i.investmentRate, i.years);
  const growth = Math.max(futureVal - principal, 0);
  const growthTax = growth * i.capitalGainsTaxRate / 100;
  const growthAfterTax = growth - growthTax;

  return {
    title: 'Baseline',
    todayParts: {
      'Regular Income Tax': incomeTax,
      'Expenses': i.expenses,
      'Investment Principal': principal,
    },
    futureParts: {
      'Regular Income Tax': incomeTax,
      'Expenses': i.expenses,
      'Investment Principal': principal,
      'Investment Growth Tax': growthTax,
      'Investment Growth AfterTax': growthAfterTax,
    },
    keepableParts: {
      'Investment Principal': principal,
      'Investment Growth AfterTax': growthAfterTax,
    },
    connectorSpecs: [
      { leftLabel: 'Regular Income Tax', rightStart: 'Regular Income Tax', rightEnd: 'Regular Income Tax' },
      { leftLabel: 'Expenses', rightStart: 'Expenses', rightEnd: 'Expenses' },
      { leftLabel: 'Investment Principal', rightStart: 'Investment Principal', rightEnd: 'Investment Growth AfterTax' },
    ],
  };
}

export function computeRegular401k(i: StrategyInputs): StrategyResult {
  const contrib = Math.max(Math.min(i.regular401kLimit, i.income - i.expenses), 0);
  const taxable = i.income - contrib;
  const incomeTax = taxable * i.currentTaxRate / 100;
  const afterTax = taxable - incomeTax;
  const principal = Math.max(afterTax - i.expenses, 0);

  const futureVal = fv(principal, i.investmentRate, i.years);
  const growth = Math.max(futureVal - principal, 0);
  const growthTax = growth * i.capitalGainsTaxRate / 100;
  const growthAfterTax = growth - growthTax;

  const r401kFV = fv(contrib, i.investmentRate, i.years);
  const r401kTax = r401kFV * i.futureTaxRate / 100;
  const r401kAfterTax = r401kFV - r401kTax;

  return {
    title: 'Regular 401K',
    todayParts: {
      'Regular Income Tax': incomeTax,
      'Expenses': i.expenses,
      'Investment Principal': principal,
      'Regular401K Contribution': contrib,
    },
    futureParts: {
      'Regular Income Tax': incomeTax,
      'Expenses': i.expenses,
      'Investment Principal': principal,
      'Investment Growth Tax': growthTax,
      'Investment Growth AfterTax': growthAfterTax,
      'Regular401K Tax': r401kTax,
      'Regular401K AfterTax': r401kAfterTax,
    },
    keepableParts: {
      'Investment Principal': principal,
      'Investment Growth AfterTax': growthAfterTax,
      'Regular401K AfterTax': r401kAfterTax,
    },
    connectorSpecs: [
      { leftLabel: 'Regular Income Tax', rightStart: 'Regular Income Tax', rightEnd: 'Regular Income Tax' },
      { leftLabel: 'Expenses', rightStart: 'Expenses', rightEnd: 'Expenses' },
      { leftLabel: 'Investment Principal', rightStart: 'Investment Principal', rightEnd: 'Investment Growth AfterTax' },
      { leftLabel: 'Regular401K Contribution', rightStart: 'Regular401K Tax', rightEnd: 'Regular401K AfterTax' },
    ],
  };
}

export function computeRoth401k(i: StrategyInputs): StrategyResult {
  const incomeTax = i.income * i.currentTaxRate / 100;
  const afterTax = i.income - incomeTax;
  const contrib = Math.max(Math.min(i.roth401kLimit, afterTax - i.expenses), 0);
  const principal = afterTax - i.expenses - contrib;

  const futureVal = fv(principal, i.investmentRate, i.years);
  const growth = Math.max(futureVal - principal, 0);
  const growthTax = growth * i.capitalGainsTaxRate / 100;
  const growthAfterTax = growth - growthTax;
  const rothFV = fv(contrib, i.investmentRate, i.years);

  return {
    title: 'Roth 401K',
    todayParts: {
      'Regular Income Tax': incomeTax,
      'Expenses': i.expenses,
      'Investment Principal': principal,
      'Roth401K Contribution': contrib,
    },
    futureParts: {
      'Regular Income Tax': incomeTax,
      'Expenses': i.expenses,
      'Investment Principal': principal,
      'Investment Growth Tax': growthTax,
      'Investment Growth AfterTax': growthAfterTax,
      'Roth401K AfterTax': rothFV,
    },
    keepableParts: {
      'Investment Principal': principal,
      'Investment Growth AfterTax': growthAfterTax,
      'Roth401K AfterTax': rothFV,
    },
    connectorSpecs: [
      { leftLabel: 'Regular Income Tax', rightStart: 'Regular Income Tax', rightEnd: 'Regular Income Tax' },
      { leftLabel: 'Expenses', rightStart: 'Expenses', rightEnd: 'Expenses' },
      { leftLabel: 'Investment Principal', rightStart: 'Investment Principal', rightEnd: 'Investment Growth AfterTax' },
      { leftLabel: 'Roth401K Contribution', rightStart: 'Roth401K AfterTax', rightEnd: 'Roth401K AfterTax' },
    ],
  };
}

export function computeRegular401kBackdoor(i: StrategyInputs): StrategyResult {
  const contrib = Math.max(Math.min(i.regular401kLimit, i.income - i.expenses), 0);
  const taxable = i.income - contrib;
  const incomeTax = taxable * i.currentTaxRate / 100;
  const afterTax = taxable - incomeTax;
  const cashAfterExp = Math.max(afterTax - i.expenses, 0);
  const backdoorContrib = Math.min(i.rothBackdoorLimit - contrib, cashAfterExp);
  const principal = Math.max(cashAfterExp - backdoorContrib, 0);

  const futureVal = fv(principal, i.investmentRate, i.years);
  const growth = Math.max(futureVal - principal, 0);
  const growthTax = growth * i.capitalGainsTaxRate / 100;
  const growthAfterTax = growth - growthTax;

  const r401kFV = fv(contrib, i.investmentRate, i.years);
  const r401kTax = r401kFV * i.futureTaxRate / 100;
  const r401kAfterTax = r401kFV - r401kTax;
  const backdoorFV = fv(backdoorContrib, i.investmentRate, i.years);

  return {
    title: 'Regular 401K + Backdoor Roth',
    todayParts: {
      'Regular Income Tax': incomeTax,
      'Expenses': i.expenses,
      'Investment Principal': principal,
      'Regular401K Contribution': contrib,
      'BackdoorRoth Contribution': backdoorContrib,
    },
    futureParts: {
      'Regular Income Tax': incomeTax,
      'Expenses': i.expenses,
      'Investment Principal': principal,
      'Investment Growth Tax': growthTax,
      'Investment Growth AfterTax': growthAfterTax,
      'Regular401K Tax': r401kTax,
      'Regular401K AfterTax': r401kAfterTax,
      'BackdoorRoth AfterTax': backdoorFV,
    },
    keepableParts: {
      'Investment Principal': principal,
      'Investment Growth AfterTax': growthAfterTax,
      'Regular401K AfterTax': r401kAfterTax,
      'BackdoorRoth AfterTax': backdoorFV,
    },
    connectorSpecs: [
      { leftLabel: 'Regular Income Tax', rightStart: 'Regular Income Tax', rightEnd: 'Regular Income Tax' },
      { leftLabel: 'Expenses', rightStart: 'Expenses', rightEnd: 'Expenses' },
      { leftLabel: 'Investment Principal', rightStart: 'Investment Principal', rightEnd: 'Investment Growth AfterTax' },
      { leftLabel: 'Regular401K Contribution', rightStart: 'Regular401K Tax', rightEnd: 'Regular401K AfterTax' },
      { leftLabel: 'BackdoorRoth Contribution', rightStart: 'BackdoorRoth AfterTax', rightEnd: 'BackdoorRoth AfterTax' },
    ],
  };
}

export function computeRoth401kBackdoor(i: StrategyInputs): StrategyResult {
  const incomeTax = i.income * i.currentTaxRate / 100;
  const afterTax = i.income - incomeTax;
  const contrib = Math.max(Math.min(i.roth401kLimit, afterTax - i.expenses), 0);
  const cashAfterExpAndRoth = Math.max(afterTax - i.expenses - contrib, 0);
  const backdoorContrib = Math.min(i.rothBackdoorLimit - contrib, cashAfterExpAndRoth);
  const principal = Math.max(cashAfterExpAndRoth - backdoorContrib, 0);

  const futureVal = fv(principal, i.investmentRate, i.years);
  const growth = Math.max(futureVal - principal, 0);
  const growthTax = growth * i.capitalGainsTaxRate / 100;
  const growthAfterTax = growth - growthTax;
  const rothFV = fv(contrib, i.investmentRate, i.years);
  const backdoorFV = fv(backdoorContrib, i.investmentRate, i.years);

  return {
    title: 'Roth 401K + Backdoor Roth',
    todayParts: {
      'Regular Income Tax': incomeTax,
      'Expenses': i.expenses,
      'Investment Principal': principal,
      'Roth401K Contribution': contrib,
      'BackdoorRoth Contribution': backdoorContrib,
    },
    futureParts: {
      'Regular Income Tax': incomeTax,
      'Expenses': i.expenses,
      'Investment Principal': principal,
      'Investment Growth Tax': growthTax,
      'Investment Growth AfterTax': growthAfterTax,
      'Roth401K AfterTax': rothFV,
      'BackdoorRoth AfterTax': backdoorFV,
    },
    keepableParts: {
      'Investment Principal': principal,
      'Investment Growth AfterTax': growthAfterTax,
      'Roth401K AfterTax': rothFV,
      'BackdoorRoth AfterTax': backdoorFV,
    },
    connectorSpecs: [
      { leftLabel: 'Regular Income Tax', rightStart: 'Regular Income Tax', rightEnd: 'Regular Income Tax' },
      { leftLabel: 'Expenses', rightStart: 'Expenses', rightEnd: 'Expenses' },
      { leftLabel: 'Investment Principal', rightStart: 'Investment Principal', rightEnd: 'Investment Growth AfterTax' },
      { leftLabel: 'Roth401K Contribution', rightStart: 'Roth401K AfterTax', rightEnd: 'Roth401K AfterTax' },
      { leftLabel: 'BackdoorRoth Contribution', rightStart: 'BackdoorRoth AfterTax', rightEnd: 'BackdoorRoth AfterTax' },
    ],
  };
}

export const ALL_STRATEGY_TITLES = [
  'Baseline',
  'Regular 401K',
  'Roth 401K',
  'Regular 401K + Backdoor Roth',
  'Roth 401K + Backdoor Roth',
] as const;

export function computeAllStrategies(
  inputs: StrategyInputs,
  active: string[],
): StrategyResult[] {
  const all = [
    computeBaseline(inputs),
    computeRegular401k(inputs),
    computeRoth401k(inputs),
    computeRegular401kBackdoor(inputs),
    computeRoth401kBackdoor(inputs),
  ];
  return all.filter((s) => active.includes(s.title));
}

export function computeGlobalYMax(strategies: StrategyResult[]): number {
  if (strategies.length === 0) return 1;
  const totals = strategies.flatMap((s) => [
    Object.values(s.todayParts).reduce((a, b) => a + b, 0),
    Object.values(s.futureParts).reduce((a, b) => a + b, 0),
    Object.values(s.keepableParts).reduce((a, b) => a + b, 0),
  ]);
  return Math.max(...totals) * 1.05;
}

export function getWinningStrategy(strategies: StrategyResult[]): string | null {
  if (strategies.length === 0) return null;
  return strategies.reduce((best, s) => {
    const keepTotal = Object.values(s.keepableParts).reduce((a, b) => a + b, 0);
    const bestTotal = Object.values(best.keepableParts).reduce((a, b) => a + b, 0);
    return keepTotal > bestTotal ? s : best;
  }, strategies[0]).title;
}

export function computeSegmentBounds(parts: Parts): Record<string, [number, number]> {
  const bounds: Record<string, [number, number]> = {};
  let cum = 0;
  for (const [label, value] of Object.entries(parts)) {
    bounds[label] = [cum, cum + value];
    cum += value;
  }
  return bounds;
}

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}
