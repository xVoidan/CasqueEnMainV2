import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface DataPoint {
  date: Date;
  score: number;
}

interface TimeSeriesChartProps {
  data: DataPoint[];
  title?: string;
}

export function TimeSeriesChart({ data, title = 'Évolution du Score' }: TimeSeriesChartProps): React.ReactElement {
  const chartWidth = width - 64;
  const chartHeight = 200;
  const padding = 20;
  const graphWidth = chartWidth - padding * 2;
  const graphHeight = chartHeight - padding * 2;

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Pas encore de données</Text>
        </View>
      </View>
    );
  }

  const maxScore = Math.max(...data.map(d => d.score));
  const minScore = Math.min(...data.map(d => d.score));
  const scoreRange = maxScore - minScore || 1;

  const points = data.map((point, index) => ({
    x: padding + (index / (data.length - 1 || 1)) * graphWidth,
    y: padding + (1 - (point.score - minScore) / scoreRange) * graphHeight,
    score: point.score,
    date: point.date,
  }));

  const pathData = points.reduce((acc, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;

    const prevPoint = points[index - 1];
    const controlX1 = prevPoint.x + (point.x - prevPoint.x) / 3;
    const controlY1 = prevPoint.y;
    const controlX2 = prevPoint.x - (point.x - prevPoint.x) / 3;
    const controlY2 = point.y;

    return `${acc} C ${controlX1},${controlY1} ${controlX2},${controlY2} ${point.x},${point.y}`;
  }, '');

  const areaPathData = `${pathData} L ${points[points.length - 1].x} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`;

  const average = data.reduce((sum, d) => sum + d.score, 0) / data.length;
  const averageY = padding + (1 - (average - minScore) / scoreRange) * graphHeight;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <SvgLinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
            </SvgLinearGradient>
          </Defs>

          <Path
            d={areaPathData}
            fill="url(#gradient)"
          />

          <Path
            d={pathData}
            stroke="#3B82F6"
            strokeWidth="3"
            fill="none"
          />

          <Line
            x1={padding}
            y1={averageY}
            x2={chartWidth - padding}
            y2={averageY}
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1"
            strokeDasharray="5,5"
          />

          <SvgText
            x={chartWidth - padding - 5}
            y={averageY - 5}
            fontSize="10"
            fill="rgba(255, 255, 255, 0.5)"
            textAnchor="end"
          >
            Moy: {average.toFixed(0)}%
          </SvgText>

          {points.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#FFFFFF"
              stroke="#3B82F6"
              strokeWidth="2"
            />
          ))}

          {points.map((point, index) => (
            <SvgText
              key={`label-${index}`}
              x={point.x}
              y={point.y - 10}
              fontSize="10"
              fill="rgba(255, 255, 255, 0.7)"
              textAnchor="middle"
            >
              {point.score}%
            </SvgText>
          ))}
        </Svg>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.legendText}>Score actuel</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine]} />
          <Text style={styles.legendText}>Moyenne: {average.toFixed(0)}%</Text>
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
  emptyState: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendLine: {
    width: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
