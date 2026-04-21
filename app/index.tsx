import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SliderInput } from '../src/components/SliderInput';
import { StrategyToggle } from '../src/components/StrategyToggle';
import { StackedBarChart } from '../src/components/StackedBarChart';
import { Legend } from '../src/components/Legend';
import {
  StrategyInputs,
  computeAllStrategies,
  computeGlobalYMax,
  getWinningStrategy,
  ALL_STRATEGY_TITLES,
} from '../src/lib/calculations';

const DEFAULT_INPUTS: StrategyInputs = {
  income: 200_000,
  expenses: 100_000,
  currentTaxRate: 30,
  futureTaxRate: 25,
  investmentRate: 10,
  years: 14,
  regular401kLimit: 23_000,
  roth401kLimit: 23_000,
  rothBackdoorLimit: 70_000,
  capitalGainsTaxRate: 20,
};

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isWide = width > 768;

  const [inputs, setInputs] = useState<StrategyInputs>(DEFAULT_INPUTS);
  const [activeStrategies, setActiveStrategies] = useState<string[]>([...ALL_STRATEGY_TITLES]);

  const set = (key: keyof StrategyInputs) => (val: number) =>
    setInputs((prev) => ({ ...prev, [key]: val }));

  const strategies = useMemo(
    () => computeAllStrategies(inputs, activeStrategies),
    [inputs, activeStrategies],
  );

  const yMax    = useMemo(() => computeGlobalYMax(strategies), [strategies]);
  const winner  = useMemo(() => getWinningStrategy(strategies), [strategies]);

  // Size charts to fill available width without requiring horizontal scroll on desktop
  const chartWidth = isWide && strategies.length > 0
    ? Math.min(310, Math.max(200, Math.floor((width - 52) / strategies.length) - 14))
    : 290;

  const pct = (v: number) => `${v.toFixed(0)}%`;
  const yrs = (v: number) => `${v} yrs`;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* ── Subtitle ── */}
      <View style={styles.subtitleCard}>
        <Text style={styles.subtitleText}>
          Every dollar is taxed once — no more, no less.{'\n'}But you can control <Text style={styles.subtitleEmphasis}>when</Text> and at <Text style={styles.subtitleEmphasis}>what rate</Text>.
        </Text>
      </View>

      {/* ── Inputs ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inputs</Text>

        {/* Sliders always stacked vertically in a single column */}
        <View style={styles.sliderList}>
          <SliderInput label="Gross Income"           value={inputs.income}              min={0}       max={1_000_000} step={1_000} onChange={set('income')} />
          <SliderInput label="Annual Expenses"        value={inputs.expenses}            min={0}       max={inputs.income} step={1_000} onChange={set('expenses')} />
          <SliderInput label="Current Tax Rate"       value={inputs.currentTaxRate}      min={0}       max={50}     step={1}     format={pct} onChange={set('currentTaxRate')} />
          <SliderInput label="Future Tax Rate"        value={inputs.futureTaxRate}       min={0}       max={50}     step={1}     format={pct} onChange={set('futureTaxRate')} />
          <SliderInput label="Annual Return"          value={inputs.investmentRate}      min={0}       max={15}     step={0.5}   format={pct} onChange={set('investmentRate')} />
          <SliderInput label="Years Invested"         value={inputs.years}               min={1}       max={40}     step={1}     format={yrs} onChange={set('years')} />
          <SliderInput label="Regular 401(k) Limit"  value={inputs.regular401kLimit}    min={0}       max={30_000} step={500}   onChange={set('regular401kLimit')} />
          <SliderInput label="Roth 401(k) Limit"     value={inputs.roth401kLimit}       min={0}       max={30_000} step={500}   onChange={set('roth401kLimit')} />
          <SliderInput label="Backdoor Roth Limit"   value={inputs.rothBackdoorLimit}   min={0}       max={90_000} step={1_000} onChange={set('rothBackdoorLimit')} />
          <SliderInput label="Capital Gains Tax"     value={inputs.capitalGainsTaxRate} min={0}       max={30}     step={1}     format={pct} onChange={set('capitalGainsTaxRate')} />
        </View>

        <StrategyToggle active={activeStrategies} onChange={setActiveStrategies} />
      </View>

      {/* ── Charts ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Charts</Text>
        {strategies.length === 0 ? (
          <Text style={styles.empty}>Select at least one strategy above.</Text>
        ) : (
          <>
            <Text style={styles.chartSubtitle}>
              Starred (★) strategy keeps the most after tax.
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chartsRow}
            >
              {strategies.map((s) => (
                <StackedBarChart
                  key={s.title}
                  title={s.title}
                  todayParts={s.todayParts}
                  futureParts={s.futureParts}
                  keepableParts={s.keepableParts}
                  connectorSpecs={s.connectorSpecs}
                  yAxisMax={yMax}
                  isWinner={s.title === winner}
                  width={chartWidth}
                />
              ))}
            </ScrollView>
          </>
        )}
      </View>

      {/* ── Legend ── */}
      {strategies.length > 0 && (
        <View style={styles.section}>
          <Legend strategies={strategies} />
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#f2f4f7',
  },
  content: {
    padding: 12,
    paddingBottom: 40,
    gap: 10,
  },
  subtitleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90D9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  subtitleText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
  subtitleEmphasis: {
    fontWeight: '700',
    color: '#1a1a1a',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  sliderList: {
    marginBottom: 14,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  chartsRow: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  empty: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
