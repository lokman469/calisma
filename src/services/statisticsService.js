class StatisticsService {
  calculateAlertStats(alerts) {
    const stats = {
      total: alerts.length,
      active: 0,
      triggered: 0,
      success: 0,
      failed: 0,
      avgTriggerTime: 0,
      mostUsedSymbols: new Map(),
      successRate: 0,
      profitLoss: 0
    };

    alerts.forEach(alert => {
      // Aktif/tetiklenmiş alarm sayısı
      if (alert.isActive) {
        stats.active++;
      } else {
        stats.triggered++;
      }

      // Başarı/başarısızlık sayısı
      if (alert.triggerPrice) {
        const isSuccess = this.isAlertSuccessful(alert);
        if (isSuccess) stats.success++;
        else stats.failed++;
      }

      // Sembol kullanım sayısı
      const symbolCount = stats.mostUsedSymbols.get(alert.symbol) || 0;
      stats.mostUsedSymbols.set(alert.symbol, symbolCount + 1);

      // Tetiklenme süresi
      if (alert.triggeredAt) {
        const triggerTime = new Date(alert.triggeredAt) - new Date(alert.createdAt);
        stats.avgTriggerTime += triggerTime;
      }
    });

    // Ortalama tetiklenme süresi
    if (stats.triggered > 0) {
      stats.avgTriggerTime = stats.avgTriggerTime / stats.triggered;
    }

    // Başarı oranı
    if (stats.triggered > 0) {
      stats.successRate = (stats.success / stats.triggered) * 100;
    }

    // Kar/zarar oranı
    stats.profitLoss = this.calculateProfitLoss(alerts);

    return stats;
  }

  isAlertSuccessful(alert) {
    if (!alert.triggerPrice) return false;

    if (alert.condition === 'above') {
      return alert.triggerPrice >= alert.targetPrice;
    } else {
      return alert.triggerPrice <= alert.targetPrice;
    }
  }

  calculateProfitLoss(alerts) {
    let totalPL = 0;
    const triggeredAlerts = alerts.filter(a => a.triggerPrice && !a.isActive);

    triggeredAlerts.forEach(alert => {
      const entryPrice = alert.targetPrice;
      const exitPrice = alert.triggerPrice;
      const pl = ((exitPrice - entryPrice) / entryPrice) * 100;
      totalPL += alert.condition === 'above' ? pl : -pl;
    });

    return triggeredAlerts.length > 0 ? totalPL / triggeredAlerts.length : 0;
  }

  generateChartData(alerts) {
    const dailyStats = new Map();

    alerts.forEach(alert => {
      if (!alert.triggeredAt) return;

      const date = new Date(alert.triggeredAt).toLocaleDateString();
      const stats = dailyStats.get(date) || { success: 0, failed: 0 };

      if (this.isAlertSuccessful(alert)) {
        stats.success++;
      } else {
        stats.failed++;
      }

      dailyStats.set(date, stats);
    });

    return {
      labels: Array.from(dailyStats.keys()),
      datasets: [
        {
          label: 'Başarılı',
          data: Array.from(dailyStats.values()).map(stat => stat.success),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: 'Başarısız',
          data: Array.from(dailyStats.values()).map(stat => stat.failed),
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1
        }
      ]
    };
  }
}

export const statisticsService = new StatisticsService(); 