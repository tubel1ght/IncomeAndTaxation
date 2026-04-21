import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Rect,
  Polygon,
  Line,
  Text as SvgText,
} from 'react-native-svg';
import {
  Parts,
  ConnectorSpec,
  computeSegmentBounds,
  formatCurrency,
} from '../lib/calculations';
import { COLOR_MAP } from '../constants/colors';

interface Props {
  title: string;
  todayParts: Parts;
  futureParts: Parts;
  keepableParts: Parts;
  connectorSpecs: ConnectorSpec[];
  yAxisMax: number;
  isWinner: boolean;
  width?: number;
}

const SVG_HEIGHT = 460;
const PAD_LEFT = 44;
const PAD_RIGHT = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 28;

export function StackedBarChart({
  title,
  todayParts,
  futureParts,
  keepableParts,
  connectorSpecs,
  yAxisMax,
  isWinner,
  width = 340,
}: Props) {
  const chartW = width - PAD_LEFT - PAD_RIGHT;
  const chartH = SVG_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const BAR_W = chartW * 0.175;
  const TODAY_CX = chartW * 0.18;
  const FUTURE_CX = chartW * 0.50;
  const KEEP_CX = chartW * 0.82;

  const todayL = TODAY_CX - BAR_W / 2;
  const todayR = TODAY_CX + BAR_W / 2;
  const futureL = FUTURE_CX - BAR_W / 2;
  const futureR = FUTURE_CX + BAR_W / 2;
  const keepL = KEEP_CX - BAR_W / 2;

  const toY = (v: number) => PAD_TOP + chartH - (v / yAxisMax) * chartH;

  // Unified label ordering across all three bars
  const allLabels = useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    [todayParts, futureParts, keepableParts].forEach((parts) => {
      Object.keys(parts).forEach((l) => {
        if (!seen.has(l)) { seen.add(l); order.push(l); }
      });
    });
    return order;
  }, [todayParts, futureParts, keepableParts]);

  const renderBar = (parts: Parts, xLeft: number, highlightKeep = false) => {
    const els: React.ReactElement[] = [];
    let cum = 0;
    for (const label of allLabels) {
      const val = parts[label] ?? 0;
      if (val <= 0) { cum += val; continue; }
      const y1 = toY(cum + val);
      const y2 = toY(cum);
      const h = y2 - y1;
      const color = COLOR_MAP[label] ?? '#888888';
      const isKeepHighlight = highlightKeep && label in keepableParts && (keepableParts[label] ?? 0) > 0;

      els.push(
        <Rect
          key={`${label}-rect`}
          x={PAD_LEFT + xLeft}
          y={y1}
          width={BAR_W}
          height={h}
          fill={color}
          stroke={isKeepHighlight ? 'rgba(20,20,20,0.85)' : 'rgba(0,0,0,0.2)'}
          strokeWidth={isKeepHighlight ? 2 : 0.5}
          opacity={0.92}
        />,
      );

      if (h >= 14) {
        els.push(
          <SvgText
            key={`${label}-lbl`}
            x={PAD_LEFT + xLeft + BAR_W / 2}
            y={y1 + h / 2}
            textAnchor="middle"
            alignmentBaseline="central"
            fontSize={h >= 22 ? 10 : 8}
            fill="#222222"
          >
            {formatCurrency(val)}
          </SvgText>,
        );
      }
      cum += val;
    }
    return els;
  };

  const trapezoids = useMemo(() => {
    const todayBounds = computeSegmentBounds(todayParts);
    const futureBounds = computeSegmentBounds(futureParts);
    const els: React.ReactElement[] = [];

    for (const spec of connectorSpecs) {
      if (
        !(spec.leftLabel in todayBounds) ||
        !(spec.rightStart in futureBounds) ||
        !(spec.rightEnd in futureBounds)
      ) continue;

      const [leftLow, leftHigh] = todayBounds[spec.leftLabel];
      const [rightLow] = futureBounds[spec.rightStart];
      const [, rightHigh] = futureBounds[spec.rightEnd];

      const lx = PAD_LEFT + todayR;
      const rx = PAD_LEFT + futureL;

      const lTop = toY(leftHigh);
      const lBot = toY(leftLow);
      const rTop = toY(rightHigh);
      const rBot = toY(rightLow);

      const color = COLOR_MAP[spec.leftLabel] ?? '#aaaaaa';

      els.push(
        <Polygon
          key={`trap-${spec.leftLabel}-${spec.rightStart}`}
          points={`${lx},${lTop} ${lx},${lBot} ${rx},${rBot} ${rx},${rTop}`}
          fill={color}
          opacity={0.30}
          stroke="rgba(80,80,80,0.4)"
          strokeWidth={0.8}
        />,
      );
    }

    // Top boundary line
    const totalToday = Object.values(todayParts).reduce((a, b) => a + b, 0);
    const totalFuture = Object.values(futureParts).reduce((a, b) => a + b, 0);
    els.push(
      <Line
        key="top-boundary"
        x1={PAD_LEFT + todayR}
        y1={toY(totalToday)}
        x2={PAD_LEFT + futureL}
        y2={toY(totalFuture)}
        stroke="rgba(80,80,80,0.65)"
        strokeWidth={2}
      />,
    );
    // Bottom boundary line (always at 0)
    els.push(
      <Line
        key="bot-boundary"
        x1={PAD_LEFT + todayR}
        y1={toY(0)}
        x2={PAD_LEFT + futureL}
        y2={toY(0)}
        stroke="rgba(80,80,80,0.25)"
        strokeWidth={1}
      />,
    );

    return els;
  }, [todayParts, futureParts, connectorSpecs, yAxisMax]);

  const refLines = useMemo(() => {
    const els: React.ReactElement[] = [];
    let step = 50_000;
    if (yAxisMax > 2_000_000) step = 250_000;
    else if (yAxisMax > 500_000) step = 100_000;
    let cur = step;
    while (cur <= yAxisMax) {
      const y = toY(cur);
      const lbl = cur >= 1_000_000
        ? `$${(cur / 1_000_000).toFixed(1)}M`
        : `$${(cur / 1_000).toFixed(0)}K`;
      els.push(
        <Line
          key={`rl-${cur}`}
          x1={PAD_LEFT}
          y1={y}
          x2={PAD_LEFT + chartW}
          y2={y}
          stroke="rgba(0,0,0,0.07)"
          strokeWidth={1}
        />,
        <SvgText
          key={`rl-txt-${cur}`}
          x={PAD_LEFT - 3}
          y={y}
          textAnchor="end"
          fontSize={9}
          fill="rgba(0,0,0,0.38)"
          alignmentBaseline="middle"
        >
          {lbl}
        </SvgText>,
      );
      cur += step;
    }
    return els;
  }, [yAxisMax, chartH]);

  return (
    <View style={styles.card}>
      <Text style={[styles.title, isWinner && styles.winnerTitle]}>
        {title}{isWinner ? ' ★' : ''}
      </Text>
      <Svg width={width} height={SVG_HEIGHT} style={styles.svg}>
        {refLines}
        {trapezoids}
        {renderBar(todayParts, todayL)}
        {renderBar(futureParts, futureL)}
        {renderBar(keepableParts, keepL, isWinner)}
        <SvgText x={PAD_LEFT + TODAY_CX} y={SVG_HEIGHT - 8} textAnchor="middle" fontSize={12} fontWeight="600" fill="#444">Today</SvgText>
        <SvgText x={PAD_LEFT + FUTURE_CX} y={SVG_HEIGHT - 8} textAnchor="middle" fontSize={12} fontWeight="600" fill="#444">Future</SvgText>
        <SvgText x={PAD_LEFT + KEEP_CX} y={SVG_HEIGHT - 8} textAnchor="middle" fontSize={12} fontWeight="600" fill="#444">Keep</SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    marginRight: 12,
    paddingBottom: 4,
  },
  svg: {
    backgroundColor: '#fafafa',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 2,
  },
  winnerTitle: {
    color: '#1a7a00',
  },
});
