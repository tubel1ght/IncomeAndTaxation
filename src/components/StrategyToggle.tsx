import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ALL_STRATEGY_TITLES } from '../lib/calculations';

interface Props {
  active: string[];
  onChange: (active: string[]) => void;
}

export function StrategyToggle({ active, onChange }: Props) {
  const toggle = (title: string) => {
    if (active.includes(title)) {
      if (active.length === 1) return; // keep at least one
      onChange(active.filter((t) => t !== title));
    } else {
      onChange([...active, title]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Strategies</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
        {ALL_STRATEGY_TITLES.map((title) => {
          const on = active.includes(title);
          return (
            <TouchableOpacity
              key={title}
              style={[styles.pill, on && styles.pillActive]}
              onPress={() => toggle(title)}
              activeOpacity={0.75}
            >
              <Text style={[styles.pillText, on && styles.pillTextActive]}>{title}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  pills: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 12,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#C0C0C0',
    backgroundColor: '#F5F5F5',
  },
  pillActive: {
    borderColor: '#4A90D9',
    backgroundColor: '#4A90D9',
  },
  pillText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});
