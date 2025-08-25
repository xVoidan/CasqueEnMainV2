import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface ThemeData {
  theme: string;
  correct: number;
  incorrect: number;
  total: number;
  percentage: number;
}

interface ThemePerformanceChartProps {
  data: ThemeData[];
}

export function ThemePerformanceChart({ data = [] }: ThemePerformanceChartProps): React.ReactElement {
  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Performance par thème</Text>
        <View style={styles.chartContainer}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
            Pas de données disponibles
          </Text>
        </View>
      </View>
    );
  }

  const chartWidth = width - 64;
  const chartHeight = 180;
  const barWidth = Math.min(40, (chartWidth / Math.max(data.length, 1)) * 0.6);
  const maxPercentage = 100;

  const getBarColor = (percentage: number) => {
    if (percentage >= 80) return '#10B981';
    if (percentage >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Performance par thème</Text>
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          {data.map((item, index) => {
            const x = (chartWidth / data.length) * index + (chartWidth / data.length - barWidth) / 2;
            const barHeight = (item.percentage / maxPercentage) * (chartHeight - 40);
            const y = chartHeight - barHeight - 20;

            return (
              <G key={item.theme}>
                {/* Barre */}
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={getBarColor(item.percentage)}
                  rx={4}
                  opacity={0.9}
                />

                {/* Pourcentage */}
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 5}
                  fontSize="12"
                  fill="white"
                  textAnchor="middle"
                >
                  {item.percentage.toFixed(0)}%
                </SvgText>

                {/* Label du thème */}
                <SvgText
                  x={x + barWidth / 2}
                  y={chartHeight - 5}
                  fontSize="10"
                  fill="rgba(255,255,255,0.6)"
                  textAnchor="middle"
                >
                  {item.theme.length > 8 ? `${item.theme.substring(0, 8)  }...` : item.theme}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>

      {/* Légende */}
      <View style={styles.legend}>
        {data.map((item) => (
          <View key={item.theme} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: getBarColor(item.percentage) }]} />
            <Text style={styles.legendText}>{item.theme}</Text>
            <Text style={styles.legendStats}>
              {item.correct}/{item.total}
            </Text>
          </View>
        ))}
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
  legend: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 4,
  },
  legendStats: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
