import { io } from 'socket.io-client';

class SocketClient {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    if (this.socket && this.connected) {
      return this.socket;
    }

    this.socket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('[Socket] Connected to live radar dispatch:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    return this.socket;
  }

  subscribeToBooking(bookingId, onTrackingUpdate, onStatusChange) {
    if (!this.socket) {
      this.connect();
    }

    if (!this.socket) return () => {};

    this.socket.emit('subscribe_tracking', { bookingId });

    if (onTrackingUpdate) {
      this.socket.on('tracking_update', (data) => {
        if (data.bookingId === bookingId) {
          onTrackingUpdate(data);
        }
      });
    }

    if (onStatusChange) {
      this.socket.on('booking_status', (data) => {
        if (data.bookingId === bookingId) {
          onStatusChange(data);
        }
      });
    }

    // Return cleanup unsubscribe function
    return () => {
      if (this.socket) {
        this.socket.emit('unsubscribe_tracking', { bookingId });
        this.socket.off('tracking_update');
        this.socket.off('booking_status');
      }
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
}

export const socketClient = new SocketClient();
