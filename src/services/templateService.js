class TemplateService {
  constructor() {
    this.defaultTemplates = [
      {
        id: 'trend_following',
        name: 'Trend Takibi',
        description: 'RSI ve MACD kullanarak trend yönünü takip eder',
        conditions: [
          {
            indicator: 'rsi',
            operator: 'above',
            value: 50,
            timeframe: '1h'
          },
          {
            indicator: 'macd',
            operator: 'crossover',
            timeframe: '1h'
          }
        ],
        logic: 'AND',
        notifications: {
          desktop: true,
          sound: true,
          telegram: false,
          email: false
        }
      },
      {
        id: 'breakout',
        name: 'Fiyat Kırılımı',
        description: 'Bollinger bantlarını kullanarak fiyat kırılımlarını takip eder',
        conditions: [
          {
            indicator: 'bollinger',
            operator: 'above_upper',
            timeframe: '15m'
          },
          {
            indicator: 'volume',
            operator: 'above',
            value: 1000000,
            timeframe: '15m'
          }
        ],
        logic: 'AND',
        notifications: {
          desktop: true,
          sound: true,
          telegram: true,
          email: false
        }
      },
      {
        id: 'oversold',
        name: 'Aşırı Satım',
        description: 'RSI ile aşırı satım bölgesini tespit eder',
        conditions: [
          {
            indicator: 'rsi',
            operator: 'below',
            value: 30,
            timeframe: '4h'
          }
        ],
        notifications: {
          desktop: true,
          sound: true,
          telegram: false,
          email: true
        }
      }
    ];
  }

  getTemplates() {
    const customTemplates = JSON.parse(localStorage.getItem('alertTemplates') || '[]');
    return [...this.defaultTemplates, ...customTemplates];
  }

  saveTemplate(template) {
    const templates = this.getTemplates();
    templates.push({
      ...template,
      id: `custom_${Date.now()}`
    });
    localStorage.setItem('alertTemplates', JSON.stringify(templates));
  }

  deleteTemplate(templateId) {
    const templates = this.getTemplates().filter(t => t.id !== templateId);
    localStorage.setItem('alertTemplates', JSON.stringify(templates));
  }

  applyTemplate(template, symbol) {
    return {
      ...template,
      symbol,
      createdAt: new Date(),
      isActive: true
    };
  }
}

export const templateService = new TemplateService(); 