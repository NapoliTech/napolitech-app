import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { adminService } from '../../services/api';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';

const now = new Date();
const ANO = now.getFullYear();
const MES = now.getMonth() + 1;

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const CAT_LABELS = {
  PIZZA: '🍕 Pizza',
  PIZZA_DOCE: '🍕 Pizza Doce',
  BEBIDAS: '🥤 Bebidas',
  BEBIDA: '🥤 Bebidas',
  SOBREMESA: '🍰 Sobremesa',
  PORCAO: '🍗 Porção',
  ESFIHA: '🥙 Esfiha',
  ESFIHA_DOCE: '🥙 Esfiha Doce',
};

function KpiCard({ icon, label, value, color, sub }) {
  return (
    <View style={[styles.kpiCard, { borderTopColor: color }]}>
      <Text style={styles.kpiIcon}>{icon}</Text>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
    </View>
  );
}

function BarChart({ data, maxValue }) {
  if (!data || data.length === 0) return <Text style={styles.emptyText}>Sem dados</Text>;
  const max = maxValue || Math.max(...data.map(d => d.quantidade || d.valor || 0), 1);
  return (
    <View style={styles.barChart}>
      {data.map((item, i) => {
        const val = item.quantidade || item.valor || 0;
        const pct = Math.max((val / max) * 100, 2);
        return (
          <View key={i} style={styles.barItem}>
            <Text style={styles.barValue}>{val}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { height: `${pct}%` }]} />
            </View>
            <Text style={styles.barLabel}>
              {item.dia !== undefined ? DIAS_SEMANA[new Date(now.getFullYear(), now.getMonth(), item.dia).getDay()] ?? item.dia : item.mes ?? ''}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function DashboardScreen() {
  const [kpis, setKpis] = useState(null);
  const [vendas7, setVendas7] = useState([]);
  const [categorias, setCategorias] = useState({});
  const [faturamentoAnual, setFaturamentoAnual] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cardsRes, vendas7Res, catRes, anoRes] = await Promise.all([
        adminService.getDashboardCards(),
        adminService.getSalesLast7Days(),
        adminService.getSalesByCategory(ANO, MES),
        adminService.getRevenueByYear(ANO),
      ]);
      if (cardsRes.success) setKpis(cardsRes.data?.kpis || cardsRes.data);
      if (vendas7Res.success) setVendas7(vendas7Res.data?.vendasPorDia || []);
      if (catRes.success) setCategorias(catRes.data?.vendasPorCategoria || {});
      if (anoRes.success) setFaturamentoAnual(anoRes.data?.faturamentoAnual || []);
    } catch (e) {
      setError('Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  const totalCat = Object.values(categorias).reduce((a, b) => a + (b || 0), 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Dashboard</Text>
          <Text style={styles.pageSubtitle}>Visão geral do negócio</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadAll}>
          <Text style={styles.refreshText}>↻ Atualizar</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        <KpiCard
          icon="📦"
          label="Total de Pedidos"
          value={kpis?.pedidosTotais ?? '—'}
          color={colors.info}
        />
        <KpiCard
          icon="✅"
          label="Finalizados"
          value={kpis?.pedidosFinalizados ?? '—'}
          color={colors.success}
        />
        <KpiCard
          icon="⏳"
          label="Em Aberto"
          value={kpis?.pedidosEmAberto ?? '—'}
          color={colors.warning}
        />
        <KpiCard
          icon="💰"
          label="Faturamento Hoje"
          value={kpis?.faturamentoDiario != null
            ? `R$ ${Number(kpis.faturamentoDiario).toFixed(2)}`
            : '—'}
          color={colors.primary}
        />
      </View>

      {/* Vendas últimos 7 dias */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📈 Vendas — últimos 7 dias</Text>
        {vendas7.length > 0
          ? <BarChart data={vendas7} />
          : <Text style={styles.emptyText}>Sem dados disponíveis</Text>}
      </View>

      {/* Faturamento anual */}
      {faturamentoAnual.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 Faturamento {ANO}</Text>
          <View style={styles.annualGrid}>
            {faturamentoAnual.map((item, i) => (
              <View key={i} style={styles.annualItem}>
                <Text style={styles.annualMes}>{item.mes}</Text>
                <Text style={styles.annualVal}>
                  R$ {Number(item.valor || 0).toFixed(0)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Vendas por categoria */}
      {totalCat > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏷️ Vendas por Categoria — {MES}/{ANO}</Text>
          {Object.entries(categorias).map(([cat, qtd]) => {
            const pct = totalCat > 0 ? (qtd / totalCat) * 100 : 0;
            return (
              <View key={cat} style={styles.catRow}>
                <Text style={styles.catLabel}>{CAT_LABELS[cat] || cat}</Text>
                <View style={styles.catTrack}>
                  <View style={[styles.catFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.catQtd}>{qtd}</Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { padding: spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.textSecondary },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  pageTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
  pageSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  refreshBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  refreshText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  errorBanner: {
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.error, fontSize: 14 },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderTopWidth: 3,
    ...shadows.md,
  },
  kpiIcon: { fontSize: 24, marginBottom: spacing.sm },
  kpiValue: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  kpiLabel: { fontSize: 13, color: colors.textSecondary },
  kpiSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    gap: spacing.sm,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValue: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
  barTrack: {
    width: '70%',
    flex: 1,
    backgroundColor: colors.border,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  barLabel: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: spacing.lg },
  annualGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  annualItem: {
    width: '23%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  annualMes: { fontSize: 11, color: colors.textMuted, marginBottom: 2 },
  annualVal: { fontSize: 12, fontWeight: '600', color: colors.text },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  catLabel: { fontSize: 13, color: colors.text, width: 130 },
  catTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  catFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  catQtd: { fontSize: 13, fontWeight: '600', color: colors.text, width: 30, textAlign: 'right' },
});
