// Push notification service using Service Worker + Notification API

const NOTIFICATION_MESSAGES: Record<string, { title: string; body: string }[]> = {
  nl: [
    { title: '💋 Vivianna mist je...', body: 'Ze heeft aan je gedacht. Kom terug en maak het af...' },
    { title: '🔥 Jalin heeft een verrassing', body: 'Er wacht iets speciaals op je. Open de app...' },
    { title: '💌 Nieuw bericht ontvangen', body: 'Een van je favorieten wil je iets vertellen...' },
    { title: '🌙 Eenzame avond?', body: 'Je metgezellinnen wachten op je. Maak het gezellig...' },
    { title: '😏 Shavon vraagt naar je', body: 'Ze wil weten waar je blijft... Kom je nog?' },
    { title: '✨ Tijd voor een avontuur', body: 'Nieuwe scenario\'s wachten op je. Ontdek ze nu...' },
  ],
  en: [
    { title: '💋 Vivianna misses you...', body: 'She has been thinking about you. Come back...' },
    { title: '🔥 Jalin has a surprise', body: 'Something special awaits you. Open the app...' },
    { title: '💌 New message received', body: 'One of your favorites wants to tell you something...' },
    { title: '🌙 Lonely evening?', body: 'Your companions are waiting. Join them...' },
    { title: '😏 Shavon is asking for you', body: 'She wants to know where you are... Coming?' },
    { title: '✨ Time for an adventure', body: 'New scenarios await you. Discover them now...' },
  ],
};

let swRegistration: ServiceWorkerRegistration | null = null;

export async function registerServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  try {
    swRegistration = await navigator.serviceWorker.register('/sw.js');
    return true;
  } catch (e) {
    console.error('SW registration failed:', e);
    return false;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function getNotificationPermission(): string {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export function scheduleReminderNotifications(lang: string = 'nl') {
  if (!swRegistration?.active) return;
  if (Notification.permission !== 'granted') return;

  const code = lang.split('-')[0];
  const messages = NOTIFICATION_MESSAGES[code] || NOTIFICATION_MESSAGES['en'];

  // Schedule notifications at different intervals
  const intervals = [
    2 * 60 * 60 * 1000,   // 2 hours
    6 * 60 * 60 * 1000,   // 6 hours  
    24 * 60 * 60 * 1000,  // 24 hours
  ];

  intervals.forEach((delay, i) => {
    const msg = messages[Math.floor(Math.random() * messages.length)];
    swRegistration!.active!.postMessage({
      type: 'SCHEDULE_NOTIFICATION',
      delay,
      title: msg.title,
      body: msg.body,
      tag: `xxxtales-reminder-${i}`,
    });
  });
}

// Personalize notification with character name
export function scheduleCharacterNotification(characterName: string, lang: string = 'nl', delayMs: number = 2 * 60 * 60 * 1000) {
  if (!swRegistration?.active || Notification.permission !== 'granted') return;

  const messages: Record<string, { title: string; body: string }[]> = {
    nl: [
      { title: `💋 ${characterName} mist je...`, body: 'Ze heeft aan je gedacht. Kom terug en maak het af...' },
      { title: `😏 ${characterName} vraagt naar je`, body: 'Ze wil weten waar je blijft...' },
      { title: `🔥 ${characterName} heeft iets voor je`, body: 'Kom snel terug, ze kan niet wachten...' },
    ],
    en: [
      { title: `💋 ${characterName} misses you...`, body: 'She has been thinking about you. Come back...' },
      { title: `😏 ${characterName} is asking for you`, body: 'She wants to know where you are...' },
      { title: `🔥 ${characterName} has something for you`, body: 'Come back soon, she can\'t wait...' },
    ],
  };

  const code = lang.split('-')[0];
  const pool = messages[code] || messages['en'];
  const msg = pool[Math.floor(Math.random() * pool.length)];

  swRegistration.active.postMessage({
    type: 'SCHEDULE_NOTIFICATION',
    delay: delayMs,
    title: msg.title,
    body: msg.body,
    tag: `xxxtales-char-${characterName}`,
  });
}
