import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Text, View } from "react-native";
import { styles } from "../assets/styles/home.styles";
import { COLORS } from "../constants/colors";
import { getMonthlyAnalysis } from "../lib/utils";

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toFixed(2)}`;
}

function formatDayLabel(dayKey) {
  if (!dayKey) return "--";

  const dayDate = new Date(`${dayKey}T00:00:00`);
  return dayDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function MetricCard({ label, value, hint, icon, tintColor }) {
  return (
    <View style={styles.analysisMetricCard}>
      <View style={styles.analysisMetricHeader}>
        <Ionicons name={icon} size={18} color={tintColor} />
        <Text style={styles.analysisMetricLabel}>{label}</Text>
      </View>
      <Text style={[styles.analysisMetricValue, { color: tintColor }]}>{value}</Text>
      <Text style={styles.analysisMetricHint}>{hint}</Text>
    </View>
  );
}

export const MonthlyAnalysisCard = ({ transactions, referenceDate = new Date() }) => {
  const analysis = useMemo(() => getMonthlyAnalysis(transactions, referenceDate), [transactions, referenceDate]);
  const highestCategoryAmount = analysis.categoryBreakdown[0]?.amount || 0;

  const spendingChangeText =
    analysis.spendingChange === null
      ? "No data from the previous month"
      : `${analysis.spendingChange > 0 ? "+" : ""}${formatCurrency(Math.abs(analysis.spendingChange))} vs last month`;

  const spendingTrendText =
    analysis.spendingChangePercent === null
      ? "No percentage comparison yet"
      : `${analysis.spendingChangePercent > 0 ? "+" : ""}${analysis.spendingChangePercent.toFixed(1)}% vs last month`;

  const hasAnalysis = analysis.totalTransactions > 0;

  return (
    <View style={styles.analysisCard}>
      <View style={styles.analysisHeader}>
        <View>
          <Text style={styles.analysisEyebrow}>Monthly analysis</Text>
          <Text style={styles.analysisTitle}>{analysis.monthLabel}</Text>
        </View>
        <View style={styles.analysisBadge}>
          <Ionicons name="analytics-outline" size={16} color={COLORS.primary} />
          <Text style={styles.analysisBadgeText}>{analysis.totalTransactions} txns</Text>
        </View>
      </View>

      {!hasAnalysis ? (
        <View style={styles.analysisEmptyState}>
          <Ionicons name="pie-chart-outline" size={26} color={COLORS.textLight} />
          <Text style={styles.analysisEmptyTitle}>No transactions this month yet</Text>
          <Text style={styles.analysisEmptyText}>
            Add a few transactions and the app will show monthly spending, top categories, and day
            trends here.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.analysisMetricsGrid}>
            <MetricCard
              label="Spent"
              value={formatCurrency(analysis.expenses)}
              hint={spendingTrendText}
              icon="trending-down-outline"
              tintColor={COLORS.expense}
            />
            <MetricCard
              label="Income"
              value={formatCurrency(analysis.income)}
              hint={`${analysis.totalTransactions} total entries`}
              icon="trending-up-outline"
              tintColor={COLORS.income}
            />
            <MetricCard
              label="Net"
              value={formatCurrency(analysis.net)}
              hint={spendingChangeText}
              icon="wallet-outline"
              tintColor={analysis.net >= 0 ? COLORS.income : COLORS.expense}
            />
          </View>

          <View style={styles.analysisInsightRow}>
            <View style={styles.analysisInsightCard}>
              <Ionicons name="pricetag-outline" size={16} color={COLORS.primary} />
              <View style={styles.analysisInsightTextBlock}>
                <Text style={styles.analysisInsightLabel}>Top category</Text>
                <Text style={styles.analysisInsightValue}>
                  {analysis.topCategory ? analysis.topCategory.category : "None"}
                </Text>
              </View>
              <Text style={styles.analysisInsightAmount}>
                {analysis.topCategory ? formatCurrency(analysis.topCategory.amount) : "₹0.00"}
              </Text>
            </View>

            <View style={styles.analysisInsightCard}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
              <View style={styles.analysisInsightTextBlock}>
                <Text style={styles.analysisInsightLabel}>Busiest day</Text>
                <Text style={styles.analysisInsightValue}>
                  {analysis.topSpendingDay ? formatDayLabel(analysis.topSpendingDay.day) : "None"}
                </Text>
              </View>
              <Text style={styles.analysisInsightAmount}>
                {analysis.topSpendingDay
                  ? formatCurrency(analysis.topSpendingDay.amount)
                  : "₹0.00"}
              </Text>
            </View>
          </View>

          <View style={styles.analysisBreakdownSection}>
            <View style={styles.analysisBreakdownHeader}>
              <Text style={styles.analysisBreakdownTitle}>Category breakdown</Text>
              <Text style={styles.analysisBreakdownSubtitle}>Spending by category</Text>
            </View>

            {analysis.categoryBreakdown.length === 0 ? (
              <Text style={styles.analysisEmptyText}>No expense categories found for this month.</Text>
            ) : (
              analysis.categoryBreakdown.map((item) => {
                const barWidth = `${Math.max((item.amount / highestCategoryAmount) * 100, 8)}%`;

                return (
                  <View key={item.category} style={styles.analysisBreakdownItem}>
                    <View style={styles.analysisBreakdownLabels}>
                      <Text style={styles.analysisBreakdownCategory}>{item.category}</Text>
                      <Text style={styles.analysisBreakdownAmount}>{formatCurrency(item.amount)}</Text>
                    </View>
                    <View style={styles.analysisBreakdownTrack}>
                      <View style={[styles.analysisBreakdownFill, { width: barWidth }]} />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </>
      )}
    </View>
  );
};