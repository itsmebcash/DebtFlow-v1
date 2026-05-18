import { supabase } from '@/lib/supabase';
import { addDays, isSameDay, parseISO } from 'date-fns';

export class NotificationService {
  static async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  static async checkAndNotify(userId: string) {
    if (Notification.permission !== 'granted') return;

    const tomorrow = addDays(new Date(), 1);
    
    // 1. Check Debts due tomorrow
    const { data: debts } = await supabase
      .from('debts')
      .select('person_name, amount, due_date, category')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (debts) {
      debts.forEach(debt => {
        if (debt.due_date && isSameDay(parseISO(debt.due_date), tomorrow)) {
          this.showNotification(
            'Debt Reminder',
            `Reminder: Payment of Rs. ${debt.amount} to ${debt.person_name} is due tomorrow.`
          );
        }
      });
    }

    // 2. Check Recurring Payments due tomorrow
    const { data: recurring } = await supabase
      .from('recurring_payments')
      .select('title, amount, due_day')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (recurring) {
      const tomorrowDay = tomorrow.getDate();
      recurring.forEach(payment => {
        if (payment.due_day === tomorrowDay) {
          this.showNotification(
            'Payment Reminder',
            `Reminder: Your ${payment.title} payment of Rs. ${payment.amount} is due tomorrow.`
          );
        }
      });
    }
  }

  private static showNotification(title: string, body: string) {
    // Check if we already showed this notification in the last 12 hours to avoid spam
    const lastNotified = localStorage.getItem(`notify_${title}_${body}`);
    const now = Date.now();
    
    if (lastNotified && now - parseInt(lastNotified) < 12 * 60 * 60 * 1000) {
      return;
    }

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'debt-reminder',
          renotify: true,
          ...({ vibrate: [200, 100, 200] } as any)
        });
      });
    } else {
      new Notification(title, { body, icon: '/icon-192.png' });
    }

    localStorage.setItem(`notify_${title}_${body}`, now.toString());
  }
}
