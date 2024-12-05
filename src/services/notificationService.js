class NotificationService {
  constructor() {
    this.soundEnabled = true;
    this.sounds = {
      default: '/sounds/alert.mp3',
      success: '/sounds/success.mp3',
      warning: '/sounds/warning.mp3',
      error: '/sounds/error.mp3'
    };
  }

  async initialize() {
    if (Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
  }

  async sendNotification(alert, price) {
    const notifications = [];

    // Desktop bildirimi
    if (alert.notifications.desktop) {
      notifications.push(this.sendDesktopNotification(alert, price));
    }

    // Telegram bildirimi
    if (alert.notifications.telegram && alert.telegramChatId) {
      notifications.push(this.sendTelegramNotification(alert, price));
    }

    // Email bildirimi
    if (alert.notifications.email && alert.email) {
      notifications.push(this.sendEmailNotification(alert, price));
    }

    // Ses bildirimi
    if (alert.notifications.sound) {
      this.playSoundAlert(alert.notifications.soundType);
    }

    await Promise.all(notifications);
  }

  sendDesktopNotification(alert, price) {
    return new Notification('Fiyat Alarmı', {
      body: `${alert.symbol} ${alert.condition === 'above' ? 'yükseldi' : 'düştü'}: ${price}`,
      icon: '/logo192.png'
    });
  }

  async sendTelegramNotification(alert, price) {
    try {
      const response = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: alert.telegramChatId,
          message: ` Fiyat Alarmı\n\n${alert.symbol} ${alert.condition === 'above' ? '⬆️' : '⬇️'} ${price}\n\nHedef: ${alert.targetPrice}`
        })
      });
      return response.json();
    } catch (error) {
      console.error('Telegram bildirimi gönderilemedi:', error);
    }
  }

  async sendEmailNotification(alert, price) {
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: alert.email,
          subject: `Fiyat Alarmı: ${alert.symbol}`,
          text: `${alert.symbol} fiyatı ${alert.condition === 'above' ? 'yükseldi' : 'düştü'}: ${price}\n\nHedef: ${alert.targetPrice}`
        })
      });
      return response.json();
    } catch (error) {
      console.error('Email bildirimi gönderilemedi:', error);
    }
  }

  playSoundAlert(soundType = 'default') {
    if (!this.soundEnabled) return;

    const audio = new Audio(this.sounds[soundType] || this.sounds.default);
    audio.play().catch(error => console.error('Ses çalınamadı:', error));
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }
}

export const notificationService = new NotificationService(); 