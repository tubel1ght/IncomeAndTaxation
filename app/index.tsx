import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Platform,
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

  const yMax = useMemo(() => computeGlobalYMax(strategies), [strategies]);
  const winner = useMemo(() => getWinningStrategy(strategies), [strategies]);

  const CHART_WIDTH = isWide ? Math.floor((width - 48) / Math.min(strategies.length, 3)) - 16 : 330;

  const pct = (v: number) => `${v.toFixed(0)}%`;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* ── Inputs ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inputs</Text>

        <View style={[styles.inputGrid, isWide && styles.inputGridWide]}>
          <View style={styles.inputCol}>
            <SliderInput label="Gross Income" value={inputs.income} min={0} max={1_000_000} step={1_000} onChange={set('income')} />
            <SliderInput label="Annual Expenses" value={inputs.expenses} min={0} max={inputs.income} step={1_000} onChange={set('expenses')} />
          </View>
          <View style={styles.inputCol}>
            <SliderInput label="Current Tax Rate" value={inputs.currentTaxRate} min={0} max={50} step={1} format={pct} onChange={set('currentTaxRate')} />
            <SliderInput label="Future Tax Rate" value={inputs.futureTaxRate} min={0} max={50} step={1} format={pct} onChange={set('futureTaxRate')} />
          </View>
          <View style={styles.inputCol}>
            <SliderInput label="Annual Return" value={inputs.investmentRate} min={0} max={15} step={0.5} format={pct} onChange={set('investmentRate')} />
            <SliderInput label="Years Invested" value={inputs.years} min={1} max={40} step={1} format={(v) => `${v} yrs`} onChange={set('years')} />
          </View>
          <View style={styles.inputCol}>
            <SliderInput label="Regular 401(k) Limit" value={inputs.regular401kLimit} min={0} max={30_000} step={500} onChange={set('regular401kLimit')} />
            <SliderInput label="Roth 401(k) Limit" value={inputs.roth401kLimit} min={0} max={30_000} step={500} onChange={set('roth401kLimit')} />
          </View>
          <View style={styles.inputCol}>
            <SliderInput label="Backdoor Roth Limit" value={inputs.rothBackdoorLimit} min={0} max={90_000} step={1_000} onChange={set('rothBackdoorLimit')} />
            <SliderInput label="Capital Gains Tax" value={inputs.capitalGainsTaxRate} min={0} max={30} step={1} format={pct} onChange={set('capitalGainsTaxRate')} />
          </View>
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
            <Text style={styles.subtitle}>
              The starred (★) strategy has the highest keepable amount.
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
                  width={CHART_WIDTH}
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
    gap: 12,
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
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  inputGrid: {
    gap: 4,
    marginBottom: 14,
  },
  inputGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  inputCol: {
    flex: 1,
    minWidth: 280,
  },
  chartsRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    gap: 0,
  },
  empty: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
