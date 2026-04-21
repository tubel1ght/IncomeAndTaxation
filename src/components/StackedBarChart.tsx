import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Polygon, Line, Text as SvgText, G } from 'react-native-svg';
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

interface TooltipState {
  label: string;
  value: number;
  svgX: number;   // center of bar in SVG coords
  svgY: number;   // mid of segment in SVG coords
}

const SVG_HEIGHT = 460;
const PAD_LEFT = 44;
const PAD_RIGHT = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 28;

// All connectors use the same muted gray
const CONN_FILL   = 'rgba(90,90,90,0.13)';
const CONN_STROKE = 'rgba(90,90,90,0.50)';
const CONN_SW     = 0.8;

const TOOLTIP_W = 134;
const TOOLTIP_H = 40;

export function StackedBarChart({
  title,
  todayParts,
  futureParts,
  keepableParts,
  connectorSpecs,
  yAxisMax,
  isWinner,
  width = 270,
}: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const chartW = width - PAD_LEFT - PAD_RIGHT;
  const chartH = SVG_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const BAR_W    = chartW * 0.13;
  const TODAY_CX = chartW * 0.18;
  const FUTURE_CX = chartW * 0.50;
  const KEEP_CX  = chartW * 0.82;

  const todayL  = TODAY_CX  - BAR_W / 2;
  const todayR  = TODAY_CX  + BAR_W / 2;
  const futureL = FUTURE_CX - BAR_W / 2;
  const futureR = FUTURE_CX + BAR_W / 2;
  const keepL   = KEEP_CX   - BAR_W / 2;

  const toY = (v: number) => PAD_TOP + chartH - (v / yAxisMax) * chartH;

  const allLabels = useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    [todayParts, futureParts, keepableParts].forEach((parts) =>
      Object.keys(parts).forEach((l) => { if (!seen.has(l)) { seen.add(l); order.push(l); } }),
    );
    return order;
  }, [todayParts, futureParts, keepableParts]);

  // Render one stacked bar column, plus a transparent hover-target rect on top
  const renderBar = (parts: Parts, xLeft: number, cx: number, highlightKeep = false) => {
    const els: React.ReactElement[] = [];
    let cum = 0;
    for (const label of allLabels) {
      const val = parts[label] ?? 0;
      if (val <= 0) { cum += val; continue; }
      const y1 = toY(cum + val);
      const y2 = toY(cum);
      const h  = y2 - y1;
      const color = COLOR_MAP[label] ?? '#888888';
      const isKeepHL = highlightKeep && (keepableParts[label] ?? 0) > 0;

      // Colored segment
      els.push(
        <Rect
          key={`${label}-fill`}
          x={PAD_LEFT + xLeft}
          y={y1}
          width={BAR_W}
          height={h}
          fill={color}
          stroke={isKeepHL ? 'rgba(20,20,20,0.85)' : 'rgba(0,0,0,0.2)'}
          strokeWidth={isKeepHL ? 2 : 0.5}
          opacity={0.92}
        />,
      );

      // Value label (only when tall enough)
      if (h >= 14) {
        els.push(
          <SvgText
            key={`${label}-lbl`}
            x={PAD_LEFT + xLeft + BAR_W / 2}
            y={y1 + h / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={h >= 22 ? 10 : 8}
            fill="#222222"
          >
            {formatCurrency(val)}
          </SvgText>,
        );
      }

      // Transparent interaction rect drawn last (on top of text).
      // onMouseEnter/Leave handles web hover; onPressIn/Out handles mobile tap-and-hold.
      const svgX = PAD_LEFT + cx;
      const svgY = y1 + h / 2;
      els.push(
        <Rect
          key={`${label}-hover`}
          x={PAD_LEFT + xLeft}
          y={y1}
          width={BAR_W}
          height={h}
          fill="transparent"
          {...({
            onMouseEnter: () => setTooltip({ label, value: val, svgX, svgY }),
            onMouseLeave: () => setTooltip(null),
            onPressIn:    () => setTooltip({ label, value: val, svgX, svgY }),
            onPressOut:   () => setTooltip(null),
          } as any)}
        />,
      );

      cum += val;
    }
    return els;
  };

  // Today→Future and Future→Keep trapezoid connectors, all in uniform gray
  const connectorEls = useMemo(() => {
    const todayBounds  = computeSegmentBounds(todayParts);
    const futureBounds = computeSegmentBounds(futureParts);
    const keepBounds   = computeSegmentBounds(keepableParts);
    const els: React.ReactElement[] = [];

    // ── Today → Future ──────────────────────────────────────────────────────
    for (const spec of connectorSpecs) {
      if (
        !(spec.leftLabel  in todayBounds)  ||
        !(spec.rightStart in futureBounds) ||
        !(spec.rightEnd   in futureBounds)
      ) continue;

      const [lLow, lHigh] = todayBounds[spec.leftLabel];
      const [rLow]        = futureBounds[spec.rightStart];
      const [, rHigh]     = futureBounds[spec.rightEnd];

      const lx = PAD_LEFT + todayR;
      const rx = PAD_LEFT + futureL;

      els.push(
        <Polygon
          key={`t2f-${spec.leftLabel}`}
          points={`${lx},${toY(lHigh)} ${lx},${toY(lLow)} ${rx},${toY(rLow)} ${rx},${toY(rHigh)}`}
          fill={CONN_FILL}
          stroke={CONN_STROKE}
          strokeWidth={CONN_SW}
        />,
      );
    }

    // ── Future → Keep ────────────────────────────────────────────────────────
    for (const label of Object.keys(keepableParts)) {
      if (!(label in futureBounds)) continue;
      const [fLow, fHigh] = futureBounds[label];
      const [kLow, kHigh] = keepBounds[label];

      const lx = PAD_LEFT + futureR;
      const rx = PAD_LEFT + keepL;

      els.push(
        <Polygon
          key={`f2k-${label}`}
          points={`${lx},${toY(fHigh)} ${lx},${toY(fLow)} ${rx},${toY(kLow)} ${rx},${toY(kHigh)}`}
          fill={CONN_FILL}
          stroke={CONN_STROKE}
          strokeWidth={CONN_SW}
        />,
      );
    }

    // Top boundary lines
    const totT = Object.values(todayParts).reduce((a, b)  => a + b, 0);
    const totF = Object.values(futureParts).reduce((a, b) => a + b, 0);
    const totK = Object.values(keepableParts).reduce((a, b) => a + b, 0);

    els.push(
      <Line key="top-t2f" x1={PAD_LEFT + todayR}  y1={toY(totT)} x2={PAD_LEFT + futureL} y2={toY(totF)} stroke={CONN_STROKE} strokeWidth={CONN_SW} />,
      <Line key="top-f2k" x1={PAD_LEFT + futureR} y1={toY(totF)} x2={PAD_LEFT + keepL}   y2={toY(totK)} stroke={CONN_STROKE} strokeWidth={CONN_SW} />,
    );

    return els;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayParts, futureParts, keepableParts, connectorSpecs, yAxisMax, width]);

  const refLineEls = useMemo(() => {
    const els: React.ReactElement[] = [];
    let step = 50_000;
    if (yAxisMax > 2_000_000) step = 250_000;
    else if (yAxisMax > 500_000) step = 100_000;
    let cur = step;
    while (cur <= yAxisMax) {
      const y   = toY(cur);
      const lbl = cur >= 1_000_000
        ? `$${(cur / 1_000_000).toFixed(1)}M`
        : `$${(cur / 1_000).toFixed(0)}K`;
      els.push(
        <Line        key={`rl-${cur}`}     x1={PAD_LEFT} y1={y} x2={PAD_LEFT + chartW} y2={y} stroke="rgba(0,0,0,0.07)" strokeWidth={1} />,
        <SvgText     key={`rl-txt-${cur}`} x={PAD_LEFT - 3} y={y} textAnchor="end" fontSize={9} fill="rgba(0,0,0,0.38)" dominantBaseline="middle">{lbl}</SvgText>,
      );
      cur += step;
    }
    return els;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yAxisMax, width]);

  // Tooltip overlay
  const tooltipEl = tooltip ? (() => {
    const tx = Math.min(
      Math.max(tooltip.svgX - TOOLTIP_W / 2, PAD_LEFT),
      width - PAD_RIGHT - TOOLTIP_W,
    );
    const ty = Math.max(PAD_TOP + 2, tooltip.svgY - TOOLTIP_H - 6);
    return (
      <G key="tooltip" pointerEvents="none">
        <Rect x={tx} y={ty} width={TOOLTIP_W} height={TOOLTIP_H} rx={5} fill="rgba(25,25,25,0.88)" />
        <SvgText x={tx + TOOLTIP_W / 2} y={ty + 12} textAnchor="middle" dominantBaseline="middle" fontSize={9}  fill="#cccccc">{tooltip.label}</SvgText>
        <SvgText x={tx + TOOLTIP_W / 2} y={ty + 28} textAnchor="middle" dominantBaseline="middle" fontSize={12} fontWeight="bold" fill="#ffffff">{formatCurrency(tooltip.value)}</SvgText>
      </G>
    );
  })() : null;

  return (
    <View style={styles.card}>
      <Text style={[styles.title, isWinner && styles.winnerTitle]}>
        {title}{isWinner ? ' ★' : ''}
      </Text>
      <Svg width={width} height={SVG_HEIGHT} style={styles.svg}>
        {refLineEls}
        {connectorEls}
        {renderBar(todayParts,    todayL,  TODAY_CX)}
        {renderBar(futureParts,   futureL, FUTURE_CX)}
        {renderBar(keepableParts, keepL,   KEEP_CX, isWinner)}
        <SvgText x={PAD_LEFT + TODAY_CX}  y={SVG_HEIGHT - 8} textAnchor="middle" dominantBaseline="middle" fontSize={12} fontWeight="600" fill="#444">Today</SvgText>
        <SvgText x={PAD_LEFT + FUTURE_CX} y={SVG_HEIGHT - 8} textAnchor="middle" dominantBaseline="middle" fontSize={12} fontWeight="600" fill="#444">Future</SvgText>
        <SvgText x={PAD_LEFT + KEEP_CX}   y={SVG_HEIGHT - 8} textAnchor="middle" dominantBaseline="middle" fontSize={12} fontWeight="600" fill="#444">Keep</SvgText>
        {tooltipEl}
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
