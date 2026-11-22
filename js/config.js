/**
 * Zentrale Praxiskonfiguration – Dr. med. dent. Martin Braatz (Unna)
 *
 * Hier können Sprechzeiten, Kontaktdaten und die optionale Doctolib-Anbindung
 * zentral angepasst werden, ohne den HTML-Code ändern zu müssen.
 */
window.PRAXIS_CONFIG = {
  practiceName: 'Praxis Dr. med. dent. Martin Braatz',
  subtitle: 'Fachzahnarzt für Oralchirurgie & Zahnheilkunde',
  phoneDisplay: '0 23 03 / 96 75 75',
  phoneHref: 'tel:+492303967575',
  faxDisplay: '0 23 03 / 94 77 680',
  email: 'praxis@dr-braatz.de',
  address: {
    street: 'Ostring 37',
    zip: '59423',
    city: 'Unna',
    parkingNote: 'Gute Parkmöglichkeiten finden Sie in der Tiefgarage am Bahnhof, direkt gegenüber.',
    googleMapsEmbedUrl:
      'https://www.google.com/maps?q=Dr.+med.+dent.+Martin+Braatz,+Ostring+37,+59423+Unna&output=embed',
    googleMapsLink:
      'https://www.google.com/maps/search/?api=1&query=Dr.+med.+dent.+Martin+Braatz,+Ostring+37,+59423+Unna',
  },

  /**
   * OPTIONALE DOCTOLIB-ANBINDUNG
   * Sobald Dr. Braatz Doctolib nutzen möchte:
   * 1. `enabled` auf `true` setzen
   * 2. Die persönliche Doctolib-Buchungs-URL bei `bookingUrl` eintragen
   */
  doctolib: {
    enabled: false, // Auf `true` setzen, sobald Doctolib aktiv geschaltet werden soll
    bookingUrl: 'https://www.doctolib.de/oralchirurg/unna/martin-braatz',
    label: 'Online-Termin über Doctolib',
    note: 'Die direkte Doctolib-Anbindung ist technisch vorbereitet und kann jederzeit auf Wunsch der Praxis mit einem Klick freigeschaltet werden.',
  },

  /**
   * PRAXIS-BANNER (URLAUB / VERTRETUNG / AKTUELLE HINWEISE) & ZAHNÄRZTLICHER NOTDIENST
   * - Kann kinderleicht hier oder über den "Praxis-Banner & Vorher/Nachher"-Button eingestellt werden.
   * - `emergencyAutoShowAfterHours`: Zeigt außerhalb der Sprechzeiten und am Wochenende
   *   automatisch den offiziellen Zahnärztlichen Notdienst Westfalen-Lippe (Unna) an.
   */
  announcementBanner: {
    enabled: false, // Auf `true` setzen, wenn eine Urlaubs- oder Praxismeldung oben erscheinen soll
    type: 'vacation', // 'vacation' (Urlaub/Vertretung) | 'info' (Aktueller Hinweis) | 'emergency' (Notdienst)
    title: 'Praxisurlaub & Vertretung',
    message:
      'Unsere Praxis befindet sich vom 23.12. bis einschließlich 02.01. im Weihnachtsurlaub. Ab dem 05.01. sind wir ab 08:00 Uhr wieder wie gewohnt für Sie da.',
    substituteDoctor: 'In dringenden Schmerzfällen wenden Sie sich bitte an den zahnärztlichen Notdienst.',
  },

  emergencyService: {
    autoShowWhenClosed: true, // Automatisch Hinweis auf den Notdienst zeigen, wenn die Praxis geschlossen ist
    region: 'Westfalen-Lippe · Kreis Unna (PLZ 59423)',
    phoneDisplay: '01805 / 98 67 00',
    phoneHref: 'tel:+491805986700',
    phoneCostNote: '14 Ct./Min. aus dem dt. Festnetz, Mobilfunk max. 42 Ct./Min.',
    kzvwlSearchUrl: 'https://www.zahnaerzte-wl.de/notdienstsuche?q=Unna',
  },

  /**
   * SPRECHZEITEN (JS getDay(): 0 = So, 1 = Mo, ..., 6 = Sa)
   * Zeitfenster in Minuten seit Mitternacht für die Live-Statusanzeige.
   */
  openingHours: [
    {
      dayIndex: 1,
      day: 'Montag',
      short: 'Mo',
      display: '08:00 – 13:00 & 14:00 – 17:00',
      slots: [
        [8 * 60, 13 * 60],
        [14 * 60, 17 * 60],
      ],
    },
    {
      dayIndex: 2,
      day: 'Dienstag',
      short: 'Di',
      display: '08:00 – 13:00 & 14:00 – 18:00',
      slots: [
        [8 * 60, 13 * 60],
        [14 * 60, 18 * 60],
      ],
    },
    {
      dayIndex: 3,
      day: 'Mittwoch',
      short: 'Mi',
      display: '08:00 – 13:00',
      slots: [[8 * 60, 13 * 60]],
    },
    {
      dayIndex: 4,
      day: 'Donnerstag',
      short: 'Do',
      display: '08:00 – 13:00 & 14:00 – 18:00',
      slots: [
        [8 * 60, 13 * 60],
        [14 * 60, 18 * 60],
      ],
    },
    {
      dayIndex: 5,
      day: 'Freitag',
      short: 'Fr',
      display: '08:00 – 13:00',
      slots: [[8 * 60, 13 * 60]],
    },
    {
      dayIndex: 6,
      day: 'Samstag',
      short: 'Sa',
      display: 'Geschlossen',
      slots: [],
    },
    {
      dayIndex: 0,
      day: 'Sonntag',
      short: 'So',
      display: 'Geschlossen',
      slots: [],
    },
  ],
};
