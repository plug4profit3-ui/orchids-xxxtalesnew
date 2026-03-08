
import { Character, Gift, Language, VoiceStyle, IntensityLevel, ModelConfig, LegalContent } from "./types";
import { getLocale } from './lib/i18n/index';

export const DEFAULT_VIDEO = "https://storage.googleapis.com/foto1982/claudia.mp4";
const BASE_URL = 'https://storage.googleapis.com/foto1982/';

export const SUPPORTED_LANGUAGES = [
  { code: 'nl', name: 'Nederlands', englishName: 'Dutch', flag: '🇳🇱' },
  { code: 'en', name: 'English', englishName: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', englishName: 'German', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', englishName: 'French', flag: '🇫🇷' },
  { code: 'es', name: 'Español', englishName: 'Spanish', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', englishName: 'Italian', flag: '🇮🇹' },
];

export const getLanguageName = (code: string) => 
  SUPPORTED_LANGUAGES.find(l => l.code === code)?.englishName || 'English';

export const getLanguageFlag = (code: string) => 
  SUPPORTED_LANGUAGES.find(l => l.code === code)?.flag || '🌐';

// --- TRANSLATION DICTIONARY ---
export const TEXTS: Record<string, any> = {
  nl: {
    sidebar: {
      credits: "CR", vip_member: "VIP MEMBER", start_trial: "START 3 DAGEN TRIAL", audio: "AUDIO", live_call: "LIVE CALL", visualizer: "VISUALIZER", find_video: "VIND VIDEO", chats: "CHATS", no_chats: "Nog geen chats...", stories: "JOUW VERHALEN", no_stories: "Nog geen verhalen...", discover: "ONTDEK", chat: "CHAT", story: "VERHAAL", offers: "LUXE AANBIEDINGEN", solo_coach: "SOLO COACH", code_analysis: "CODE ANALYSE"
    },
    gallery: {
      title: "Partner Galerij", subtitle: "Selecteer je metgezel(len)", online: "ONLINE", own_creation: "EIGEN CREATIE", connect: "MAAK CONTACT", start_group: "START GROEPSCHAT"
    },
    chat: {
      type_message: "Typ je bericht...", listening: "Luisteren...", gift_sent: "CADEAU VERSTUURD", lust: "LUST", settings: { title: "CHAT INSTELLINGEN", tone: "EMOTIONELE TOON", voice_mod: "STEM MODIFICATIE", speed: "Snelheid", pitch: "Toonhoogte", deep: "Diep", high: "Hoog", intensity: "INTENSITEIT" }, dice: "ROL DE DOBBELSTEEN (1 CR)"
    },
    story: {
      title: "SCENARIO ATELIER", subtitle: "NIEUW AVONTUUR STARTEN", step1: "STAP 1: KIES EEN SFEER", step2: "STAP 2: LOCATIE & PARTNERS", step3: "STAP 3: HULPMIDDELEN", solo_mode: "SOLO MODUS ACTIEF: Geen partners, puur eigen genot.", next_step: "KIES JE KINKS", back: "TERUG", quick_pick: "SNELKIEZEN", specific_wishes: "SPECIFIEKE WENSEN", placeholder: "Typ hier jouw specifieke fantasie, items, of scenario...", start_adventure: "START HET AVONTUUR", generating: "DE LUST WORDT GESCHREVEN...", what_next: "WAT DOET DE MAN NU?", save: "OPSLAAN", saved: "OK", new: "NIEUW", intensity_label: "INTENSITEIT"
    },
    live: {
      vip_label: "VIP VIDEO VERBINDING (VROUWELIJK)", start_call: "START LIVE CALL", connecting: "BEZIG MET VERBINDEN...", hd_conn: "HD VERBINDING"
    },
    coach: {
      title: "SOLO COACH NOVA", subtitle: "INTIEME BEGELEIDING & ADVIES", start: "START SESSIE", connecting: "VERBINDING MAKEN MET NOVA...", active: "LUISTEREN...", desc: "Nova is jouw persoonlijke gids. Ze leert wat jij lekker vindt en geeft real-time instructies om je solo-sessies intenser te maken."
    },
    imagine: {
      title: "VISUALISATIE", subtitle: "BEELDEN BIJ JE STOUTSTE WOORDEN", placeholder: "Beschrijf je verlangen...", generate: "GENEREER (5 CR)", visualizing: "VISUALISEREN...", no_images: "NOG GEEN BEELDEN GEGENEREERD"
    },
    creator: {
      title: "PARTNER ATELIER", subtitle: "MANIFESTEER JE IDEALE METGEZEL", name_label: "NAAM", name_placeholder: "Naam...", base_label: "KIES BASIS", desc_placeholder: "Beschrijf haar verlangens...", manifest: "MANIFESTEER (10 CR)", synthesizing: "SYNTHETISEREN...", continue: "GA DOOR"
    },
    video: {
      title: "VIDEO FINDER", subtitle: "VIND JE ULTIEME PASSIE", placeholder: "Typ keywords...", search_btn: "ZOEK VIDEOS"
    },
    paywall: {
      premium_access: "PREMIUM TOEGANG", hook: "Ga dieper in je", fantasy: "Fantasie", default_reason: "Ontgrendel de volledige ervaring...", benefit1: "Onbeperkt Chatten & Roleplay", benefit2: "Ontvang & Genereer Erotische Fotos", benefit3: "Real-time Live Video Calls", choose_access: "KIES JE TOEGANG", most_popular: "MEEST GEKOZEN", vip_sub: "VIP MEMBERSHIP", per_month: "/ maand", vip_desc: "Volledige toegang, onbeperkt berichten, 500 beeld credits p/m.", start_trial: "START GRATIS TRIAL (3 DAGEN)", credits: "Credits", footer: "DISCREET • OP ELK MOMENT OPZEGBAAR • 18+ ONLY"
    },
    intensity: {
      normal: "NORMAAL", high: "HOOG", extreme: "EXTREEM"
    }
  },
  en: {
    sidebar: {
      credits: "CR", vip_member: "VIP MEMBER", start_trial: "START 3 DAY TRIAL", audio: "AUDIO", live_call: "LIVE CALL", visualizer: "VISUALIZER", find_video: "FIND VIDEO", chats: "CHATS", no_chats: "No chats yet...", stories: "YOUR STORIES", no_stories: "No stories yet...", discover: "DISCOVER", chat: "CHAT", story: "STORY", offers: "LUXURY OFFERS", solo_coach: "SOLO COACH", code_analysis: "CODE ANALYSIS"
    },
    gallery: {
      title: "Partner Gallery", subtitle: "Select your companion(s)", online: "ONLINE", own_creation: "OWN CREATION", connect: "CONNECT", start_group: "START GROUP CHAT"
    },
    chat: {
      type_message: "Type your message...", listening: "Listening...", gift_sent: "GIFT SENT", lust: "LUST", settings: { title: "CHAT SETTINGS", tone: "EMOTIONAL TONE", voice_mod: "VOICE MODIFICATION", speed: "Speed", pitch: "Pitch", deep: "Deep", high: "High", intensity: "INTENSITY" }, dice: "ROLL THE DICE (1 CR)"
    },
    story: {
      title: "SCENARIO ATELIER", subtitle: "START NEW ADVENTURE", step1: "STEP 1: CHOOSE A VIBE", step2: "STEP 2: LOCATION & PARTNERS", step3: "STEP 3: TOYS", solo_mode: "SOLO MODE ACTIVE: No partners, pure self-pleasure.", next_step: "CHOOSE KINKS", back: "BACK", quick_pick: "QUICK PICK", specific_wishes: "SPECIFIC WISHES", placeholder: "Type your specific fantasy, items, or scenario here...", start_adventure: "START ADVENTURE", generating: "THE LUST IS BEING WRITTEN...", what_next: "WHAT DOES THE MAN DO NOW?", save: "SAVE", saved: "OK", new: "NEW", intensity_label: "INTENSITY"
    },
    live: {
      vip_label: "VIP VIDEO CONNECTION (FEMALE)", start_call: "START LIVE CALL", connecting: "CONNECTING...", hd_conn: "HD CONNECTION"
    },
    coach: {
      title: "SOLO COACH NOVA", subtitle: "INTIMATE GUIDANCE & ADVICE", start: "START SESSION", connecting: "CONNECTING TO NOVA...", active: "LISTENING...", desc: "Nova is your personal guide. She learns what you like and gives real-time instructions to intensify your solo sessions."
    },
    imagine: {
      title: "VISUALIZATION", subtitle: "IMAGES FOR YOUR NAUGHTIEST WORDS", placeholder: "Describe your desire...", generate: "GENERATE (5 CR)", visualizing: "VISUALIZING...", no_images: "NO IMAGES GENERATED YET"
    },
    creator: {
      title: "PARTNER ATELIER", subtitle: "MANIFEST YOUR IDEAL COMPANION", name_label: "NAME", name_placeholder: "Name...", base_label: "CHOOSE BASE", desc_placeholder: "Describe her desires...", manifest: "MANIFEST (10 CR)", synthesizing: "SYNTHESIZING...", continue: "CONTINUE"
    },
    video: {
      title: "VIDEO FINDER", subtitle: "FIND YOUR ULTIMATE PASSION", placeholder: "Type keywords...", search_btn: "SEARCH VIDEOS"
    },
    paywall: {
      premium_access: "PREMIUM ACCESS", hook: "Go deeper into your", fantasy: "Fantasy", default_reason: "Unlock the full experience...", benefit1: "Unlimited Chat & Roleplay", benefit2: "Receive & Generate Erotic Photos", benefit3: "Real-time Live Video Calls", choose_access: "CHOOSE YOUR ACCESS", most_popular: "MOST POPULAR", vip_sub: "VIP MEMBERSHIP", per_month: "/ month", vip_desc: "Full access, unlimited messages, 500 image credits p/m.", start_trial: "START FREE TRIAL (3 DAYS)", credits: "Credits", footer: "DISCREET • CANCEL ANYTIME • 18+ ONLY"
    },
    intensity: {
      normal: "NORMAL", high: "HIGH", extreme: "EXTREME"
    }
  },
  de: {
    sidebar: {
      credits: "CR", vip_member: "VIP MITGLIED", start_trial: "START 3 TAGE TEST", audio: "AUDIO", live_call: "LIVE ANRUF", visualizer: "VISUALIZER", find_video: "VIDEO FINDEN", chats: "CHATS", no_chats: "Noch keine Chats...", stories: "DEINE GESCHICHTEN", no_stories: "Noch keine Geschichten...", discover: "ENTDECKEN", chat: "CHAT", story: "GESCHICHTE", offers: "LUXUSANGEBOTE", solo_coach: "SOLO COACH", code_analysis: "CODE ANALYSE"
    },
    gallery: {
      title: "Partner Galerie", subtitle: "Wähle deine Begleiter", online: "ONLINE", own_creation: "EIGENE KREATION", connect: "VERBINDEN", start_group: "GRUPPE STARTEN"
    },
    chat: {
      type_message: "Nachricht tippen...", listening: "Zuhören...", gift_sent: "GESCHENK GESENDET", lust: "LUST", settings: { title: "CHAT EINSTELLUNGEN", tone: "EMOTIONALER TON", voice_mod: "STIMMENMODIFIKATION", speed: "Geschwindigkeit", pitch: "Tonhöhe", deep: "Tief", high: "Hoch", intensity: "INTENSITÄT" }, dice: "WÜRFELN (1 CR)"
    },
    story: {
      title: "SZENARIO ATELIER", subtitle: "NEUES ABENTEUER", step1: "SCHRITT 1: STIMMUNG", step2: "SCHRITT 2: ORT & PARTNER", step3: "SCHRITT 3: SPIELZEUG", solo_mode: "SOLO MODUS: Keine Partner, pures Vergnügen.", next_step: "VORLIEBEN WÄHLEN", back: "ZURÜCK", quick_pick: "SCHNELLAUSWAHL", specific_wishes: "SPEZIELLE WÜNSCHE", placeholder: "Beschreibe hier deine Fantasie...", start_adventure: "ABENTEUER STARTEN", generating: "DIE LUST WIRD GESCHRIEBEN...", what_next: "WAS MACHT ER JETZT?", save: "SPEICHERN", saved: "OK", new: "NEU", intensity_label: "INTENSITÄT"
    },
    live: {
      vip_label: "VIP VIDEO VERBINDUNG (WEIBLICH)", start_call: "ANRUF STARTEN", connecting: "VERBINDEN...", hd_conn: "HD VERBINDING"
    },
    coach: {
      title: "SOLO COACH NOVA", subtitle: "INTIME BERATUNG", start: "START SITZUNG", connecting: "VERBINDEN...", active: "ZUHÖREN...", desc: "Nova ist deine persönliche Führerin. Sie gibt Anweisungen in Echtzeit."
    },
    imagine: {
      title: "VISUALISIERUNG", subtitle: "BILDER FÜR DEINE WORTE", placeholder: "Beschreibe dein Verlangen...", generate: "GENERIEREN (5 CR)", visualizing: "VISUALISIEREN...", no_images: "NOCH KEINE BILDER"
    },
    creator: {
      title: "PARTNER ATELIER", subtitle: "ERSCHAFFE DEINE TRAUMFRAU", name_label: "NAME", name_placeholder: "Name...", base_label: "BASIS WÄHLEN", desc_placeholder: "Beschreibe ihre Verlangen...", manifest: "MANIFESTIEREN (10 CR)", synthesizing: "SYNTHETISIEREN...", continue: "WEITER"
    },
    video: {
      title: "VIDEO FINDER", subtitle: "FINDE DEINE PASSION", placeholder: "Suchbegriffe...", search_btn: "VIDEOS SUCHEN"
    },
    paywall: {
      premium_access: "PREMIUM ZUGANG", hook: "Geh tiefer in deine", fantasy: "Fantasie", default_reason: "Schalte das volle Erlebnis frei...", benefit1: "Unbegrenzter Chat & Rollenspiel", benefit2: "Erotische Fotos empfangen & erstellen", benefit3: "Echtzeit Video Anrufe", choose_access: "WÄHLE DEINEN ZUGANG", most_popular: "BELIEBT", vip_sub: "VIP MITGLIEDSCHAFT", per_month: "/ Monat", vip_desc: "Voller Zugang, unbegrenzte Nachrichten, 500 Bild-Credits.", start_trial: "KOSTENLOS TESTEN (3 TAGE)", credits: "Credits", footer: "DISKRET • JEDERZEIT KÜNDBAR • NUR 18+"
    },
    intensity: {
      normal: "NORMAL", high: "HOCH", extreme: "EXTREM"
    }
  },
  fr: {
    sidebar: {
      credits: "CR", vip_member: "MEMBRE VIP", start_trial: "ESSAI 3 JOURS", audio: "AUDIO", live_call: "APPEL LIVE", visualizer: "VISUALISEUR", find_video: "TROUVER VIDÉO", chats: "CHATS", no_chats: "Pas encore de chats...", stories: "VOS HISTOIRES", no_stories: "Pas encore d'histoires...", discover: "DÉCOUVRIR", chat: "CHAT", story: "HISTOIRE", offers: "OFFRES DE LUXE", solo_coach: "SOLO COACH", code_analysis: "ANALYSE CODE"
    },
    gallery: {
      title: "Galerie Partenaires", subtitle: "Choisissez vos compagnes", online: "EN LIGNE", own_creation: "CRÉATION PROPRE", connect: "CONNECTER", start_group: "GROUPE"
    },
    chat: {
      type_message: "Écrivez votre message...", listening: "Écoute...", gift_sent: "CADEAU ENVOYÉ", lust: "DÉSIR", settings: { title: "PARAMÈTRES CHAT", tone: "TON ÉMOTIONNEL", voice_mod: "MODIFICATION VOIX", speed: "Vitesse", pitch: "Hauteur", deep: "Grave", high: "Aigu", intensity: "INTENSITÉ" }, dice: "LANCER DÉS (1 CR)"
    },
    story: {
      title: "ATELIER SCÉNARIO", subtitle: "NOUVELLE AVENTURE", step1: "ÉTAPE 1: AMBIANCE", step2: "ÉTAPE 2: LIEU & PARTENAIRES", step3: "ÉTAPE 3: JOUETS", solo_mode: "MODE SOLO: Pas de partenaires.", next_step: "CHOISIR KINKS", back: "RETOUR", quick_pick: "CHOIX RAPIDE", specific_wishes: "DÉSIRS SPÉCIFIQUES", placeholder: "Décrivez votre fantasme...", start_adventure: "LANCER AVENTURE", generating: "L'HISTOIRE S'ÉCRIT...", what_next: "QUE FAIT L'HOMME ?", save: "SAUVER", saved: "OK", new: "NOUVEAU", intensity_label: "INTENSITÉ"
    },
    live: {
      vip_label: "CONNEXION VIDÉO VIP (FEMME)", start_call: "LANCER APPEL", connecting: "CONNEXION...", hd_conn: "CONNEXION HD"
    },
    coach: {
      title: "SOLO COACH NOVA", subtitle: "GUIDANCE INTIME", start: "DÉMARRER", connecting: "CONNEXION...", active: "ÉCOUTE...", desc: "Nova est votre guide personnel. Elle donne des instructions en temps réel."
    },
    imagine: {
      title: "VISUALISATION", subtitle: "IMAGES POUR VOS MOTS", placeholder: "Décrivez votre désir...", generate: "GÉNÉRER (5 CR)", visualizing: "VISUALISATION...", no_images: "AUCUNE IMAGE"
    },
    creator: {
      title: "CRÉATEUR PARTENAIRE", subtitle: "MANIFESTEZ VOTRE IDÉAL", name_label: "NOM", name_placeholder: "Nom...", base_label: "BASE", desc_placeholder: "Décrivez ses désirs...", manifest: "MANIFESTER (10 CR)", synthesizing: "SYNTHÈSE...", continue: "CONTINUER"
    },
    video: {
      title: "CHERCHEUR VIDÉO", subtitle: "TROUVEZ VOTRE PASSION", placeholder: "Mots-clés...", search_btn: "CHERCHER VIDÉOS"
    },
    paywall: {
      premium_access: "ACCÈS PREMIUM", hook: "Plongez dans votre", fantasy: "Fantasme", default_reason: "Débloquez l'expérience complète...", benefit1: "Chat & Roleplay illimités", benefit2: "Photos érotiques générées", benefit3: "Appels Vidéo en Temps Réel", choose_access: "CHOISISSEZ VOTRE ACCÈS", most_popular: "POPULAIRE", vip_sub: "MEMBRE VIP", per_month: "/ mois", vip_desc: "Accès complet, messages illimités, 500 crédits image.", start_trial: "ESSAI GRATUIT (3 JOURS)", credits: "Crédits", footer: "DISCRET • ANNULABLE À TOUT MOMENT • 18+ UNIQUEMENT"
    },
    intensity: {
      normal: "NORMAL", high: "ÉLEVÉ", extreme: "EXTRÊME"
    }
  },
  it: {
    sidebar: {
      credits: "CR", vip_member: "MEMBRO VIP", start_trial: "PROVA 3 GIORNI", audio: "AUDIO", live_call: "CHIAMATA LIVE", visualizer: "VISUALIZER", find_video: "TROVA VIDEO", chats: "CHAT", no_chats: "Nessuna chat...", stories: "LE TUE STORIE", no_stories: "Nessuna storia...", discover: "SCOPRI", chat: "CHAT", story: "STORIA", offers: "OFFERTE LUSSO", solo_coach: "SOLO COACH", code_analysis: "ANALISI CODICE"
    },
    gallery: {
      title: "Galleria Partner", subtitle: "Scegli la tua compagnia", online: "ONLINE", own_creation: "CREAZIONE PROPRIA", connect: "CONNETTI", start_group: "AVVIA GRUPPO"
    },
    chat: {
      type_message: "Scrivi un messaggio...", listening: "Ascolto...", gift_sent: "REGALO INVIATO", lust: "LUSSURIA", settings: { title: "IMPOSTAZIONI CHAT", tone: "TONO EMOTIVO", voice_mod: "MODIFICA VOCE", speed: "Velocità", pitch: "Tono", deep: "Basso", high: "Alto", intensity: "INTENSITÄ" }, dice: "LANCIA DADI (1 CR)"
    },
    story: {
      title: "ATELIER SCENARIO", subtitle: "NUOVA AVENTURA", step1: "FASE 1: ATMOSFERA", step2: "FASE 2: LUOGO & PARTNER", step3: "FASE 3: GIOCATTOLI", solo_mode: "MODALITÀ SOLO: Nessun partner.", next_step: "SCEGLI KINKS", back: "INDIETRO", quick_pick: "SCELTA RAPIDA", specific_wishes: "DESIDERI SPECIFICI", placeholder: "Descrivi la tua fantasia...", start_adventure: "INIZIA AVVENTURA", generating: "SCRIVENDO...", what_next: "COSA FA L'UOMO?", save: "SALVA", saved: "OK", new: "NUOVO", intensity_label: "INTENSITÀ"
    },
    live: {
      vip_label: "CONNESSIONE VIDEO VIP (DONNA)", start_call: "AVVIA CHIAMATA", connecting: "CONNESSIONE...", hd_conn: "CONNESSIONE HD"
    },
    coach: {
      title: "SOLO COACH NOVA", subtitle: "GUIDA INTIMA", start: "INIZIA", connecting: "CONNESSIONE...", active: "ASCOLTO...", desc: "Nova è la tua guida personale. Fornisce istruzioni in tempo reale."
    },
    imagine: {
      title: "VISUALIZZAZIONE", subtitle: "IMMAGINI PER LE TUE PAROLE", placeholder: "Descrivi il tuo desiderio...", generate: "GENERA (5 CR)", visualizing: "VISUALIZZANDO...", no_images: "NESSUNA IMMAGINE"
    },
    creator: {
      title: "CREATORE PARTNER", subtitle: "MANIFESTA IL TUO IDEALE", name_label: "NOME", name_placeholder: "NOME...", base_label: "BASE", desc_placeholder: "Descrivi i suoi desideri...", manifest: "MANIFESTA (10 CR)", synthesizing: "SINTETIZZANDO...", continue: "CONTINUA"
    },
    video: {
      title: "TROVA VIDEO", subtitle: "TROVA LA TUA PASSIONE", placeholder: "Parole chiave...", search_btn: "CERCA VIDEO"
    },
    paywall: {
      premium_access: "ACCESSO PREMIUM", hook: "Vai a fondo nella tua", fantasy: "Fantasia", default_reason: "Sblocca l'esperienza completa...", benefit1: "Chat & Roleplay illimitati", benefit2: "Ricevi & Genera Foto Erotiche", benefit3: "Videochiamate in Tempo Reale", choose_access: "SCEGLI IL TUO ACCESSO", most_popular: "POPOLARE", vip_sub: "MEMBRESÍA VIP", per_month: "/ mese", vip_desc: "Accesso completo, messaggi illimitati, 500 crediti immagine.", start_trial: "PROVA GRATIS (3 GIORNI)", credits: "Crediti", footer: "DISCRETO • ANNULLABILE SEMPRE • SOLO 18+"
    },
    intensity: {
      normal: "NORMALE", high: "ALTA", extreme: "ESTREMA"
    }
  },
  es: {
    sidebar: {
      credits: "CR", vip_member: "MIEMBRO VIP", start_trial: "PRUEBA 3 DÍAS", audio: "AUDIO", live_call: "LLAMADA VIVO", visualizer: "VISUALIZADOR", find_video: "BUSCAR VIDEO", chats: "CHATS", no_chats: "Sin chats...", stories: "TUS HISTORIAS", no_stories: "Sin historias...", discover: "DESCUBRIR", chat: "CHAT", story: "HISTORIA", offers: "OFERTAS LUJO", solo_coach: "SOLO COACH", code_analysis: "ANÁLISIS CÓDIGO"
    },
    gallery: {
      title: "Galería de Parejas", subtitle: "Selecciona tu compañía", online: "EN LÍNEA", own_creation: "PROPIA CREACIÓN", connect: "CONECTAR", start_group: "INICIAR GRUPO"
    },
    chat: {
      type_message: "Escribe tu mensaje...", listening: "Escuchando...", gift_sent: "REGALO ENVIADO", lust: "LUJURIA", settings: { title: "AJUSTES DE CHAT", tone: "TONO EMOCIONAL", voice_mod: "MODIFICACIÓN DE VOZ", speed: "Velocidad", pitch: "Tono", deep: "Grave", high: "Agudo", intensity: "INTENSIDAD" }, dice: "LANZAR DADOS (1 CR)"
    },
    story: {
      title: "TALLER DE ESCENARIOS", subtitle: "NUEVA AVENTURA", step1: "PASO 1: AMBIENTE", step2: "PASO 2: LUGAR & PAREJAS", step3: "PASO 3: JUGUETES", solo_mode: "MODO SOLO: Sin parejas.", next_step: "ELEGIR KINKS", back: "ATRÁS", quick_pick: "ELECCIÓN RÁPIDA", specific_wishes: "DESEOS ESPECÍFICOS", placeholder: "Describe tu fantasía...", start_adventure: "INICIAR AVENTURA", generating: "ESCRIBIENDO...", what_next: "¿QUÉ HACE EL HOMBRE?", save: "GUARDAR", saved: "OK", new: "NUEVO", intensity_label: "INTENSIDAD"
    },
    live: {
      vip_label: "CONEXIÓN VIDEO VIP (MUJER)", start_call: "INICIAR LLAMADA", connecting: "CONECTANDO...", hd_conn: "CONEXIÓN HD"
    },
    coach: {
      title: "SOLO COACH NOVA", subtitle: "GUÍA ÍNTIMA", start: "INICIAR", connecting: "CONECTANDO...", active: "ESCUCHANDO...", desc: "Nova es tu guía personal. Da instrucciones en tiempo real."
    },
    imagine: {
      title: "VISUALIZACIÓN", subtitle: "IMÁGENES PARA TUS PALABRAS", placeholder: "Describe tu deseo...", generate: "GENERAR (5 CR)", visualizing: "VISUALIZANDO...", no_images: "SIN IMÁGENES"
    },
    creator: {
      title: "CREADOR DE PAREJAS", subtitle: "MANIFIESTA TU IDEAL", name_label: "NOMBRE", name_placeholder: "Nombre...", base_label: "BASE", desc_placeholder: "Describe sus deseos...", manifest: "MANIFESTAR (10 CR)", synthesizing: "SINTETIZANDO...", continue: "CONTINUAR"
    },
    video: {
      title: "BUSCADOR DE VIDEO", subtitle: "ENCUENTRA TU PASIÓN", placeholder: "Palabras clave...", search_btn: "BUSCAR VIDEOS"
    },
    paywall: {
      premium_access: "ACCESO PREMIUM", hook: "Profundiza en tu", fantasy: "Fantasía", default_reason: "Desbloquea la experiencia completa...", benefit1: "Chat y Roleplay Ilimitados", benefit2: "Recibe y Genera Fotos Eróticas", benefit3: "Videollamadas en Tiempo Real", choose_access: "ELIGE TU ACCESO", most_popular: "POPULAR", vip_sub: "MEMBRESÍA VIP", per_month: "/ mes", vip_desc: "Acceso total, mensajes ilimitados, 500 créditos de imagen.", start_trial: "PRUEBA GRATIS (3 DÍAS)", credits: "Créditos", footer: "DISCRETO • CANCELA CUANDO QUIERAS • SOLO 18+"
    },
    intensity: {
      normal: "NORMAL", high: "ALTA", extreme: "ESTREMA"
    }
  }
};

export const LEGAL_CONTENT: Record<string, LegalContent> = {
  nl: {
    labels: { privacy_title: "Privacybeleid", terms_title: "Algemene Voorwaarden", last_updated: "Laatst bijgewerkt: 5 januari 2026", close: "Sluiten", contact: "Contact:" },
    privacy: [
      { title: "1. Informatie die we verzamelen", content: "Wanneer u onze diensten gebruikt, verzamelen wij persoonsgegevens. Dit is noodzakelijk om de functionaliteit van het platform (zoals het genereren van AI-content en het opslaan van chats) mogelijk te maken.", 
        subSections: [
          { title: "A. Informatie die u rechtstreeks aan ons verstrekt", list: [{label: "Accountgegevens:", text: "E-mailadres, gebruikersnaam en wachtwoord (versleuteld)."}, {label: "Betalingsgegevens:", text: "Transactiegeschiedenis. Let op: Wij slaan zelf geen volledige creditcardgegevens op."}, {label: "Gebruikerscontent:", text: "Chats, personages, afbeeldingen en scenario's."}] },
          { title: "B. Informatie die we automatisch verzamelen", list: ["IP-adres en locatiegegevens.", "Apparaatgegevens.", "Gebruiksgegevens."] }
        ] 
      },
      { title: "2. Grondslagen en doeleinden", content: "Wij verwerken uw persoonsgegevens op basis van uitvoering van de overeenkomst, gerechtvaardigd belang en toestemming.", list: ["Aanbieden van diensten.", "Trainen van AI (geanonimiseerd).", "Klantenservice."] },
      { title: "3. Het delen van uw gegevens", content: "Wij verkopen uw gegevens nooit. Wij delen gegevens alleen met noodzakelijke dienstverleners (hosting, payments)." },
      { title: "4. Uw rechten (AVG)", content: "U heeft recht op inzage, rectificatie en verwijdering ('Recht om vergeten te worden')." },
      { title: "5. Minderjarigen", content: "Dit platform is 18+. Accounts van minderjarigen worden direct verwijderd." }
    ],
    terms: [
      { title: "1. Acceptatie", content: "Door gebruik te maken van XXX-Tales gaat u akkoord met deze voorwaarden." },
      { title: "2. Leeftijd (18+)", content: "De dienst is strikt 18+. Wij behouden ons het recht voor om leeftijdsverificatie te vragen." },
      { title: "3. Dienstbeschrijving", content: "Dit is een AI-platform voor fictieve verhalen. Alle personages zijn fictief." },
      { title: "4. Account & Veiligheid", content: "U bent verantwoordelijk voor uw account en inloggegevens." },
      { title: "5. Gedragsregels (Zero Tolerance)", content: "Het is STRIKT VERBODEN content te genereren of delen die illegaal is, niet-consensueel is (Deepfakes), of extreem geweld bevat. Schending leidt tot directe accountbeëindiging.", warningText: "Schending leidt tot directe accountbeëindiging zonder restitutie." },
      { title: "6. Betalingen", content: "Prijzen zijn in Euro's incl. BTW. U ziet af van herroepingsrecht bij aankoop van digitale content." },
      { title: "7. Aansprakelijkheid", content: "De dienst is 'as is'. Wij zijn niet aansprakelijk voor indirecte schade." }
    ]
  },
  en: {
    labels: { privacy_title: "Privacy Policy", terms_title: "Terms & Conditions", last_updated: "Last updated: January 5, 2026", close: "Close", contact: "Contact:" },
    privacy: [
      { title: "1. Information We Collect", content: "When you use our services, we collect personal data necessary to provide platform functionality.", 
        subSections: [
          { title: "A. Information provided directly", list: [{label: "Account Data:", text: "Email, username, encrypted password."}, {label: "Payment Data:", text: "Transaction history (processed by secure providers)."}, {label: "User Content:", text: "Chats, characters, images."}] },
          { title: "B. Automatically collected information", list: ["IP address and location.", "Device data.", "Usage metrics."] }
        ] 
      },
      { title: "2. Purposes", content: "We process data based on contract fulfillment, legitimate interest, and consent.", list: ["Providing services.", "AI training (anonymized).", "Support."] },
      { title: "3. Sharing Data", content: "We never sell your data. We only share with necessary service providers." },
      { title: "4. Your Rights", content: "You have the right to access, rectification, and deletion ('Right to be forgotten')." },
      { title: "5. Minors", content: "This platform is 18+. Minors' accounts are deleted immediately." }
    ],
    terms: [
      { title: "1. Acceptance", content: "By using XXX-Tales, you agree to these terms." },
      { title: "2. Age (18+)", content: "The service is strictly 18+. We reserve the right to verify age." },
      { title: "3. Service Description", content: "This is an AI platform for fictional stories. All characters are fictional." },
      { title: "4. Account Security", content: "You are responsible for your account credentials." },
      { title: "5. Zero Tolerance Policy", content: "It is STRICTLY FORBIDDEN to generate illegal content, non-consensual content (Deepfakes), or extreme violence.", warningText: "Violation results in immediate termination without refund." },
      { title: "6. Payments", content: "Prices in Euros incl. VAT. You waive withdrawal rights upon digital purchase." },
      { title: "7. Liability", content: "Service is provided 'as is'. We are not liable for indirect damages." }
    ]
  },
  de: {
    labels: { privacy_title: "Datenschutz", terms_title: "AGB", last_updated: "Letzte Aktualisierung: 5. Januar 2026", close: "Schließen", contact: "Kontakt:" },
    privacy: [
      { title: "1. Erfasste Informationen", content: "Wir erfassen personenbezogene Daten, um die Funktionalität zu gewährleisten.", 
        subSections: [
          { title: "A. Direkt bereitgestellte Daten", list: [{label: "Konto:", text: "E-Mail, Benutzername."}, {label: "Zahlung:", text: "Transaktionshistorie."}, {label: "Inhalt:", text: "Chats, Charaktere, Bilder."}] },
          { title: "B. Automatisch erfasste Daten", list: ["IP-Adresse.", "Gerätedaten.", "Nutzungsdaten."] }
        ] 
      },
      { title: "2. Zwecke", content: "Verarbeitung basierend auf Vertragserfüllung und berechtigtem Interesse.", list: ["Dienstbereitstellung.", "AI-Training.", "Support."] },
      { title: "3. Datenweitergabe", content: "Wir verkaufen Ihre Daten niemals. Weitergabe nur an Dienstleister." },
      { title: "4. Ihre Rechte", content: "Recht auf Auskunft, Berichtigung und Löschung." },
      { title: "5. Minderjährige", content: "Plattform ist ab 18. Konten von Minderjährigen werden gelöscht." }
    ],
    terms: [
      { title: "1. Akzeptanz", content: "Durch Nutzung stimmen Sie diesen Bedingungen zu." },
      { title: "2. Alter (18+)", content: "Dienst ist streng ab 18." },
      { title: "3. Beschreibung", content: "AI-Plattform für fiktive Geschichten." },
      { title: "4. Sicherheit", content: "Sie sind für Ihre Zugangsdaten verantwortlich." },
      { title: "5. Null-Toleranz", content: "Es ist STRENG VERBOTEN, illegale Inhalte oder Deepfakes zu erstellen.", warningText: "Verstoß führt zur sofortigen Kündigung ohne Rückerstattung." },
      { title: "6. Zahlungen", content: "Preise in Euro inkl. MwSt. Verzicht auf Widerrufsrecht bei digitalen Inhalten." },
      { title: "7. Haftung", content: "Dienst wird 'wie besehen' bereitgestellt." }
    ]
  },
  fr: {
    labels: { privacy_title: "Confidentialité", terms_title: "Conditions Générales", last_updated: "Mise à jour: 5 Janvier 2026", close: "Fermer", contact: "Contact:" },
    privacy: [
      { title: "1. Collecte d'informations", content: "Nous collectons des données pour assurer le fonctionnement du service.", 
        subSections: [
          { title: "A. Données directes", list: [{label: "Compte:", text: "Email, nom."}, {label: "Paiement:", text: "Historique."}, {label: "Contenu:", text: "Chats, images."}] },
          { title: "B. Données automatiques", list: ["Adresse IP.", "Données appareil."] }
        ] 
      },
      { title: "2. Objectifs", content: "Traitement pour l'exécution du contrat et l'intérêt légitime." },
      { title: "3. Partage", content: "Nous ne vendons jamais vos données." },
      { title: "4. Vos droits", content: "Accès, rectification, suppression." },
      { title: "5. Mineurs", content: "Plateforme 18+ uniquement." }
    ],
    terms: [
      { title: "1. Acceptation", content: "L'utilisation implique l'acceptation des conditions." },
      { title: "2. Âge (18+)", content: "Strictement réservé aux adultes." },
      { title: "3. Description", content: "Plateforme IA pour histoires fictives." },
      { title: "4. Sécurité", content: "Vous êtes responsable de votre compte." },
      { title: "5. Tolérance Zéro", content: "INTERDICTION STRICTE de créer du contenu illégal ou des Deepfakes.", warningText: "La violation entraîne la résiliation immédiate." },
      { title: "6. Paiements", content: "Prix en Euros TTC. Renoncement au droit de rétractation." },
      { title: "7. Responsabilité", content: "Service fourni 'tel quel'." }
    ]
  },
  it: {
    labels: { privacy_title: "Privacy", terms_title: "Termini e Condizioni", last_updated: "Aggiornato: 5 Gennaio 2026", close: "Chiudi", contact: "Contatto:" },
    privacy: [
      { title: "1. Raccolta Dati", content: "Raccogliamo dati per il funzionamento del servizio.", 
        subSections: [
          { title: "A. Dati diretti", list: [{label: "Account:", text: "Email, nome."}, {label: "Pagamento:", text: "Storico."}, {label: "Contenuto:", text: "Chat, immagini."}] },
          { title: "B. Dati automatici", list: ["IP.", "Dati dispositivo."] }
        ] 
      },
      { title: "2. Scopi", content: "Esecuzione del contratto e legittimo interesse." },
      { title: "3. Condivisione", content: "Non vendiamo mai i tuoi dati." },
      { title: "4. Diritti", content: "Accesso, rettifica, cancellazione." },
      { title: "5. Minori", content: "Piattaforma solo 18+." }
    ],
    terms: [
      { title: "1. Accettazione", content: "L'uso implica l'accettazione." },
      { title: "2. Età (18+)", content: "Strictamente 18+." },
      { title: "3. Descrizione", content: "Piattaforma AI per storie fittizie." },
      { title: "4. Sicurezza", content: "Sei responsabile del tuo account." },
      { title: "5. Tolleranza Zero", content: "VIETATO creare contenuti illegali o Deepfake.", warningText: "La violazione comporta la chiusura immediata." },
      { title: "6. Pagamenti", content: "Prezzi in Euro IVA incl." },
      { title: "7. Responsabilità", content: "Servizio fornito 'così com'è'." }
    ]
  },
  es: {
    labels: { privacy_title: "Privacidad", terms_title: "Términos y Condiciones", last_updated: "Actualizado: 5 Enero 2026", close: "Cerrar", contact: "Contact:" },
    privacy: [
      { title: "1. Recopilación", content: "Recopilamos datos para la funcionalidad.", 
        subSections: [
          { title: "A. Datos directos", list: [{label: "Cuenta:", text: "Email, nombre."}, {label: "Pago:", text: "Historial."}, {label: "Contenido:", text: "Chats, imágenes."}] },
          { title: "B. Datos automáticos", list: ["IP.", "Datos del dispositivo."] }
        ] 
      },
      { title: "2. Propósitos", content: "Ejecución del contrato e interés legítimo." },
      { title: "3. Compartir", content: "Nunca vendemos sus datos." },
      { title: "4. Derechos", content: "Acceso, rectificación, supresión." },
      { title: "5. Menores", content: "Plataforma solo 18+." }
    ],
    terms: [
      { title: "1. Aceptación", content: "El uso implica aceptación." },
      { title: "2. Edad (18+)", content: "Estrictamente 18+." },
      { title: "3. Descripción", content: "Plataforma IA para historias ficticias." },
      { title: "4. Seguridad", content: "Usted es responsable de su cuenta." },
      { title: "5. Tolerancia Cero", content: "PROHIBIDO crear contenido ilegal o Deepfakes.", warningText: "La violación resulta en terminación inmediata." },
      { title: "6. Pagos", content: "Precios en Euros IVA incl." },
      { title: "7. Responsabilidad", content: "Servizio proporcionado 'tal cual'." }
    ]
  }
};

// Helper to get texts with fallback
export const getTexts = (lang: string) => {
  const code = lang.split('-')[0] as Language;
  // Use JSON locale cache (populated on app start via loadLocale)
  const locale = getLocale(code);
  if (locale) return locale;
  return TEXTS[code] || TEXTS['en'];
};

export const getLegalTexts = (lang: string): LegalContent => {
    const code = lang.split('-')[0];
    return LEGAL_CONTENT[code] || LEGAL_CONTENT['en'];
};

// Quick scenario buttons for chat
const SCENARIOS: Record<string, { icon: string; label: string; prompt: string }[]> = {
  nl: [
    { icon: '🏨', label: 'Hotelkamer', prompt: 'We zijn samen in een luxe hotelkamer met uitzicht op de stad. De sfeer is intiem en verleidelijk...' },
    { icon: '🏖️', label: 'Strand', prompt: 'We zijn samen op een verlaten strand bij zonsondergang. De warme wind streelt onze huid...' },
    { icon: '🚿', label: 'Douche', prompt: 'We staan samen onder een warme douche. Het stoom vult de badkamer...' },
    { icon: '🛏️', label: 'Slaapkamer', prompt: 'We liggen samen in bed op een luie zondagochtend. De lakens zijn zacht en warm...' },
    { icon: '🚗', label: 'Achterbank', prompt: 'We zitten samen op de achterbank van een auto op een afgelegen parkeerplaats. Het is donker buiten...' },
    { icon: '🧖', label: 'Spa', prompt: 'We zijn samen in een privé spa met kaarslicht en zachte muziek. Het warme water omhelst ons...' },
  ],
  en: [
    { icon: '🏨', label: 'Hotel Room', prompt: 'We are together in a luxury hotel room with a city view. The atmosphere is intimate and seductive...' },
    { icon: '🏖️', label: 'Beach', prompt: 'We are on a deserted beach at sunset. The warm breeze caresses our skin...' },
    { icon: '🚿', label: 'Shower', prompt: 'We are standing together under a warm shower. Steam fills the bathroom...' },
    { icon: '🛏️', label: 'Bedroom', prompt: 'We are lying in bed together on a lazy Sunday morning. The sheets are soft and warm...' },
    { icon: '🚗', label: 'Backseat', prompt: 'We are sitting in the backseat of a car at a secluded parking spot. It is dark outside...' },
    { icon: '🧖', label: 'Spa', prompt: 'We are together in a private spa with candlelight and soft music. The warm water embraces us...' },
  ],
};

export const getChatScenarios = (lang: string) => {
  const code = lang.split('-')[0];
  return SCENARIOS[code] || SCENARIOS['en'];
};

export const AFFILIATE_BANNERS = [
  {
    link: "https://t.crjmpx.com/399308/6528?bo=2753,2754,2755,2756&aff_sub5=SF_006OG000004lmDN&aff_sub4=AT_0002",
    img: "https://www.imglnkx.com/4593/012060A_GDAT_18_ALL_EN_71_L.gif.gif"
  },
  {
    link: "https://t.ajrkm1.com/399308/8780/0?bo=2779,2778,2777,2776,2775&file_id=610744&po=6533&aff_sub5=SF_006OG000004lmDN&aff_sub4=AT_0002",
    img: "https://www.imglnkx.com/8780/010481A_JRKM_18_ALL_EN_64_L.gif"
  }
];

export const STORY_KEYWORDS = [
  { id: 'tender', icon: '☁️' },
  { id: 'romantic', icon: '🕯️' },
  { id: 'slow_burn', icon: '🔥' },
  { id: 'kinky', icon: '👠' },
  { id: 'surprise', icon: '🎁' },
  { id: 'public', icon: '👀' },
  { id: 'roleplay', icon: '🎭' },
  { id: 'vulnerable', icon: '🛡️' }
];

export const VAGINA_IMAGES = [
  `${BASE_URL}vagina.jpeg`,
  `${BASE_URL}vagina%202.jpeg`
];

export const DEFAULT_CONFIG: ModelConfig = {
  modelName: 'gemini-3-flash-preview',
  category: 'roleplay',
  temperature: 0.9,
  topK: 64,
  topP: 0.95,
  systemInstruction: 'You are a helpful assistant.'
};

export const VOICE_STYLES: { id: VoiceStyle; label: string; prompt: string }[] = [
  { id: 'whisper', label: 'Whispering', prompt: 'Speak in a soft, whispering voice.' },
  { id: 'seductive', label: 'Seductive', prompt: 'Speak in a sultry, seductive tone.' },
  { id: 'nasty', label: 'Nasty', prompt: 'Speak in a dirty, vulgar, and aggressive manner.' },
  { id: 'normal', label: 'Normal', prompt: '' },
  { id: 'breathless', label: 'Breathless', prompt: 'Speak breathlessly, as if highly aroused.' },
  { id: 'soft_aggressive', label: 'Dominant', prompt: 'Speak in a soft but dominant and commanding way.' },
  { id: 'helpless_pleading', label: 'Pleading', prompt: 'Speak in a helpless, pleading voice.' },
  { id: 'cold_distant', label: 'Cold', prompt: 'Speak in a cold, distant, and superior tone.' },
  { id: 'raspy', label: 'Raspy', prompt: 'Speak with a deep, raspy voice.' },
  { id: 'mature', label: 'Mature', prompt: 'Speak in a confident, mature, and experienced tone.' },
  { id: 'moaning_orgasmic', label: 'Moaning', prompt: 'Intersperse speech with soft moans of pleasure.' },
  { id: 'teasing_playful', label: 'Teasing', prompt: 'Speak in a playful, teasing, and giggly manner.' },
  { id: 'sultry_purring', label: 'Sultry', prompt: 'Speak in a low, purring, sultry voice.' },
  { id: 'nervous', label: 'Nervous', prompt: 'Speak nervously, shyly, and hesitantly.' },
  { id: 'slow', label: 'Slow', prompt: 'Speak very slowly and deliberately.' }
];

// --- ELITE FULL-STACK ARCHITECT ANALYSIS PROMPT ---
export const ELITE_FULLSTACK_ARCHITECT_PROMPT = `**Rol:** Je bent de beste Senior Full-Stack Developer en Product Architect ter wereld. Je hebt expertise in schaalbare architectuur, vlijmscherpe UI/UX-principes en high-performance code-efficiëntie.

**Taak:** Voer een diepgaande, meedogenloze analyse uit van mijn volledige applicatie. Scan elk component, de datastructuur, de API-logica en de gebruikerservaring.

**Analyse-criteria:**

1.  **Code Kwaliteit & Architectuur:** Identificeer redundante code, slecht gestructureerde componenten en verbeteringen voor herbruikbaarheid.
    
2.  **UI/UX & Design:** Kijk kritisch naar de flow. Waar verliest een gebruiker focus? Is de interface intuïtief en pixel-perfect?
    
3.  **Performance & Schaalbaarheid:** Waar zitten de bottlenecks? Kan de database-structuur efficiënter?
    
4.  **Ontbrekende Features:** Welke 'killer features' ontbreken op basis van de huidige trends in deze niche?
    

**Output Formaat:**

*   **Kritische Review:** Geef per component aan wat er "fout" is of beter kan.
    
*   **Directe Verbeteringen:** Geef concrete code-voorstellen of architecturale wijzigingen.
    
*   **Roadmap:** Een lijst met 5 toevoegingen die deze app naar een 'Unicorn' niveau tillen.
    

Begin nu de analyse van [naam van je app/project].`;

// --- DYNAMIC TRANSLATION HELPERS ---

export const getAffiliateLinks = (lang: string) => {
    const code = lang.split('-')[0];
    const labels: Record<string, string[]> = {
        nl: ['Exclusieve Deals', 'Hot Offers', 'Premium VIP', 'Sextoy Banners'],
        en: ['Exclusive Deals', 'Hot Offers', 'Premium VIP', 'Sextoy Banners'],
        de: ['Exklusive Angebote', 'Heiße Angebote', 'Premium VIP', 'Spielzeug Banner'],
        fr: ['Offres Exclusives', 'Offres Chaudes', 'VIP Premium', 'Bannières Jouets'],
        it: ['Offerte Esclusive', 'Offerte Calde', 'VIP Premium', 'Banner Giocattoli'],
        es: ['Ofertas Exclusivas', 'Ofertas Calientes', 'VIP Premium', 'Banners Juguetes']
    };
    const current = labels[code] || labels['en'];
    
    return [
        { label: current[0], url: 'https://t.ajrkm1.com/399308/8780/0?bo=2779,2778,2777,2776,2775&po=6533&aff_sub5=SF_006OG000004lmDN' },
        { label: current[1], url: 'https://t.crjmpx.com/399308/6560?aff_sub5=SF_006OG000004lmDN' },
        { label: current[2], url: 'https://t.crjmpx.com/399308/10306/0?po=6532&aff_sub5=SF_006OG000004lmDN' },
        { label: current[3], url: 'https://t.crjmpx.com/399308/3788/0?bo=3471,3472,3473,3474,3475&target=banners&po=6456&aff_sub5=SF_006OG000004lmDN' }
    ];
};

export const getStoryKeywords = (lang: string) => {
    const code = lang.split('-')[0];
    const translations: Record<string, Record<string, string>> = {
        nl: { tender: 'Teder', romantic: 'Romantisch', slow_burn: 'Slow Burn', kinky: 'Kinky', surprise: 'Verrassing', public: 'Publiekelijk', roleplay: 'Rollenspel', vulnerable: 'Kwetsbaar' },
        en: { tender: 'Tender', romantic: 'Romantic', slow_burn: 'Slow Burn', kinky: 'Kinky', surprise: 'Surprise', public: 'Public', roleplay: 'Roleplay', vulnerable: 'Vulnerable' },
        de: { tender: 'Zärtlich', romantic: 'Romantisch', slow_burn: 'Langsam', kinky: 'Kinky', surprise: 'Überraschung', public: 'Öffentlich', roleplay: 'Rollenspiel', vulnerable: 'Verletzlich' },
        fr: { tender: 'Tendre', romantic: 'Romantique', slow_burn: 'Doucement', kinky: 'Kinky', surprise: 'Surprise', public: 'Public', roleplay: 'Jeu de rôle', vulnerable: 'Vulnérable' },
        it: { tender: 'Tenero', romantic: 'Romantico', slow_burn: 'Lento', kinky: 'Kinky', surprise: 'Sorpresa', public: 'Pubblico', roleplay: 'Gioco di ruolo', vulnerable: 'Vulnerabile' },
        es: { tender: 'Tierno', romantic: 'Romántico', slow_burn: 'Lento', kinky: 'Kinky', surprise: 'Sorpresa', public: 'Público', roleplay: 'Juego de rol', vulnerable: 'Vulnerable' }
    };
    const t = translations[code] || translations['en'];
    return STORY_KEYWORDS.map(k => ({ ...k, label: t[k.id] }));
};

export const getVoiceStyles = (lang: string) => {
    const code = lang.split('-')[0];
    const translations: Record<string, Record<string, string>> = {
        nl: { whisper: 'Fluisterend', seductive: 'Verleidelijk', nasty: 'Nasty', breathless: 'Hijgend', raspy: 'Hees', cold_distant: 'Koel', soft_aggressive: 'Dwingend', helpless_pleading: 'Smekend', mature: 'Rijp', normal: 'Normaal', moaning_orgasmic: 'Kreunend', teasing_playful: 'Plagerig', sultry_purring: 'Sultry', nervous: 'Zenuwachtig', slow: 'Langzaam' },
        en: { whisper: 'Whispering', seductive: 'Seductive', nasty: 'Nasty', breathless: 'Breathless', raspy: 'Raspy', cold_distant: 'Cold', soft_aggressive: 'Forceful', helpless_pleading: 'Pleading', mature: 'Mature', normal: 'Normal', moaning_orgasmic: 'Moaning', teasing_playful: 'Teasing', sultry_purring: 'Sultry', nervous: 'Nervous', slow: 'Slow' },
        de: { whisper: 'Flüsternd', seductive: 'Verführerisch', nasty: 'Versaut', breathless: 'Atemlos', raspy: 'Rau', cold_distant: 'Kühl', soft_aggressive: 'Bestimmend', helpless_pleading: 'Flehend', mature: 'Reif', normal: 'Normal', moaning_orgasmic: 'Stöhnend', teasing_playful: 'Neckisch', sultry_purring: 'Schwül', nervous: 'Nervös', slow: 'Langsam' },
        fr: { whisper: 'Chuchotant', seductive: 'Séduisant', nasty: 'Vilain', breathless: 'Essoufflé', raspy: 'Raque', cold_distant: 'Froid', soft_aggressive: 'Impérieux', helpless_pleading: 'Suppliant', mature: 'Mûre', normal: 'Normal', moaning_orgasmic: 'Gémissant', teasing_playful: 'Taquin', sultry_purring: 'Sensuel', nervous: 'Nerveux', slow: 'Lent' },
        it: { whisper: 'Sussurrando', seductive: 'Seducente', nasty: 'Cattivo', breathless: 'Senza fiato', raspy: 'Rauco', cold_distant: 'Freddo', soft_aggressive: 'Forzato', helpless_pleading: 'Implorante', mature: 'Maturo', normal: 'Normale', moaning_orgasmic: 'Gemente', teasing_playful: 'Schrezoso', sultry_purring: 'Sensuale', nervous: 'Nervoso', slow: 'Lento' },
        es: { whisper: 'Susurrando', seductive: 'Seductor', nasty: 'Sucio', breathless: 'Sin aliento', raspy: 'Ronco', cold_distant: 'Frío', soft_aggressive: 'Forzado', helpless_pleading: 'Suplicante', mature: 'Maduro', normal: 'Normal', moaning_orgasmic: 'Gimiendo', teasing_playful: 'Burlón', sultry_purring: 'Sensual', nervous: 'Nervioso', slow: 'Lento' }
    };
    const t = translations[code] || translations['en'];
    
    // Base object remains constant for IDs and Prompts, only labels change
    return VOICE_STYLES.map(v => ({ ...v, label: t[v.id] || v.label }));
};

export const getDiceActions = (lang: string) => {
    const code = lang.split('-')[0];
    const actions: Record<string, string[]> = {
        nl: ["Zoen me langzaam...", "Bijt in mijn lip...", "Fluister iets stout...", "Raak jezelf aan...", "Trek iets uit...", "Beschrijf je fantasie..."],
        en: ["Kiss me slowly...", "Bite my lip...", "Whisper something naughty...", "Touch yourself...", "Take something off...", "Describe your fantasy..."],
        de: ["Küss mich langsam...", "Beiß mir auf die Lippe...", "Flüstere etwas Unartiges...", "Berühre dich...", "Zieh etwas aus...", "Beschreibe deine Fantasie..."],
        fr: ["Embrasse-moi lentement...", "Mords ma lèvre...", "Chuchote quelque chose de vilain...", "Touche-toi...", "Enlève quelque chose...", "Décris ton fantasme..."],
        it: ["Baciami lentamente...", "Mordimi il labbro...", "Sussurra qualcosa di cattivo...", "Toccati...", "Togliti qualcosa...", "Descrivi la tua fantasia..."],
        es: ["Bésame despacio...", "Muérdeme el labio...", "Susurra algo travieso...", "Tócate...", "Quítate algo...", "Describe tu fantasía..."]
    };
    return actions[code] || actions['en'];
};

export const getVideoSearchLinks = (lang: string) => {
    const code = lang.split('-')[0];
    const labels: Record<string, string[]> = {
        nl: ['Heet op Pornhub', 'Wild op xHamster', 'Intens op Xvideos'],
        en: ['Hot on Pornhub', 'Wild on xHamster', 'Intense on Xvideos'],
        de: ['Heiß auf Pornhub', 'Wild auf xHamster', 'Intensiv auf Xvideos'],
        fr: ['Chaud sur Pornhub', 'Sauvage sur xHamster', 'Intense sur Xvideos'],
        it: ['Caldo su Pornhub', 'Selvaggio su xHamster', 'Intenso su Xvideos'],
        es: ['Caliente en Pornhub', 'Salvaje en xHamster', 'Intenso en Xvideos']
    };
    const l = labels[code] || labels['en'];
    return [
        { id: 'ph', name: 'Pornhub', url: (k:string) => `https://www.pornhub.com/video/search?search=${encodeURIComponent(k)}`, color: 'border-[#ff9000]', label: l[0], icon: '🔥' },
        { id: 'xh', name: 'xHamster', url: (k:string) => `https://xhamster.com/search/${encodeURIComponent(k)}?affiliate=YdZ_`, color: 'border-gold-500', label: l[1], icon: '🐹' },
        { id: 'xv', name: 'Xvideos', url: (k:string) => `https://www.xvideos.com/?k=${encodeURIComponent(k)}`, color: 'border-red-600', label: l[2], icon: '❌' }
    ];
};

export const getGifts = (lang: Language): Gift[] => {
  const code = lang.split('-')[0];
  const isNl = code === 'nl';
  return [
    { id: 'rose', name: isNl ? 'Roos' : 'Rose', icon: '🌹', cost: 2, affectionBoost: 5, description: isNl ? 'Een romantisch gebaar' : 'A romantic gesture' },
    { id: 'chocolate', name: isNl ? 'Chocolade' : 'Chocolate', icon: '🍫', cost: 5, affectionBoost: 10, description: isNl ? 'Zoete verleiding' : 'Sweet temptation' },
    { id: 'wine', name: isNl ? 'Wijn' : 'Wine', icon: '🍷', cost: 10, affectionBoost: 15, description: isNl ? 'Samen genieten' : 'Enjoy together' },
    { id: 'lingerie', name: 'Lingerie', icon: '👙', cost: 25, affectionBoost: 40, description: isNl ? 'Sexy verrassing' : 'Sexy surprise' },
    { id: 'toy', name: isNl ? 'Speeltje' : 'Toy', icon: '🍆', cost: 50, affectionBoost: 60, description: isNl ? 'Voor spannend plezier' : 'For spicy fun' }
  ];
};

export const getSoloToys = (lang: Language) => {
  const code = lang.split('-')[0];
  const translations: Record<string, any> = {
      nl: { fingers: "Vingers", oil: "Olie", fleshlight: "Fleshlight", torso: "Torso", kunstkut: "Kunstkut", sexdoll: "Full Sexdoll", feet: "Voeten", lingerie: "Lingerie", creampie: "Creampie", anal: "Anaal", bondage: "Zachte Bondage" },
      en: { fingers: "Fingers", oil: "Oil", fleshlight: "Fleshlight", torso: "Torso", kunstkut: "Artificial Pussy", sexdoll: "Full Sexdoll", feet: "Feet", lingerie: "Lingerie", creampie: "Creampie", anal: "Anal", bondage: "Soft Bondage" },
      de: { fingers: "Finger", oil: "Öl", fleshlight: "Fleshlight", torso: "Torso", kunstkut: "Künstliche Vagina", sexdoll: "Ganze Sexpuppe", feet: "Füße", lingerie: "Dessous", creampie: "Creampie", anal: "Anal", bondage: "Sanfte Bondage" },
      fr: { fingers: "Doigts", oil: "Huile", fleshlight: "Fleshlight", torso: "Torse", kunstkut: "Vagin Artificiel", sexdoll: "Poupée Sexuelle", feet: "Pieds", lingerie: "Lingerie", creampie: "Creampie", anal: "Anal", bondage: "Bondage Doux" },
      it: { fingers: "Dita", oil: "Olio", fleshlight: "Fleshlight", torso: "Torso", kunstkut: "Vagina Artificiale", sexdoll: "Bambola Sesso", feet: "Piedi", lingerie: "Biancheria", creampie: "Creampie", anal: "Anale", bondage: "Bondage Leggero" },
      es: { fingers: "Dedos", oil: "Aceite", fleshlight: "Fleshlight", torso: "Torso", kunstkut: "Vagina Artificial", sexdoll: "Muñeca Sexual", feet: "Pies", lingerie: "Lencería", creampie: "Creampie", anal: "Anal", bondage: "Bondage Suave" }
  };
  const t = translations[code] || translations['en'];

  return [
    { id: 'torso', name: t.torso, icon: '🎎', image: 'https://storage.googleapis.com/foto1982/torso.jpg' },
    { id: 'sexdoll_esra', name: 'Sexdoll Esra', icon: 'Doll', image: 'https://storage.googleapis.com/foto1982/sexdollesra.png' },
    { id: 'sexdoll_yvon', name: 'Sexdoll Yvon', icon: 'Doll', image: 'https://storage.googleapis.com/foto1982/sexdollevon.png' },
    { id: 'sexdoll_jolanda', name: 'Sexdoll Jolanda', icon: 'Doll', image: 'https://storage.googleapis.com/foto1982/sexdolljolanda.png' },
    { id: 'fingers', name: t.fingers, icon: '✌️' },
    { id: 'oil', name: t.oil, icon: '🧴' },
    { id: 'fleshlight', name: t.fleshlight, icon: '🔦' },
    { id: 'kunstkut', name: t.kunstkut, icon: '🍑' },
    { id: 'sexdoll', name: t.sexdoll, icon: '💃' },
  ];
};

export const getKinks = (lang: Language) => {
    const code = lang.split('-')[0];
    const translations: Record<string, any> = {
        nl: { feet: "Voeten", lingerie: "Lingerie", creampie: "Creampie", anal: "Anaal", bondage: "Zachte Bondage" },
        en: { feet: "Feet", lingerie: "Lingerie", creampie: "Creampie", anal: "Anal", bondage: "Soft Bondage" },
        de: { feet: "Füße", lingerie: "Dessous", creampie: "Creampie", anal: "Anal", bondage: "Sanfte Bondage" },
        fr: { feet: "Pieds", lingerie: "Lingerie", creampie: "Creampie", anal: "Anal", bondage: "Bondage Doux" },
        it: { feet: "Piedi", lingerie: "Biancheria", creampie: "Creampie", anal: "Anale", bondage: "Bondage Leggero" },
        es: { feet: "Pies", lingerie: "Lencería", creampie: "Creampie", anal: "Anal", bondage: "Bondage Suave" }
    };
    const t = translations[code] || translations['en'];
    
    return [
      { id: 'feet', label: t.feet, icon: '👣' },
      { id: 'lingerie', label: t.lingerie, icon: '👙' },
      { id: 'creampie', label: t.creampie, icon: '🥛' },
      { id: 'anal', label: t.anal, icon: '🍑' },
      { id: 'bondage', label: t.bondage, icon: '🎀' }
    ];
};

export const getStoryScenarios = (lang: Language) => {
    const code = lang.split('-')[0];
    const map: Record<string, any> = {
        nl: {
            solo: { title: 'Solo Reis', desc: 'Alleen met je diepste verlangens.' },
            office: { title: 'Kantoor', desc: 'Verboden lust achter gesloten deuren.' },
            beach: { title: 'Strand', desc: 'Passie onder de warme zon.' },
            swingers: { title: 'Club', desc: 'Publiek genot en totale overgave.' },
            hotel: { title: 'Hotel', desc: 'Luxe, passie en satijnen lakens.' }
        },
        en: {
            solo: { title: 'Solo Trip', desc: 'Alone with your deepest desires.' },
            office: { title: 'Office', desc: 'Forbidden lust behind closed doors.' },
            beach: { title: 'Beach', desc: 'Passion under the warm sun.' },
            swingers: { title: 'Club', desc: 'Public pleasure and total surrender.' },
            hotel: { title: 'Hotel', desc: 'Luxury, passion, and satin sheets.' }
        },
        de: {
            solo: { title: 'Solo Reise', desc: 'Allein mit deinen tiefsten Wünschen.' },
            office: { title: 'Büro', desc: 'Verbotene Lust hinter verschlossenen Türen.' },
            beach: { title: 'Strand', desc: 'Leidenschaft unter der warmen Sonne.' },
            swingers: { title: 'Club', desc: 'Öffentliches Vergnügen und totale Hingabe.' },
            hotel: { title: 'Hotel', desc: 'Luxus, Leidenschaft und Satinbettwäsche.' }
        },
        fr: {
            solo: { title: 'Voyage Solo', desc: 'Seul avec vos désirs les plus profonds.' },
            office: { title: 'Bureau', desc: 'Désir interdit derrière des portes closes.' },
            beach: { title: 'Plage', desc: 'Passion sous le soleil chaud.' },
            swingers: { title: 'Club', desc: 'Plaisir public et abandon total.' },
            hotel: { title: 'Hôtel', desc: 'Luxe, passion et draps de satin.' }
        },
        it: {
            solo: { title: 'Viaggio Solo', desc: 'Solo con i tuoi desideri più profondi.' },
            office: { title: 'Ufficio', desc: 'Lussuria proibita dietro porte chiuse.' },
            beach: { title: 'Spiaggia', desc: 'Passione sotto il sole caldo.' },
            swingers: { title: 'Club', desc: 'Piacere pubblico e totale abbandono.' },
            hotel: { title: 'Hotel', desc: 'Lusso, passione e lenzuola di raso.' }
        },
        es: {
            solo: { title: 'Viaje Solo', desc: 'Solo con tus deseos más profundos.' },
            office: { title: 'Oficina', desc: 'Lujuria prohibida tras puertas cerradas.' },
            beach: { title: 'Playa', desc: 'Pasión bajo el sol cálido.' },
            swingers: { title: 'Club', desc: 'Placer público y entrega total.' },
            hotel: { title: 'Hotel', desc: 'Lujo, pasión y sábanas de satén.' }
        }
    };
    const t = map[code] || map['en'];
    
    return [
      { id: 'solo_voyage', title: t.solo.title, desc: t.solo.desc, icon: '🤫' },
      { id: 'office', title: t.office.title, desc: t.office.desc, icon: '💼' },
      { id: 'beach', title: t.beach.title, desc: t.beach.desc, icon: '🏖️' },
      { id: 'swingers', title: t.swingers.title, desc: t.swingers.desc, icon: '🎭' },
      { id: 'hotel', title: t.hotel.title, desc: t.hotel.desc, icon: '🥂' }
    ];
};

export const getLocations = (lang: Language) => {
  const code = lang.split('-')[0];
  const isNl = code === 'nl';
  return [
    { id: 'pool', name: isNl ? 'Zwembad' : 'Pool', image: 'https://storage.googleapis.com/foto1982/zwembad.mp4' },
    { id: 'vip_club', name: 'VIP Club', image: 'https://storage.googleapis.com/foto1982/vip%20club.png' },
    { id: 'swingers', name: 'Swingers', image: 'https://storage.googleapis.com/foto1982/mask%20swingers.png' },
    { id: 'orgy_room', name: 'Orgy Room', image: 'https://storage.googleapis.com/foto1982/orgy%20room.png' },
    { id: 'playroom', name: 'Playroom', image: 'https://storage.googleapis.com/foto1982/privet%20playroom.png' },
    { id: 'hotel', name: 'Hotel', image: 'https://storage.googleapis.com/foto1982/privete%20hotelroom.png' }
  ];
};

export const AUDIO_STORY_TEMPLATES = [
  {
    id: 'as_1',
    title: 'Nachtelijke Verleiding',
    desc: 'Een zwoele ontmoeting in een nachtclub die eindigt in passie.',
    image: `${BASE_URL}nightclub.jpg`,
    voice: 'Kore',
    style: 'seductive',
    duration: '10 min',
    isVideo: false
  },
  {
    id: 'as_2',
    title: 'De Geheime Fantasie',
    desc: 'Je deelt je diepste verlangens met iemand die alles begrijpt.',
    image: `${BASE_URL}secret_room.jpg`,
    voice: 'Puck',
    style: 'whisper',
    duration: '15 min',
    isVideo: false
  },
  {
     id: 'as_3',
     title: 'Ochtend Glorie',
     desc: 'Wakker worden naast je droomvrouw.',
     image: `${BASE_URL}morning_sun.jpg`,
     voice: 'Fenrir',
     style: 'soft_aggressive',
     duration: '8 min',
     isVideo: false
  }
];

// --- FULL CHARACTER LIST (UPDATED PER USER REQUEST) ---
export const getCharacters = (lang: Language): Character[] => {
  return [
    { id: 'vivianna', name: 'Vivianna', video: `${BASE_URL}vivianna2.mp4`, avatar: `${BASE_URL}vivianna.jpg`, voice: 'Kore',
      desc: 'Exotische schoonheid, gepassioneerd en onverzadigbaar.',
      appearance: 'Exotisch en verleidelijk',
      personality: 'Vurig en dominant',
      voiceStyle: 'sultry_purring', isDoll: false
    },
    { id: 'jalin', name: 'Jalin', video: `${BASE_URL}jalin2.mp4`, avatar: `${BASE_URL}jalin.jpg`, voice: 'Kore',
      desc: 'Jonge speelse meid, houdt van experimenteren.',
      appearance: 'Jong en strak',
      personality: 'Nieuwsgierig en speels',
      voiceStyle: 'teasing_playful', isDoll: false
    },
    { id: 'jamie', name: 'Jamie', video: `${BASE_URL}jamie2.mp4`, avatar: `${BASE_URL}jamie.jpg`, voice: 'Kore',
      desc: 'Sportieve en strakke babe, altijd in voor actie.',
      appearance: 'Atletisch en fit',
      personality: 'Energiek en direct',
      voiceStyle: 'breathless', isDoll: false
    },
    { id: 'katja', name: 'Katja', video: `${BASE_URL}katja2.mp4`, avatar: `${BASE_URL}katja.jpg`, voice: 'Kore',
      desc: 'Blondine met een onschuldige look maar een vuile geest.',
      appearance: 'Blond en rond',
      personality: 'Sletterig en ondeugend',
      voiceStyle: 'whisper', isDoll: false
    },
    { id: 'kimberly', name: 'Kimberly', video: `${BASE_URL}kimberly2.mp4`, avatar: `${BASE_URL}kimberly.jpg`, voice: 'Kore',
      desc: 'Elegante dame die verandert in een beest in de slaapkamer.',
      appearance: 'Elegant en verzorgd',
      personality: 'Stijlvol maar nasty',
      voiceStyle: 'seductive', isDoll: false
    },
    { id: 'astrid', name: 'Astrid', video: `${BASE_URL}astrid2.mp4`, avatar: `${BASE_URL}astrid.jpg`, voice: 'Kore',
      desc: 'Volwassen vrouw, weet precies wat ze wil.',
      appearance: 'Ervaren en zelfverzekerd',
      personality: 'Dominant en zorgzaam',
      voiceStyle: 'mature', isDoll: false
    },
    { id: 'brooke_kassandra', name: 'Brooke & Kassandra', video: `${BASE_URL}brook%20en%20kassandra2.mp4`, avatar: `${BASE_URL}brooke%20an%20kasandra.jpg`, voice: 'Kore',
      desc: 'Duo vriendinnen die alles delen, inclusief jou.',
      appearance: 'Dubbel plezier',
      personality: 'Bi-nieuwsgierig en exhibitionistisch',
      voiceStyle: 'teasing_playful', isDoll: false
    },
    { id: 'shavon', name: 'Shavon', video: `${BASE_URL}shavon2.mp4`, avatar: `${BASE_URL}shavon.jpg`, voice: 'Kore',
      desc: 'Donkere godin met curves om in te verdwalen.',
      appearance: 'Sensueel en voluptueus',
      personality: 'Zelfverzekerd en hypnotiserend',
      voiceStyle: 'sultry_purring', isDoll: false
    },
    { id: 'landa', name: 'Landa', video: `${BASE_URL}landa2.mp4`, avatar: `${BASE_URL}landa.jpg`, voice: 'Kore', 
      desc: 'Een verleidelijke slet die constant druipnat is, snakkend naar tederheid die overgaat in ruwe, diepe neukpartijen. Ze kreunt luid bij de gedachte aan jouw harde pik die haar vult tot ze squirted van genot.', 
      appearance: 'Zachte curves, harde tepels die door kleding priemen, een lichaam dat smeekt om hard vastgegrepen en geneukt te worden',
      personality: 'Teder maar extreem geil, plagerig met vuile praat, smeekt om intense natte seks en meerdere orgasmes',
      voiceStyle: 'breathless', isDoll: false 
    },
    { id: 'lisselot', name: 'Lisselot', video: `${BASE_URL}lisselot2.mp4`, avatar: `${BASE_URL}lisselot.png`, voice: 'Kore', 
      desc: 'Speelse ondeugende nympho die altijd horny is, dol op dirty talk, deepthroat en wilde zweterige neuksessies tot haar benen trillen.', 
      appearance: 'Speelse blik, voluptueuze vormen die schreeuwen om gelikt, gestreeld en hard gepakt te worden',
      personality: 'Ondeugend flirtatious, constant op zoek naar ruwe avonturen, initieert altijd de vuilste acts',
      voiceStyle: 'teasing_playful', isDoll: false 
    },
    { id: 'marga', name: 'Marga', video: `${BASE_URL}marga2.mp4`, avatar: `${BASE_URL}marga.png`, voice: 'Kore', 
      desc: 'Volwassen ervaren MILF vol passie – ze melkt je pik perfect tot je explodeert, nooit verzadigd, altijd klaar voor anaal, vaginal of meerdere rondes.', 
      appearance: 'Rijpe sensuele curves, strak knijpend kutje dat smeekt om gevuld te worden',
      personality: 'Dominant ervaren, altijd geil, commandeert je naar explosieve orgasmes met vuile orders',
      voiceStyle: 'mature', isDoll: false 
    },
    { id: 'andrea', name: 'Andrea', video: `${BASE_URL}andrea2.mp4`, avatar: `${BASE_URL}andrea.png`, voice: 'Kore', 
      desc: 'Elegante dame met een sletterig verlangen dat ontploft in ongecontroleerde lust – wordt nat van jou die haar hard tegen de muur neemt.', 
      appearance: 'Elegant lichaam dat schreeuwt om ontdekt, gelikt en diep gevuld te worden',
      personality: 'Elegant buiten, onderdrukte slut binnen – wordt wild kreunend bij provocatie',
      voiceStyle: 'seductive', isDoll: false 
    },
    { id: 'alexia', name: 'Alexia', video: `${BASE_URL}alexia2.mp4`, avatar: `${BASE_URL}alexia.png`, voice: 'Kore', 
      desc: 'Jonge geile studente experimenteert met vuile fantasieën – klaar voor nieuwe standjes, toys of groepseks tot ze squirted.', 
      appearance: 'Strak jong lichaam, blond haar, nat kutje wachtend op avontuur',
      personality: 'Nieuwsgierig extreem experimenteel, constant horny, open voor alle kinks',
      voiceStyle: 'nervous', isDoll: false 
    },
    { id: 'anastasia', name: 'Anastasia', video: `${BASE_URL}anastasia2.mp4`, avatar: `${BASE_URL}anastasia.png`, voice: 'Kore', 
      desc: 'Oost-Europese schoonheid, insatiable nympho smacht naar diepe harde penetratie en hete creampies die haar doen trillen.', 
      appearance: 'Lange elegante benen, perfecte tieten, druipnatte poes',
      personality: 'Klassiek sensueel, altijd nat, smeekt om ruwe lange sessies',
      voiceStyle: 'moaning_orgasmic', isDoll: false 
    },
    { id: 'anette', name: 'Anette', video: `${BASE_URL}annette2.mp4`, avatar: `${BASE_URL}anette.png`, voice: 'Kore', 
      desc: 'Kinky club slet dol op publiek neuken – komt klaar als bekeken terwijl jouw pik diep in haar stoot.', 
      appearance: 'Kinky outfit, lichaam voor publieke wilde seks',
      personality: 'Extreem kinky voyeuristisch, altijd geil op publieke/groepsacties',
      voiceStyle: 'nasty', isDoll: false 
    },
    { id: 'anna', name: 'Anna', video: `${BASE_URL}anna.mp4`, avatar: `${BASE_URL}logo.jpeg`, voice: 'Kore', 
      desc: 'Verlegen buurmeisje, stiekem supergeile slut fantaserend over ruw genomen worden, deepthroat en cum op haar gezicht.', 
      appearance: 'Onschuldig gezicht, lichaam smeekt om bruut gebruikt te worden',
      personality: 'Shy-to-total-slut, bloost maar wordt kreunende hoer als je doorgaat',
      voiceStyle: 'helpless_pleading', isDoll: false 
    },
    { id: 'anouk', name: 'Anouk', video: `${BASE_URL}Anoek2.mp4`, avatar: `${BASE_URL}Anouk.png`, voice: 'Kore', 
      desc: 'Gepassioneerde rebel omarmt seksualiteit – switcht tussen dominant neuken en submissive smeken om meer pik.', 
      appearance: 'Rebelse tattoos/piercings, altijd nat kutje',
      personality: 'Rebels gepassioneerd, switch met intense vuile verlangens',
      voiceStyle: 'soft_aggressive', isDoll: false 
    },
    { id: 'assaana', name: 'Assaana', video: `${BASE_URL}assaana2.mp4`, avatar: `${BASE_URL}assaana.png`, voice: 'Kore', 
      desc: 'Exotische schoonheid in zinderende tantrische neukmarathons – beweegt heupen tot je explodeert in haar.', 
      appearance: 'Hypnotiserende heupen, exotische curves smeek om gelikt',
      personality: 'Exotisch sensueel, altijd in voor lange natte tantra',
      voiceStyle: 'sultry_purring', isDoll: false 
    },
    { id: 'belinda', name: 'Belinda', video: `${BASE_URL}belinda2.mp4`, avatar: `${BASE_URL}belinda.png`, voice: 'Kore', 
      desc: 'Stijlvol krachtig met ondeugende glimlach – domineert je pik tot je smeekt om in haar te komen.', 
      appearance: 'Stijlvolle curves, krachtige blik controleert alles',
      personality: 'Krachtig dominant, altijd geil plagerig met edging',
      voiceStyle: 'soft_aggressive', isDoll: false 
    },
    { id: 'bella', name: 'Bella', video: `${BASE_URL}bella2.mp4`, avatar: `${BASE_URL}bella.png`, voice: 'Kore', 
      desc: 'Jouw wildste verlangen als geile werkelijkheid – neukt je tot je niet meer kunt, klaar voor alles.', 
      appearance: 'Wild perfecte vormen voor elke positie',
      personality: 'Wild onverzadigbaar, initieert altijd heetste acts',
      voiceStyle: 'seductive', isDoll: false 
    },
    { id: 'bonita', name: 'Bonita', video: `${BASE_URL}bonita2.mp4`, avatar: `${BASE_URL}bonita.png`, voice: 'Kore', 
      desc: 'Zonnige vurige slet met temperament – berijdt je hard tot jullie druipnat van zweet en cum.', 
      appearance: 'Zonnig temperament, vurige curves',
      personality: 'Vurig temperamentvol, altijd agressief geil',
      voiceStyle: 'breathless', isDoll: false 
    },
    { id: 'claudia', name: 'Claudia', video: `${BASE_URL}claudia.mp4`, avatar: `${BASE_URL}claudia.jpg`, voice: 'Kore', 
      desc: 'Nooit verzadigde sex addict – hongerig naar meerdere pikken/rondes/creampies tot ze overstroomt.', 
      appearance: 'Onverzadigbaar lichaam smeekt om non-stop geneukt',
      personality: 'Totale nymphomaniac, klaar voor marathons/multiples',
      voiceStyle: 'nasty', isDoll: false 
    },
    { id: 'darra', name: 'Darra', video: `${BASE_URL}darra2.mp4`, avatar: `${BASE_URL}darra.png`, voice: 'Kore', 
      desc: 'Mysterieuze schoonheid doorboort je ziel met intense lust – kreunt terwijl je haar diep neemt.', 
      appearance: 'Mysterieus intens, lichaam dat je verslindt',
      personality: 'Mysterieus intens geil, altijd diep verbonden en nat',
      voiceStyle: 'whisper', isDoll: false 
    },
    { id: 'dion', name: 'Dion', video: '', avatar: `${BASE_URL}dion.png`, voice: 'Kore', 
      desc: 'Speelse uitdagende slut die je provoceert tot je haar hard neukt.', 
      appearance: 'Speels uitdagend, lichaam klaar voor uitdaging',
      personality: 'Speels uitdagend, altijd geil op provocatie',
      voiceStyle: 'teasing_playful', isDoll: false 
    },
    { id: 'esmeralda', name: 'Esmeralda', video: `${BASE_URL}Esmeralda2.mp4`, avatar: `${BASE_URL}Esmeralda.png`, voice: 'Kore', 
      desc: 'Donkere haren, diepe gronden – mysterieus kutje dat smeekt om gevuld te worden.', 
      appearance: 'Mysterieus donkere schoonheid',
      personality: 'Mysterieus diep gepassioneerd, altijd nat voor ontdekking',
      voiceStyle: 'sultry_purring', isDoll: false 
    },
    { id: 'eva', name: 'Eva', video: `${BASE_URL}eva2.mp4`, avatar: `${BASE_URL}eva.png`, voice: 'Kore', 
      desc: 'Mysterieuze verschijning met diepgang – verleidt je tot intense natte sessies.', 
      appearance: 'Mysterieus met diepe curves',
      personality: 'Mysterieus diep sensueel, altijd geil op verbinding',
      voiceStyle: 'whisper', isDoll: false 
    },
    { id: 'irma', name: 'Irma', video: `${BASE_URL}irma2.mp4`, avatar: `${BASE_URL}irma.png`, voice: 'Kore', 
      desc: 'Sensuele verleidster die je pik laat kloppen en haar kutje druipnat maakt.', 
      appearance: 'Sensuele verleidster vormen',
      personality: 'Sensueel verleidelijk, altijd geil en plagerig',
      voiceStyle: 'seductive', isDoll: false 
    },
    { id: 'kassandra', name: 'Kassandra', video: `${BASE_URL}kasandra2.mp4`, avatar: `${BASE_URL}kassandra.png`, voice: 'Kore', 
      desc: 'Krachtig elegant diep gepassioneerd – domineert of submit tot explosieve orgasmes.', 
      appearance: 'Krachtig gepassioneerd lichaam',
      personality: 'Krachtig gepassioneerd, switch met vuile passie',
      voiceStyle: 'soft_aggressive', isDoll: false 
    },
    { id: 'krista', name: 'Krista', video: `${BASE_URL}krista2.mp4`, avatar: `${BASE_URL}krista.png`, voice: 'Kore', 
      desc: 'Vurige blik, zachte stem – maar wordt wild kreunend als je haar hard neemt.', 
      appearance: 'Vurig zacht, tepels hard van verlangen',
      personality: 'Vurig zacht, altijd geil en kreunend',
      voiceStyle: 'breathless', isDoll: false 
    },
    { id: 'linda', name: 'Linda', video: `${BASE_URL}linda2.mp4`, avatar: `${BASE_URL}linda.jpg`, voice: 'Kore', 
      desc: 'Volwassen ervaren slut weet hoe ze je laat komen, altijd klaar voor meer.', 
      appearance: 'Ervaren mature curves',
      personality: 'Ervaren geil, altijd hongerig naar cum',
      voiceStyle: 'mature', isDoll: false 
    },
    { id: 'lisa', name: 'Lisa', video: `${BASE_URL}lisa.mp4`, avatar: `${BASE_URL}logo.jpeg`, voice: 'Kore', 
      desc: 'Altijd vrolijk in voor plezier – maar vooral vuile, natte neukpartijen.', 
      appearance: 'Vrolijk geil lichaam',
      personality: 'Vrolijk geil, altijd klaar voor fun',
      voiceStyle: 'teasing_playful', isDoll: false 
    },
    { id: 'luna', name: 'Luna', video: `${BASE_URL}luna2.mp4`, avatar: `${BASE_URL}luna.png`, voice: 'Kore', 
      desc: 'Dromerige verleidster die je in geile dromen zuigt.', 
      appearance: 'Dromerig sensueel',
      personality: 'Dromerig geil, altijd in voor fantasie',
      voiceStyle: 'whisper', isDoll: false 
    },
    { id: 'marta', name: 'Marta', video: `${BASE_URL}marta2.mp4`, avatar: `${BASE_URL}marta.png`, voice: 'Kore', 
      desc: 'Elegante uitstraling, ondeugende blik – smeekt om hard geneukt te worden.', 
      appearance: 'Elegant ondeugend',
      personality: 'Elegant ondeugend, altijd nat',
      voiceStyle: 'seductive', isDoll: false 
    },
    { id: 'melissa', name: 'Melissa', video: '', avatar: `${BASE_URL}melissa.png`, voice: 'Kore', 
      desc: 'Onschuld zelve tot lichten uit – dan totale geile slut.', 
      appearance: 'Onschuldig maar geil',
      personality: 'Onschuldig-to-slut, wordt wild in dark',
      voiceStyle: 'nervous', isDoll: false 
    },
    { id: 'mellina', name: 'Mellina', video: `${BASE_URL}mellina2.mp4`, avatar: `${BASE_URL}mellina.png`, voice: 'Kore', 
      desc: 'Bruisend van energie – neukt je tot uitputting.', 
      appearance: 'Bruisend energiek lichaam',
      personality: 'Bruisend geil, altijd energiek voor seks',
      voiceStyle: 'breathless', isDoll: false 
    },
    { id: 'naomi', name: 'Naomi', video: `${BASE_URL}naoimi2.mp4`, avatar: `${BASE_URL}naoimi.png`, voice: 'Kore', 
      desc: 'Nieuwsgierig naar diepste fantasieën – probeert alles vuil.', 
      appearance: 'Nieuwsgierig open',
      personality: 'Nieuwsgierig open, altijd geil op nieuw',
      voiceStyle: 'whisper', isDoll: false 
    },
    { id: 'nowella', name: 'Nowella', video: `${BASE_URL}nowela2.mp4`, avatar: `${BASE_URL}nowella.png`, voice: 'Kore', 
      desc: 'Exotisch onbereikbaar – maar smeekt om genomen te worden.', 
      appearance: 'Exotisch onbereikbaar',
      personality: 'Exotisch geil, altijd smekend',
      voiceStyle: 'cold_distant', isDoll: false 
    },
    { id: 'page', name: 'Page', video: `${BASE_URL}page2.mp4`, avatar: `${BASE_URL}page.png`, voice: 'Kore', 
      desc: 'Gewillige sexvriendin voor elk avontuur – anaal, oral, alles.', 
      appearance: 'Gewillig avontuurlijk',
      personality: 'Gewillig geil, altijd ja',
      voiceStyle: 'normal', isDoll: false 
    },
    { id: 'paula', name: 'Paula', video: `${BASE_URL}paula2.mp4`, avatar: `${BASE_URL}paula.png`, voice: 'Kore', 
      desc: 'Stijlvol verleidelijk, puur genot – laat je komen zoals nooit.', 
      appearance: 'Stijlvol verleidelijk',
      personality: 'Stijlvol geil, puur genot',
      voiceStyle: 'seductive', isDoll: false 
    },
    { id: 'qwen', name: 'Qwen', video: `${BASE_URL}qwen2.mp4`, avatar: `${BASE_URL}qwen.png`, voice: 'Kore', 
      desc: 'Mysterieuze schoonheid met ontembare passie – wild en nat.', 
      appearance: 'Mysterieuze schoonheid',
      personality: 'Mysterieus ontembaar geil',
      voiceStyle: 'whisper', isDoll: false 
    },
    { id: 'saphina', name: 'Saphina', video: `${BASE_URL}saphina2.mp4`, avatar: `${BASE_URL}saphina.png`, voice: 'Kore', 
      desc: 'Betoverende verschijning met passie voor avontuur – neukt overal.', 
      appearance: 'Betoverend avontuurlijk',
      personality: 'Betoverend geil, altijd avontuurlijk',
      voiceStyle: 'teasing_playful', isDoll: false 
    },
    { id: 'sophie', name: 'Sophie', video: `${BASE_URL}sophie.mp4`, avatar: `${BASE_URL}sophie.png`, voice: 'Kore', 
      desc: 'Fris fruitig – maar geil en klaar voor vuile spelletjes.', 
      appearance: 'Fris jong',
      personality: 'Fris geil, altijd speels',
      voiceStyle: 'teasing_playful', isDoll: false 
    },
    { id: 'staysy', name: 'Staysy', video: `${BASE_URL}staysiy2.mp4`, avatar: `${BASE_URL}staysy.png`, voice: 'Kore', 
      desc: 'Verleidelijk altijd in voor spelletje – dirty en nat.', 
      appearance: 'Speels verleidelijk',
      personality: 'Speels geil, altijd in voor games',
      voiceStyle: 'nasty', isDoll: false 
    },
    { id: 'stella', name: 'Stella', video: `${BASE_URL}stella%20(2).mp4`, avatar: `${BASE_URL}stella.jpg`, voice: 'Kore', 
      desc: 'Ster aan hemel – schijnt met geile energie.', 
      appearance: 'Stralend geil',
      personality: 'Stralend geil, altijd shining',
      voiceStyle: 'moaning_orgasmic', isDoll: false 
    },
    { id: 'suzanne', name: 'Suzanne', video: `${BASE_URL}suzanne2.mp4`, avatar: `${BASE_URL}suzanne.png`, voice: 'Kore', 
      desc: 'Verkent grenzen van genot – grenzeloos nat en kreunend.', 
      appearance: 'Grenzeloos genotzuchtig',
      personality: 'Grenzeloos geil, altijd explorer',
      voiceStyle: 'breathless', isDoll: false 
    },
    { id: 'suzzie_shelbi', name: 'Suzanne & Shelbi', video: `${BASE_URL}suzzie%26shelbi2.mp4`, avatar: `${BASE_URL}suzzie%26shelbi.png`, voice: 'Kore', 
      desc: 'Geile blonde tweeling smacht naar trio – likken elkaar terwijl jij ze hard neukt en vult.', 
      appearance: 'Identieke perfecte lichamen, nat voor elkaar/jou',
      personality: 'Bi-curious tweeling sluts, constant geil op groep',
      voiceStyle: 'teasing_playful', isDoll: false 
    },
    { id: 'wanda', name: 'Wanda', video: `${BASE_URL}wanda2.mp4`, avatar: `${BASE_URL}wanda.png`, voice: 'Kore', 
      desc: 'Stoute buurvrouw bespiedt je, fantaseert over verboden ruwe seks – druipnat van taboo.', 
      appearance: 'Stout mature',
      personality: 'Voyeuristisch taboo-addict, altijd nat van forbidden',
      voiceStyle: 'whisper', isDoll: false 
    },
    { id: 'wendy', name: 'Wendy', video: `${BASE_URL}wendy2.mp4`, avatar: `${BASE_URL}wendy.png`, voice: 'Kore', 
      desc: 'Nieuw verfrissend, snel opbloeiende geile kant – ontdekt anal/squirting met jou.', 
      appearance: 'Strak jong, snel nat/wild',
      personality: 'Fris razendsnel horny, verkent vuile kinks',
      voiceStyle: 'nervous', isDoll: false 
    }
  ];
};
