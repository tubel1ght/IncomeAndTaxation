import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLOR_MAP, LEGEND_ORDER } from '../constants/colors';
import { StrategyResult } from '../lib/calculations';

interface Props {
  strategies: StrategyResult[];
}

export function Legend({ strategies }: Props) {
  const present = new Set<string>();
  strategies.forEach((s) => {
    [s.todayParts, s.futureParts, s.keepableParts].forEach((parts) => {
      Object.keys(parts).forEach((k) => present.add(k));
    });
  });

  const labels = LEGEND_ORDER.filter((l) => present.has(l));
  if (labels.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Legend</Text>
      <View style={styles.grid}>
        {labels.map((label) => (
          <View key={label} style={styles.item}>
            <View style={[styles.swatch, { backgroundColor: COLOR_MAP[label] ?? '#888' }]} />
            <Text style={styles.label}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  heading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '46%',
  },
  swatch: {
    width: 13,
    height: 13,
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.25)',
    flexShrink: 0,
  },
  label: {
    fontSize: 11,
    color: '#444',
    flexShrink: 1,
  },
});
