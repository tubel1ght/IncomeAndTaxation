import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}

function defaultFormat(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return v % 1 === 0 ? `${v}` : `${v.toFixed(1)}`;
}

export function SliderInput({ label, value, min, max, step, format, onChange }: Props) {
  const display = format ? format(value) : defaultFormat(value);
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{display}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="#4A90D9"
        maximumTrackTintColor="#D0D0D0"
        thumbTintColor="#4A90D9"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    color: '#555',
    flex: 1,
    flexShrink: 1,
  },
  value: {
    fontSize: 12,
    fontWeight: '700',
    color: '#222',
    marginLeft: 6,
    minWidth: 60,
    textAlign: 'right',
  },
  slider: {
    width: '100%',
    height: 32,
  },
});
