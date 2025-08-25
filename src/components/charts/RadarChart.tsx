import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText, G } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface RadarData {
  label: string;
  value: number;
  maxValue: number;
}

interface RadarChartProps {
  data: RadarData[];
  title?: string;
}

export function RadarChart({ data, title = 'Analyse des Compétences' }: RadarChartProps): React.ReactElement {
  const chartSize = Math.min(width - 64, 280);
  const center = chartSize / 2;
  const radius = chartSize / 2 - 40;
  const levels = 5;

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.chartContainer}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
            Pas de données disponibles
          </Text>
        </View>
      </View>
    );
  }

  const angleStep = (Math.PI * 2) / data.length;

  const getPointCoordinates = (value: number, maxValue: number, index: number) => {
    const normalizedValue = (value / maxValue) * radius;
    const angle = index * angleStep - Math.PI / 2;
    return {
      x: center + normalizedValue * Math.cos(angle),
      y: center + normalizedValue * Math.sin(angle),
    };
  };

  const polygonPoints = data.map((item, index) => {
    const point = getPointCoordinates(item.value, item.maxValue, index);
    return `${point.x},${point.y}`;
  }).join(' ');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        <Svg width={chartSize} height={chartSize}>
          {/* Grid circles */}
          {Array.from({ length: levels }).map((_, level) => {
            const levelRadius = ((level + 1) / levels) * radius;
            return (
              <Circle
                key={level}
                cx={center}
                cy={center}
                r={levelRadius}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
                fill="none"
              />
            );
          })}

          {/* Axes */}
          {data.map((_, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            return (
              <Line
                key={index}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
              />
            );
          })}

          {/* Data polygon */}
          <Polygon
            points={polygonPoints}
            fill="rgba(59, 130, 246, 0.3)"
            stroke="#3B82F6"
            strokeWidth="2"
          />

          {/* Data points */}
          {data.map((item, index) => {
            const point = getPointCoordinates(item.value, item.maxValue, index);
            return (
              <Circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#FFFFFF"
                stroke="#3B82F6"
                strokeWidth="2"
              />
            );
          })}

          {/* Labels */}
          {data.map((item, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const labelRadius = radius + 25;
            const x = center + labelRadius * Math.cos(angle);
            const y = center + labelRadius * Math.sin(angle);

            return (
              <G key={index}>
                <SvgText
                  x={x}
                  y={y}
                  fontSize="11"
                  fill="rgba(255, 255, 255, 0.7)"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {item.label}
                </SvgText>
                <SvgText
                  x={x}
                  y={y + 12}
                  fontSize="10"
                  fill="rgba(255, 255, 255, 0.5)"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {((item.value / item.maxValue) * 100).toFixed(0)}%
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Score moyen</Text>
          <Text style={styles.statValue}>
            {data.length > 0
              ? `${(data.reduce((sum, item) => sum + (item.value / item.maxValue) * 100, 0) / data.length).toFixed(0)  }%`
              : '0%'}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Point fort</Text>
          <Text style={styles.statValue}>
            {data.length > 0
              ? data.reduce((max, item) =>
                  (item.value / item.maxValue) > (max.value / max.maxValue) ? item : max
                , data[0]).label
              : '-'}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>À améliorer</Text>
          <Text style={styles.statValue}>
            {data.length > 0
              ? data.reduce((min, item) =>
                  (item.value / item.maxValue) < (min.value / min.maxValue) ? item : min
                , data[0]).label
              : '-'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  chartContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
