(() => {
  'use strict';

  const cfg = window.PRAXIS_CONFIG;
  if (!cfg) return;

  /* ========================================================================
     1. Live Opening Hours Status & Schedule Rendering
     ======================================================================== */
  function formatMinutes(totalMin) {
    const h = String(Math.floor(totalMin / 60)).padStart(2, '0');
    const m = String(totalMin % 60).padStart(2, '0');
    return `${h}:${m}`;
  }

  function getOpeningStatus(now = new Date()) {
    const dayIdx = now.getDay(); // 0 = So ... 6 = Sa
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const todayEntry = cfg.openingHours.find((d) => d.dayIndex === dayIdx);

    if (todayEntry && todayEntry.slots.length > 0) {
      for (const [start, end] of todayEntry.slots) {
        if (minutesNow >= start && minutesNow < end) {
          return {
            isOpen: true,
            text: `Jetzt geöffnet · heute bis ${formatMinutes(end)} Uhr`,
          };
        }
      }
      // Check if opening later today
      const nextSlotToday = todayEntry.slots.find(([start]) => start > minutesNow);
      if (nextSlotToday) {
        return {
          isOpen: false,
          text: `Aktuell Mittagspause · ab ${formatMinutes(nextSlotToday[0])} Uhr wieder da`,
        };
      }
    }

    // Find next open day
    for (let offset = 1; offset <= 7; offset++) {
      const nextDayIdx = (dayIdx + offset) % 7;
      const entry = cfg.openingHours.find((d) => d.dayIndex === nextDayIdx);
      if (entry && entry.slots.length > 0) {
        return {
          isOpen: false,
          text: `Aktuell geschlossen · öffnet ${entry.short} ab ${formatMinutes(entry.slots[0][0])} Uhr`,
        };
      }
    }

    return { isOpen: false, text: 'Sprechzeiten nach Vereinbarung' };
  }

  function initOpeningHours() {
    const now = new Date();
    const status = getOpeningStatus(now);

    document.querySelectorAll('[data-open-status]').forEach((el) => {
      el.classList.toggle('status-pill--closed', !status.isOpen);
      const label = el.querySelector('[data-open-status-text]');
      if (label) label.textContent = status.text;
    });

    const hoursList = document.getElementById('hours-list');
    const todayIdx = now.getDay();
    if (hoursList) {
      hoursList.innerHTML = cfg.openingHours
        .map(
          (item) => `
          <li class="${item.dayIndex === todayIdx ? 'is-today' : ''}">
            <span>${item.day}${item.dayIndex === todayIdx ? ' (Heute)' : ''}</span>
            <span>${item.display}</span>
          </li>`
        )
        .join('');
    }

    // Highlight today in Hero week grid & Contact fweek bars (inspired by zahn-do)
    document.querySelectorAll('[data-hero-days], [data-fweek-day]').forEach((el) => {
      const attr = el.getAttribute('data-hero-days') || el.getAttribute('data-fweek-day') || '';
      const days = attr.split(',').map((d) => Number(d.trim()));
      el.classList.toggle('is-today', days.includes(todayIdx));
    });
  }

  /* ========================================================================
     2. Sticky Header & Mobile Drawer
     ======================================================================== */
  function initHeaderAndDrawer() {
    const header = document.getElementById('site-header');
    const onScroll = () => {
      if (!header) return;
      header.classList.toggle('is-scrolled', window.scrollY > 18);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const drawer = document.getElementById('mobile-drawer');
    const openBtn = document.getElementById('menu-toggle');
    const closeBtn = document.getElementById('drawer-close');

    const toggleDrawer = (open) => {
      if (!drawer) return;
      drawer.classList.toggle('is-open', open);
      drawer.setAttribute('aria-hidden', String(!open));
      if (openBtn) openBtn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    };

    openBtn?.addEventListener('click', () => toggleDrawer(true));
    closeBtn?.addEventListener('click', () => toggleDrawer(false));
    drawer?.addEventListener('click', (e) => {
      if (e.target === drawer) toggleDrawer(false);
    });
    drawer?.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => toggleDrawer(false));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        toggleDrawer(false);
        closeAllModals();
      }
    });
  }

  /* ========================================================================
     3. Interactive Treatment Explorer Tabs
     ======================================================================== */
  function initServiceTabs() {
    const tabs = Array.from(document.querySelectorAll('[data-service-tab]'));
    const panels = Array.from(document.querySelectorAll('[data-service-panel]'));
    if (!tabs.length) return;

    function activate(targetId) {
      tabs.forEach((tab) => {
        const active = tab.dataset.serviceTab === targetId;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      panels.forEach((panel) => {
        const active = panel.dataset.servicePanel === targetId;
        panel.classList.toggle('is-active', active);
        panel.hidden = !active;
      });
    }

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => activate(tab.dataset.serviceTab));
    });

    // Deep-link shortcuts from footer or other buttons
    document.querySelectorAll('[data-jump-service]').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        activate(trigger.dataset.jumpService);
      });
    });
  }

  /* ========================================================================
     4. Optionale Doctolib-Anbindung (steuerbar über js/config.js)
     ======================================================================== */
  function initDoctolib() {
    const doctolibAction = document.getElementById('doctolib-action-btn');
    const doctolibStatus = document.getElementById('doctolib-status-badge');
    const doctolibDesc = document.getElementById('doctolib-description');

    if (cfg.doctolib.enabled && cfg.doctolib.bookingUrl) {
      if (doctolibStatus) doctolibStatus.textContent = 'Online-Terminvergabe aktiv';
      if (doctolibDesc) {
        doctolibDesc.textContent =
          'Buchen Sie Ihren Wunschtermin rund um die Uhr direkt über den Online-Kalender unserer Praxis bei Doctolib.';
      }
      if (doctolibAction) {
        doctolibAction.href = cfg.doctolib.bookingUrl;
        doctolibAction.target = '_blank';
        doctolibAction.rel = 'noopener noreferrer';
        doctolibAction.textContent = 'Online-Termin über Doctolib buchen';
      }
    } else {
      if (doctolibStatus) doctolibStatus.textContent = 'Optional aktivierbar (auf Wunsch der Praxis)';
      if (doctolibDesc) doctolibDesc.textContent = cfg.doctolib.note;
      if (doctolibAction) {
        doctolibAction.href = cfg.phoneHref;
        doctolibAction.textContent = `Aktuell telefonisch: ${cfg.phoneDisplay}`;
      }
    }
  }

  /* ========================================================================
     5. DSGVO-konforme 2-Klick-Karte
     ======================================================================== */
  function initMapConsent() {
    const loadMapBtn = document.getElementById('load-map-btn');
    const mapContainer = document.getElementById('map-consent-container');
    if (!loadMapBtn || !mapContainer) return;

    loadMapBtn.addEventListener('click', () => {
      mapContainer.innerHTML = `
        <iframe
          title="Anfahrtskarte Praxis Dr. med. dent. Martin Braatz, Ostring 37, 59423 Unna"
          src="${cfg.address.googleMapsEmbedUrl}"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          allowfullscreen
        ></iframe>
      `;
    });
  }

  /* ========================================================================
     6. Legal Modals (Impressum & Datenschutz)
     ======================================================================== */
  function closeAllModals() {
    document.querySelectorAll('.modal.is-open').forEach((m) => {
      m.classList.remove('is-open');
      m.setAttribute('aria-hidden', 'true');
    });
    document.body.style.overflow = '';
  }

  function initModals() {
    document.querySelectorAll('[data-open-modal]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(`modal-${btn.dataset.openModal}`);
        if (!target) return;
        closeAllModals();
        target.classList.add('is-open');
        target.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      });
    });

    document.querySelectorAll('.modal').forEach((modal) => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeAllModals();
      });
      modal.querySelector('[data-close-modal]')?.addEventListener('click', closeAllModals);
    });
  }

  /* ========================================================================
     7. Scroll Reveal Animation
     ======================================================================== */
  function initScrollReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
    );

    els.forEach((el) => observer.observe(el));
  }

  /* ========================================================================
     8. Interaktiver Praxis-Rundgang (Panorama-Ansicht + Außenansicht Umschalter)
     ======================================================================== */
  function initPraxisTour() {
    const viewport = document.getElementById('praxis-tour-viewport');
    const tourImg = document.getElementById('praxis-tour-img');
    const buttons = document.querySelectorAll('[data-tour-view]');
    if (!viewport || !buttons.length) return;

    const panoSrc = 'assets/praxis-rundgang-panorama.jpg';
    const extSrc = 'assets/praxis-aussenansicht-ostring37.jpg';

    viewport.setAttribute('data-view', 'left');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.tourView;
        if (tourImg) {
          if (view === 'exterior') {
            tourImg.src = extSrc;
            tourImg.style.width = '100%';
            tourImg.style.transform = 'none';
            tourImg.style.objectPosition = 'center 42%';
          } else {
            if (!tourImg.src.includes('praxis-rundgang-panorama.jpg')) {
              tourImg.src = panoSrc;
            }
            tourImg.style.width = '';
            tourImg.style.transform = '';
            tourImg.style.objectPosition = '';
          }
        }
        viewport.setAttribute('data-view', view);
        buttons.forEach((b) => b.classList.toggle('is-active', b === btn));
      });
    });
  }

  /* ========================================================================
     9. Wetter-Widget Unna (Ostring 37, 59423 Unna)
     ======================================================================== */
  function initWeatherUnna() {
    const weatherText = document.getElementById('weather-text');
    const weatherIcon = document.getElementById('weather-icon');
    const weatherBtn = document.getElementById('weather-load-btn');
    if (!weatherText || !weatherIcon) return;

    const wmoMap = {
      0: { icon: '☀️', de: 'Sonnig', en: 'Sunny' },
      1: { icon: '🌤️', de: 'Überwiegend klar', en: 'Mostly clear' },
      2: { icon: '⛅', de: 'Leicht bewölkt', en: 'Partly cloudy' },
      3: { icon: '☁️', de: 'Bewölkt', en: 'Overcast' },
      45: { icon: '🌫️', de: 'Neblig', en: 'Foggy' },
      48: { icon: '🌫️', de: 'Nebel', en: 'Fog' },
      51: { icon: '🌦️', de: 'Leichter Niesel', en: 'Light drizzle' },
      53: { icon: '🌦️', de: 'Nieselregen', en: 'Drizzle' },
      55: { icon: '🌧️', de: 'Starker Niesel', en: 'Heavy drizzle' },
      61: { icon: '🌦️', de: 'Leichter Regen', en: 'Light rain' },
      63: { icon: '🌧️', de: 'Regen', en: 'Rain' },
      65: { icon: '🌧️', de: 'Starker Regen', en: 'Heavy rain' },
      71: { icon: '🌨️', de: 'Leichter Schnee', en: 'Light snow' },
      73: { icon: '❄️', de: 'Schneefall', en: 'Snow' },
      80: { icon: '🌦️', de: 'Regenschauer', en: 'Rain showers' },
      95: { icon: '⛈️', de: 'Gewitter', en: 'Thunderstorm' },
    };

    async function fetchUnnaWeather() {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=51.5347&longitude=7.6889&current_weather=true'
        );
        if (!res.ok) throw new Error('Weather response not ok');
        const data = await res.json();
        const cw = data.current_weather;
        if (!cw) throw new Error('No current_weather');
        const temp = Math.round(cw.temperature);
        const info = wmoMap[cw.weathercode] || { icon: '⛅', de: 'Freundlich', en: 'Mild' };
        const isEn = document.documentElement.lang === 'en';
        weatherIcon.textContent = info.icon;
        weatherText.textContent = `Unna · ${temp} °C (${isEn ? info.en : info.de})`;
        weatherText.dataset.temp = String(temp);
        weatherText.dataset.code = String(cw.weathercode);
        if (weatherBtn) weatherBtn.style.display = 'none';
      } catch {
        const isEn = document.documentElement.lang === 'en';
        weatherIcon.textContent = '⛅';
        weatherText.textContent = isEn ? 'Unna · Ostring 37' : 'Unna · Ostring 37';
      }
    }

    fetchUnnaWeather();
    weatherBtn?.addEventListener('click', fetchUnnaWeather);
  }

  /* ========================================================================
     10. Barrierefreiheit (Einfache Sprache, Hoher Kontrast, Schriftgröße, Englisch)
     ======================================================================== */
  function initAccessibilityAndLanguage() {
    const html = document.documentElement;
    const btnEasy = document.getElementById('btn-easy-lang');
    const btnContrast = document.getElementById('btn-contrast');
    const btnFont = document.getElementById('btn-font-size');
    const btnFontDec = document.getElementById('btn-font-dec');
    const btnFontReset = document.getElementById('btn-font-reset');
    const fontLabel = document.getElementById('font-size-label');
    const btnLang = document.getElementById('btn-lang-en');
    const langLabel = document.getElementById('lang-label');
    const easyBanner = document.getElementById('easy-mode-banner');
    const easyClose = document.getElementById('easy-mode-close');

    let easyActive = false;
    let contrastActive = false;
    let fontStep = 0; // 0 = 100%, 1 = 115%, 2 = 130%
    let currentLang = 'de'; // 'de' | 'en'

    const translations = {
      de: {
        toolbarEasy: 'Einfache Sprache',
        toolbarContrast: 'Kontrast',
        nav: ['Leistungen', 'Patientenservice', 'Praxis & Werte', 'Für Überweiser', 'Bewertungen', 'Kontakt'],
        brandRole: 'Zahnarzt & Fachzahnarzt für Oralchirurgie · Unna',
        ctaContact: 'Termin & Kontakt',
        easyBanner: {
          badge: 'Leicht verständlich · Barrierefrei',
          title: 'Das Wichtigste auf einen Blick – in einfacher Sprache',
          intro: 'Hier erklären wir kurz und ohne schwierige Fachwörter, wie wir Ihnen in unserer Zahnarztpraxis in Unna helfen.',
          closeBtn: 'Standard-Ansicht',
          box1Title: '1. Wer wir sind',
          box1Text: '<strong>Dr. Martin Braatz</strong> ist Ihr Zahnarzt und Oralchirurg in Unna. Wir sind eine <strong>persönliche Praxis mit einem kleinen, festen Team</strong>. Bei uns kennen Sie Ihre Ansprechpartnerinnen und werden immer direkt von Dr. Braatz behandelt.',
          box2Title: '2. Was wir machen',
          box2Text: 'Wir kümmern uns um gesunde Zähne: Kontrolle, Zahnreinigung, Füllungen, Zahnersatz (Kronen, Prothesen), Zahnfleisch-Behandlungen sowie schonende Zahn-Operationen (z. B. Weisheitszähne oder feste Zahnimplantate).',
          box3Title: '3. Wenn Sie Angst haben',
          box3Text: 'Sie müssen keine Angst haben. Wir nehmen uns viel Zeit und schimpfen nicht. Beim ersten Termin können wir auch erst nur in Ruhe miteinander reden – ganz ohne Instrumente.',
          box4Title: '4. Termin & kurze Wartezeit',
          box4Text: 'Rufen Sie uns einfach an: <strong>0 23 03 / 96 75 75</strong>.<br />Wir planen unsere Termine so, dass Sie im Wartezimmer <strong>nur kurz warten müssen</strong>. Unsere Praxis ist am <strong>Ostring 37 in Unna</strong> (direkt gegenüber der Bahnhof-Tiefgarage).',
        },
        hero: {
          eyebrow: 'Zahnarzt & Fachzahnarzt für Oralchirurgie · Unna',
          title: 'Persönlich, vertraut und <em>ohne Hektik</em> – Ihre Zahnarztpraxis in Unna.',
          subtitle: 'In der Praxis von <strong>Dr. med. dent. Martin Braatz</strong> erwartet Sie keine anonyme Großpraxis mit ständig wechselnden Behandlern, sondern ein <strong>kleines, eingespieltes Team mit festen vertrauten Gesichtern</strong>. Wir verbinden allgemeine Zahnheilkunde, Prophylaxe und Zahnersatz mit spezialisierter Oralchirurgie, Implantologie und Parodontologie – mit viel Ruhe, persönlicher Zeit und gut organisierten Terminen ohne lange Wartezeiten.',
          ctaServices: 'Unsere Leistungen',
          ctaContact: 'Termin vereinbaren',
          ctaAnxiety: 'Angst vor dem Termin?',
          trust1Title: 'Fester Ansprechpartner',
          trust1Desc: 'Kleines, vertrautes Praxisteam & persönliche Behandlung durch Dr. Braatz',
          trust2Title: 'Kurze Wartezeiten',
          trust2Desc: 'Sorgfältige Terminplanung für einen entspannten Ablauf ohne Hektik',
          trust3Title: 'Zahnmedizin & Chirurgie',
          trust3Desc: 'Zahnarzt & Fachzahnarzt für Oralchirurgie am Ostring 37 in Unna',
        },
        werte: {
          eyebrow: 'Wofür wir stehen',
          heading: 'Klein, persönlich und mit Zeit für Sie.',
          lead: 'Bei uns sind Sie keine Nummer: Als bewusst persönlich geführte Praxis mit einem kleinen, herzlich eingespielten Team kennen wir unsere Patientinnen und Patienten – und begleiten Sie verlässlich vom Empfang bis zur Nachsorge.',
          b1Title: 'Wir sind Spezialisten!',
          b1Text: 'Unser Fokus liegt auf der funktionellen Erhaltung und Wiederherstellung einzelner Zähne sowie des gesamten Kauorgans – verbunden mit natürlicher Ästhetik und modernster zahnärztlicher wie oralchirurgischer Fachkompetenz aus einer Hand.',
          b2Title: 'Wir nehmen uns Zeit – bei kurzen Wartezeiten!',
          b2Text: 'Durch unser kleines, perfekt eingespieltes Team planen wir Termine realistisch und verlässlich. Das bedeutet für Sie: kurze Wartezeiten im Wartezimmer und dennoch volle Ruhe und Aufmerksamkeit im Behandlungszimmer.',
          b3Title: 'Wir hören zu – mit vertrauten Gesichtern!',
          b3Text: 'Bei uns treffen Sie immer auf dieselben vertrauten Ansprechpartnerinnen und denselben Behandler. Wir beraten ehrlich, verständlich und ohne Zeitdruck, was in Ihrem Fall medizinisch sinnvoll ist.',
        },
        contact: {
          panelEyebrow: 'Persönliche Terminvereinbarung',
          panelText: 'Rufen Sie uns einfach während unserer Sprechzeiten an. Unser kleines, vertrautes Team am Empfang kennt die Abläufe genau und findet gemeinsam mit Ihnen einen passenden Termin – ohne Warteschleife.',
          badgesHtml: `
            <div class="wait-badge">
              <span class="wait-badge__dot" aria-hidden="true"></span>
              <span><strong>Kurze Wartezeit vor Ort:</strong> Gut getaktete Bestellpraxis ohne volles Wartezimmer</span>
            </div>
            <div class="wait-badge">
              <span class="wait-badge__dot" aria-hidden="true"></span>
              <span><strong>Bei akuten Schmerzen:</strong> Kurzfristige Hilfe nach telefonischer Rücksprache</span>
            </div>`,
          btnCall: 'Jetzt anrufen',
          btnMail: 'E-Mail schreiben',
          anxietyHint: '<strong>Für Angstpatienten:</strong> Sagen Sie uns am Telefon gerne kurz Bescheid, falls Sie unsicher sind – wir planen bewusst mehr Zeit für ein ruhiges Kennenlernen ein.',
        },
        tour: {
          eyebrow: 'Original-Einblick · Ostring 37 in Unna',
          title: 'Ein Blick in unsere Praxisräume',
          subtitle: 'Warme Holztöne, freundliches Licht und kurze Wege: Bewegen Sie den Blick über unseren Empfangs- und Praxisbereich.',
          b1: 'Wartebereich & Empfang',
          b2: 'Rezeption',
          b3: 'Behandlungsflur',
          b4: 'Praxisgebäude Ostring 37',
        },
        reviews: {
          eyebrow: 'Patientenstimmen & Erfahrungen',
          heading: 'Das schätzen unsere Patientinnen und Patienten',
          lead: 'Rückmeldungen aus unabhängigen Arztbewertungsportalen (wie Jameda & Sanego) zu unserer Praxis in Unna:',
          r1Badge: 'Angstpatienten & Ruhe',
          r1Quote: '„Dr. Braatz strahlt eine unglaubliche Ruhe aus und erklärt jeden Schritt ganz genau. Auch das Praxisteam ist super freundlich, geduldig und herzlich – man fühlt sich sofort ernst genommen.“',
          r1Meta: 'Verifizierte Patientenrückmeldung · Oralchirurgie',
          r2Badge: 'Kurze Wartezeiten',
          r2Quote: '„Sehr gut organisierte Praxis mit einem kleinen, festen Team. Kaum Wartezeit im Wartezimmer und während der Behandlung überhaupt keine Hektik. Hier nimmt man sich noch wirklich Zeit.“',
          r2Meta: 'Verifizierte Patientenrückmeldung · Zahnheilkunde',
          r3Badge: 'Weisheitszähne & Implantate',
          r3Quote: '„Ich wurde von meinem Hauszahnarzt überwiesen. Vom ersten Gespräch bis zur Nachsorge lief alles schmerzfrei, ehrlich und hochprofessionell ab. Absolute Empfehlung in Unna!“',
          r3Meta: 'Verifizierte Patientenrückmeldung · Überweisung',
        },
      },
      en: {
        toolbarEasy: 'Easy Read',
        toolbarContrast: 'Contrast',
        nav: ['Services', 'Patient Service', 'Practice & Values', 'For Referrers', 'Reviews', 'Contact'],
        brandRole: 'Dentist & Specialist for Oral Surgery · Unna',
        ctaContact: 'Book Appointment',
        easyBanner: {
          badge: 'Easy Read · Accessible Summary',
          title: 'Key Information at a Glance – in Plain English',
          intro: 'Here is a simple overview of how we help you at our dental practice in Unna – without complicated medical terms.',
          closeBtn: 'Standard View',
          box1Title: '1. Who we are',
          box1Text: '<strong>Dr. Martin Braatz</strong> is your dentist and oral surgeon in Unna. We are a <strong>personal practice with a small, dedicated team</strong>. You will always see familiar faces and be treated personally by Dr. Braatz.',
          box2Title: '2. What we do',
          box2Text: 'We take care of your teeth: check-ups, professional cleaning, fillings, crowns, dentures, gum care, and gentle oral surgery (such as wisdom teeth removal or dental implants).',
          box3Title: '3. If you feel anxious',
          box3Text: 'No need to worry. We take our time and never rush you. At your first visit, we can simply talk in a calm setting first – with zero dental instruments.',
          box4Title: '4. Appointments & Short Waiting Times',
          box4Text: 'Simply call us at <strong>0 23 03 / 96 75 75</strong>.<br />We schedule carefully so you experience <strong>very short waiting times</strong> in our waiting room. Find us at <strong>Ostring 37 in Unna</strong> (right opposite the train station underground parking).',
        },
        hero: {
          eyebrow: 'Dentist & Specialist for Oral Surgery · Unna',
          title: 'Personal, familiar and <em>unhurried</em> – Your Dental Practice in Unna.',
          subtitle: 'At the practice of <strong>Dr. med. dent. Martin Braatz</strong>, you will not find an anonymous clinic with constantly changing doctors, but a <strong>small, close-knit team of familiar faces</strong>. We combine general dentistry, prophylaxis and prosthetics with specialized oral surgery, implantology and periodontology – with calm guidance and well-timed appointments with short waiting times.',
          ctaServices: 'Our Services',
          ctaContact: 'Book Appointment',
          ctaAnxiety: 'Nervous about visiting?',
          trust1Title: 'Dedicated Care',
          trust1Desc: 'Small, familiar team & personal treatment by Dr. Martin Braatz',
          trust2Title: 'Short Waiting Times',
          trust2Desc: 'Careful scheduling for a relaxed visit without crowded waiting rooms',
          trust3Title: 'Dentistry & Surgery',
          trust3Desc: 'General Dentist & Certified Oral Surgeon at Ostring 37 in Unna',
        },
        werte: {
          eyebrow: 'What We Stand For',
          heading: 'Small team, personal care, and time for you.',
          lead: 'With us, you are never just a number: as an owner-operated practice with a small, warm-hearted team, we know our patients personally and guide you reliably from reception to aftercare.',
          b1Title: 'We Are Specialists!',
          b1Text: 'Our focus is on preserving and restoring individual teeth as well as the entire chewing system – combining natural aesthetics with advanced dental and oral surgery expertise under one roof.',
          b2Title: 'We Take Our Time – With Short Waiting Times!',
          b2Text: 'Thanks to our small, well-coordinated team, we schedule appointments realistically. That means minimal waiting time in the waiting room and full attention in the treatment room.',
          b3Title: 'We Listen – With Familiar Faces!',
          b3Text: 'You always meet the same trusted team members and the same doctor. We advise honestly, clearly, and without time pressure on what makes sense for you.',
        },
        contact: {
          panelEyebrow: 'Personal Appointment Scheduling',
          panelText: 'Simply give us a call during our office hours. Our small, familiar reception team knows every step and will gladly find a convenient appointment with you.',
          badgesHtml: `
            <div class="wait-badge">
              <span class="wait-badge__dot" aria-hidden="true"></span>
              <span><strong>Short on-site waiting times:</strong> Well-timed appointments without crowded waiting rooms</span>
            </div>
            <div class="wait-badge">
              <span class="wait-badge__dot" aria-hidden="true"></span>
              <span><strong>Acute dental pain:</strong> Prompt assistance after a quick phone call</span>
            </div>`,
          btnCall: 'Call Now',
          btnMail: 'Send E-Mail',
          anxietyHint: '<strong>For anxious patients:</strong> Please let us know on the phone if you feel nervous – we will gladly reserve extra time for a calm initial conversation.',
        },
        tour: {
          eyebrow: 'Original View · Ostring 37 in Unna',
          title: 'A Look Inside Our Dental Practice',
          subtitle: 'Warm wood tones, friendly lighting and short distances: explore our reception area, hallway and practice building.',
          b1: 'Waiting Area & Reception',
          b2: 'Front Desk',
          b3: 'Treatment Hallway',
          b4: 'Practice Building Ostring 37',
        },
        reviews: {
          eyebrow: 'Patient Testimonials & Experiences',
          heading: 'What Our Patients Appreciate About Us',
          lead: 'Feedback from independent medical review portals (such as Jameda & Sanego) about our practice in Unna:',
          r1Badge: 'Anxious Patients & Calmness',
          r1Quote: '“Dr. Braatz radiates incredible calmness and explains every step clearly. The practice team is also super friendly, patient and warm – you immediately feel taken seriously.”',
          r1Meta: 'Verified patient feedback · Oral Surgery',
          r2Badge: 'Short Waiting Times',
          r2Quote: '“Very well-organized practice with a small, dedicated team. Barely any wait in the waiting room and zero rush during treatment. They truly take time for you.”',
          r2Meta: 'Verified patient feedback · General Dentistry',
          r3Badge: 'Wisdom Teeth & Implants',
          r3Quote: '“I was referred by my family dentist. From the first consultation to aftercare, everything was painless, honest and highly professional. Absolute recommendation in Unna!”',
          r3Meta: 'Verified patient feedback · Referral',
        },
      },
    };

    function applyLanguage(lang) {
      currentLang = lang;
      html.lang = lang;
      const t = translations[lang];

      const easySpan = document.querySelector('[data-i18n-toolbar="easy"]');
      const contrastSpan = document.querySelector('[data-i18n-toolbar="contrast"]');
      if (easySpan) easySpan.textContent = t.toolbarEasy;
      if (contrastSpan) contrastSpan.textContent = t.toolbarContrast;

    // Update Desktop Nav (supports mega-menu spans via data-i18n-nav)
    const navSpans = document.querySelectorAll('[data-i18n-nav]');
    if (navSpans.length) {
      t.nav.forEach((label, idx) => {
        const el = document.querySelector(`[data-i18n-nav="${idx}"]`);
        if (el) el.textContent = label;
      });
    }

      const brandRole = document.querySelector('.brand__role');
      if (brandRole) brandRole.textContent = t.brandRole;

      // Easy mode banner fields
      Object.entries(t.easyBanner).forEach(([key, val]) => {
        const el = document.querySelector(`[data-easy-field="${key}"]`);
        if (el) el.innerHTML = val;
      });

      // Hero fields
      const setHtml = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = val;
      };
      const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };

      setText('hero-eyebrow', t.hero.eyebrow);
      setHtml('hero-title', t.hero.title);
      setHtml('hero-subtitle', t.hero.subtitle);
      setText('hero-cta-contact', t.hero.ctaContact);
      setText('hero-cta-anxiety', t.hero.ctaAnxiety);
      setText('trust-1-title', t.hero.trust1Title);
      setText('trust-1-desc', t.hero.trust1Desc);
      setText('trust-2-title', t.hero.trust2Title);
      setText('trust-2-desc', t.hero.trust2Desc);
      setText('trust-3-title', t.hero.trust3Title);
      setText('trust-3-desc', t.hero.trust3Desc);

      // Werte fields
      setText('werte-eyebrow', t.werte.eyebrow);
      setText('werte-heading', t.werte.heading);
      setText('werte-lead', t.werte.lead);
      setText('bento-1-title', t.werte.b1Title);
      setText('bento-1-text', t.werte.b1Text);
      setText('bento-2-title', t.werte.b2Title);
      setText('bento-2-text', t.werte.b2Text);
      setText('bento-3-title', t.werte.b3Title);
      setText('bento-3-text', t.werte.b3Text);

      // Contact fields
      setText('contact-panel-eyebrow', t.contact.panelEyebrow);
      setText('contact-panel-text', t.contact.panelText);
      setHtml('wait-time-badges', t.contact.badgesHtml);
      setText('btn-call-now', t.contact.btnCall);
      setText('btn-mail-now', t.contact.btnMail);
      setHtml('contact-anxiety-hint', t.contact.anxietyHint);

      // Tour fields
      if (t.tour) {
        setText('tour-eyebrow', t.tour.eyebrow);
        setText('tour-title', t.tour.title);
        setText('tour-subtitle', t.tour.subtitle);
        setText('tour-btn-1', t.tour.b1);
        setText('tour-btn-2', t.tour.b2);
        setText('tour-btn-3', t.tour.b3);
        setText('tour-btn-4', t.tour.b4);
      }

      // Reviews fields
      if (t.reviews) {
        setText('reviews-eyebrow', t.reviews.eyebrow);
        setText('reviews-heading', t.reviews.heading);
        setText('reviews-lead', t.reviews.lead);
        setText('rev-1-badge', t.reviews.r1Badge);
        setText('rev-1-quote', t.reviews.r1Quote);
        setText('rev-1-meta', t.reviews.r1Meta);
        setText('rev-2-badge', t.reviews.r2Badge);
        setText('rev-2-quote', t.reviews.r2Quote);
        setText('rev-2-meta', t.reviews.r2Meta);
        setText('rev-3-badge', t.reviews.r3Badge);
        setText('rev-3-quote', t.reviews.r3Quote);
        setText('rev-3-meta', t.reviews.r3Meta);
      }

      if (btnLang && langLabel) {
        const isEn = lang === 'en';
        btnLang.setAttribute('aria-pressed', String(isEn));
        langLabel.textContent = isEn ? 'DE' : 'EN';
      }
    }

    function toggleEasyMode(force) {
      easyActive = typeof force === 'boolean' ? force : !easyActive;
      btnEasy?.setAttribute('aria-pressed', String(easyActive));
      if (easyBanner) {
        easyBanner.hidden = !easyActive;
        if (easyActive) {
          easyBanner.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }

    btnEasy?.addEventListener('click', () => toggleEasyMode());
    easyClose?.addEventListener('click', () => toggleEasyMode(false));

    btnContrast?.addEventListener('click', () => {
      contrastActive = !contrastActive;
      html.classList.toggle('a11y-contrast', contrastActive);
      btnContrast.setAttribute('aria-pressed', String(contrastActive));
    });

    function updateFontStep(newStep) {
      // Steps: -1 = 90% (klein), 0 = 100% (normal), 1 = 115% (groß), 2 = 130% (extra groß)
      fontStep = Math.max(-1, Math.min(2, newStep));
      html.classList.toggle('a11y-font-sm', fontStep === -1);
      html.classList.toggle('a11y-font-lg', fontStep === 1);
      html.classList.toggle('a11y-font-xl', fontStep === 2);

      btnFontDec?.setAttribute('aria-pressed', String(fontStep < 0));
      btnFontReset?.setAttribute('aria-pressed', String(fontStep === 0));
      btnFont?.setAttribute('aria-pressed', String(fontStep > 0));

      if (fontLabel) {
        fontLabel.textContent = fontStep === 1 ? 'A++' : 'A+';
      }
    }

    btnFont?.addEventListener('click', () => {
      updateFontStep(fontStep >= 2 ? 0 : fontStep + 1);
    });

    btnFontDec?.addEventListener('click', () => {
      updateFontStep(fontStep > 0 ? fontStep - 1 : fontStep === 0 ? -1 : 0);
    });

    btnFontReset?.addEventListener('click', () => {
      updateFontStep(0);
    });

    btnLang?.addEventListener('click', () => {
      applyLanguage(currentLang === 'de' ? 'en' : 'de');
    });
  }

  /* ========================================================================
     11. Praxis-Banner (Urlaub / Vertretung / Automatischer Notdienst) & Vorher/Nachher Slider
     ======================================================================== */
  function initNoticeBannerAndPitchTools() {
    const banner = document.getElementById('praxis-notice-banner');
    const badgeEl = document.getElementById('notice-banner-badge');
    const titleEl = document.getElementById('notice-banner-title');
    const msgEl = document.getElementById('notice-banner-msg');
    const subEl = document.getElementById('notice-banner-sub');
    const dismissBtn = document.getElementById('notice-banner-dismiss');

    const adminTitle = document.getElementById('admin-banner-title');
    const adminMsg = document.getElementById('admin-banner-msg');
    const adminSub = document.getElementById('admin-banner-sub');
    const adminApply = document.getElementById('admin-banner-apply');

    function showBanner({ badge, title, message, sub, isEmergency = false }) {
      if (!banner) return;
      banner.classList.toggle('praxis-notice-banner--emergency', isEmergency);
      if (badgeEl) badgeEl.textContent = badge;
      if (titleEl) titleEl.textContent = title ? `${title}: ` : '';
      if (msgEl) msgEl.textContent = message || '';
      if (subEl) subEl.textContent = sub || '';
      banner.hidden = false;
    }

    function hideBanner() {
      if (banner) banner.hidden = true;
    }

    // Initial check: config announcementBanner OR automatic after-hours emergency service
    const now = new Date();
    const dateStr = now.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const emDateBadge = document.getElementById('emergency-date-badge');
    const emLiveStatus = document.getElementById('emergency-live-status');
    if (emDateBadge) {
      emDateBadge.textContent = `Tagesaktuell · ${dateStr}`;
    }
    if (emLiveStatus) {
      emLiveStatus.innerHTML = `Für <strong>heute (${dateStr})</strong> ist die diensthabende Notdienstpraxis für <strong>59423 Unna</strong> direkt über die offizielle Direktabfrage der Zahnärztekammer Westfalen-Lippe hinterlegt oder telefonisch unter <strong>01805 / 98 67 00</strong> erreichbar:`;
    }

    // Optional live check if custom doctor text is set or try fetching KZVWL Unna page
    async function tryFetchLiveEmergencyDoctor() {
      try {
        const res = await fetch('https://www.zahnaerzte-wl.de/notdienstsuche?q=Unna', {
          mode: 'cors',
        });
        if (!res.ok) return;
        const htmlText = await res.text();
        const doc = new DOMParser().parseFromString(htmlText, 'text/html');
        const resultEl =
          doc.querySelector('.notdienst-result, .emergency-result, .search-results, main article') ||
          null;
        if (resultEl && resultEl.textContent && resultEl.textContent.trim().length > 20) {
          const cleanText = resultEl.textContent.replace(/\s+/g, ' ').trim().slice(0, 220);
          if (emLiveStatus) {
            emLiveStatus.innerHTML = `<strong>Heutiger Notdienst Unna (${dateStr}):</strong> ${cleanText}`;
          }
          if (msgEl && !banner?.hidden) {
            msgEl.textContent = `Heutiger Notdienst Unna (${dateStr}): ${cleanText}`;
          }
        }
      } catch {
        // KZVWL blocks cross-origin requests via CORS; fallback with pre-filled Unna link (?q=Unna) and today's date is active
      }
    }
    tryFetchLiveEmergencyDoctor();

    if (cfg.announcementBanner && cfg.announcementBanner.enabled) {
      showBanner({
        badge: cfg.announcementBanner.type === 'vacation' ? '🏖️ Praxisurlaub' : 'Aktueller Hinweis',
        title: cfg.announcementBanner.title,
        message: cfg.announcementBanner.message,
        sub: cfg.announcementBanner.substituteDoctor,
        isEmergency: cfg.announcementBanner.type === 'emergency',
      });
    } else if (cfg.emergencyService && cfg.emergencyService.autoShowWhenClosed) {
      const status = getOpeningStatus(now);
      if (!status.isOpen) {
        showBanner({
          badge: `🦷 Notdienst · ${dateStr}`,
          title: 'Zahnärztlicher Notdienst Unna',
          message: `${status.text}. Die heute diensthabende Notdienstpraxis für Unna finden Sie direkt hier:`,
          sub: '',
          isEmergency: true,
        });
      }
    }

    dismissBtn?.addEventListener('click', hideBanner);

    // Preset Buttons in Pitch Modal
    document.querySelectorAll('[data-banner-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.bannerPreset;
        if (preset === 'vacation') {
          if (adminTitle) adminTitle.value = 'Praxisurlaub & Vertretung';
          if (adminMsg) {
            adminMsg.value =
              'Unsere Praxis befindet sich vom 23.12. bis 02.01. im Weihnachtsurlaub. Ab dem 05.01. sind wir ab 08:00 Uhr wieder für Sie da.';
          }
          if (adminSub) {
            adminSub.value = 'In dringenden Schmerzfällen hilft Ihnen der zahnärztliche Notdienst Unna.';
          }
          showBanner({
            badge: '🏖️ Praxisurlaub',
            title: adminTitle?.value,
            message: adminMsg?.value,
            sub: adminSub?.value,
            isEmergency: false,
          });
        } else if (preset === 'emergency') {
          if (adminTitle) adminTitle.value = 'Zahnärztlicher Notdienst Unna';
          if (adminMsg) {
            adminMsg.value =
              'Unsere Praxis hat aktuell geschlossen. Bei akuten Schmerzen erreichen Sie den offiziellen Notdienst Westfalen-Lippe (KZVWL):';
          }
          if (adminSub) adminSub.value = '';
          showBanner({
            badge: '🦷 Notdienst aktiv',
            title: adminTitle?.value,
            message: adminMsg?.value,
            sub: '',
            isEmergency: true,
          });
        } else if (preset === 'off') {
          hideBanner();
        }
      });
    });

    adminApply?.addEventListener('click', () => {
      showBanner({
        badge: '🏖️ Praxis-Hinweis',
        title: adminTitle?.value || 'Praxis-Hinweis',
        message: adminMsg?.value || '',
        sub: adminSub?.value || '',
        isEmergency: false,
      });
      closeAllModals();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Vorher / Nachher Slider
    const rangeInput = document.getElementById('ba-range-input');
    const beforeLayer = document.getElementById('ba-before-layer');
    const handle = document.getElementById('ba-handle');

    rangeInput?.addEventListener('input', () => {
      const val = `${rangeInput.value}%`;
      if (beforeLayer) beforeLayer.style.width = val;
      if (handle) handle.style.left = val;
    });
  }

  /* ========================================================================
     12. Bewertungs-Karussell (.rbig-carousel) & Vollbild-Lightbox für Praxisfotos
     ======================================================================== */
  function initReviewsCarouselAndLightbox() {
    // 1. Reviews Carousel (auto-rotates every 6s, pauses on hover/focus)
    const carousel = document.getElementById('rbig-carousel');
    if (carousel) {
      const slides = Array.from(carousel.querySelectorAll('[data-rbig-slide]'));
      const dots = Array.from(carousel.querySelectorAll('[data-rbig-dot]'));
      const prevBtn = document.getElementById('rbig-prev');
      const nextBtn = document.getElementById('rbig-next');
      let currentSlide = 0;
      let paused = false;

      function goToSlide(index) {
        currentSlide = (index + slides.length) % slides.length;
        slides.forEach((s, i) => {
          const active = i === currentSlide;
          s.classList.toggle('is-active', active);
          s.hidden = !active;
        });
        dots.forEach((d, i) => {
          d.classList.toggle('is-active', i === currentSlide);
        });
      }

      prevBtn?.addEventListener('click', () => goToSlide(currentSlide - 1));
      nextBtn?.addEventListener('click', () => goToSlide(currentSlide + 1));
      dots.forEach((dot, i) => {
        dot.addEventListener('click', () => goToSlide(i));
      });

      carousel.addEventListener('mouseenter', () => {
        paused = true;
      });
      carousel.addEventListener('mouseleave', () => {
        paused = false;
      });
      carousel.addEventListener('focusin', () => {
        paused = true;
      });
      carousel.addEventListener('focusout', () => {
        paused = false;
      });

      const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduceMotion) {
        setInterval(() => {
          if (!paused && !document.hidden) {
            goToSlide(currentSlide + 1);
          }
        }, 6000);
      }
    }

    // 2. Fullscreen Lightbox for Dr. Braatz's 4 real practice images (inspired by galerie.js)
    const lbDialog = document.getElementById('praxis-lightbox');
    const lbImg = document.getElementById('lb-img');
    const lbCap = document.getElementById('lb-caption');
    const lbClose = document.getElementById('lb-close');
    const lbPrev = document.getElementById('lb-prev');
    const lbNext = document.getElementById('lb-next');

    if (lbDialog && lbImg && typeof lbDialog.showModal === 'function') {
      const photos = Array.from(
        document.querySelectorAll(
          '.hero-visual__photo, .comfort-visual__img, .praxis-tour-viewport__img, .exterior-preview__img'
        )
      );
      let activePhotoIdx = 0;

      function showPhoto(idx) {
        activePhotoIdx = (idx + photos.length) % photos.length;
        const target = photos[activePhotoIdx];
        lbImg.src = target.src;
        lbImg.alt = target.alt;
        if (lbCap) {
          lbCap.textContent = `${target.alt} (${activePhotoIdx + 1} / ${photos.length})`;
        }
      }

      photos.forEach((img, idx) => {
        img.addEventListener('click', () => {
          showPhoto(idx);
          lbDialog.showModal();
        });
      });

      lbClose?.addEventListener('click', () => lbDialog.close());
      lbPrev?.addEventListener('click', () => showPhoto(activePhotoIdx - 1));
      lbNext?.addEventListener('click', () => showPhoto(activePhotoIdx + 1));

      lbDialog.addEventListener('click', (e) => {
        if (e.target === lbDialog || e.target.classList.contains('lb-dialog__inner')) {
          lbDialog.close();
        }
      });

      lbDialog.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') showPhoto(activePhotoIdx + 1);
        else if (e.key === 'ArrowLeft') showPhoto(activePhotoIdx - 1);
      });
    }
  }

  /* Initialize all modules */
  document.addEventListener('DOMContentLoaded', () => {
    initOpeningHours();
    initHeaderAndDrawer();
    initServiceTabs();
    initDoctolib();
    initMapConsent();
    initModals();
    initScrollReveal();
    initPraxisTour();
    initWeatherUnna();
    initAccessibilityAndLanguage();
    initNoticeBannerAndPitchTools();
    initReviewsCarouselAndLightbox();
  });
})();
