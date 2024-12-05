class Logger {
  constructor() {
    this.logs = [];
    this.errorHandlers = new Set();
  }

  // Log seviyelerine göre metodlar
  info(message, data = {}) {
    this.log('info', message, data);
  }

  warn(message, data = {}) {
    this.log('warn', message, data);
  }

  error(message, error, data = {}) {
    this.log('error', message, { ...data, error });
    this.notifyErrorHandlers(error, data);
  }

  debug(message, data = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, data);
    }
  }

  // Ana log metodu
  log(level, message, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      environment: process.env.NODE_ENV,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.logs.push(logEntry);
    this.sendToServer(logEntry);
    this.consoleOutput(logEntry);
  }

  // Konsola çıktı
  consoleOutput(logEntry) {
    const styles = {
      info: 'color: #2196F3',
      warn: 'color: #FF9800',
      error: 'color: #F44336',
      debug: 'color: #9E9E9E'
    };

    console.log(
      `%c[${logEntry.level.toUpperCase()}] ${logEntry.message}`,
      styles[logEntry.level],
      logEntry.data
    );
  }

  // Sunucuya gönder
  async sendToServer(logEntry) {
    if (logEntry.level === 'error' || this.shouldSendToServer(logEntry)) {
      try {
        await fetch('/api/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(logEntry)
        });
      } catch (error) {
        console.error('Log gönderilemedi:', error);
      }
    }
  }

  // Sunucuya gönderme kontrolü
  shouldSendToServer(logEntry) {
    // Örnek: Her 10 logdan birini gönder
    return Math.random() < 0.1;
  }

  // Hata handler'larını yönet
  addErrorHandler(handler) {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  notifyErrorHandlers(error, context) {
    this.errorHandlers.forEach(handler => {
      try {
        handler(error, context);
      } catch (handlerError) {
        console.error('Error handler failed:', handlerError);
      }
    });
  }

  // Logları temizle
  clear() {
    this.logs = [];
  }

  // Logları dışa aktar
  export() {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger(); 