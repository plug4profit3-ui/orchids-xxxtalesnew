
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Icons from './Icon';
import type { Language } from '../types';

const LANDING_VIDEOS = [
  'https://storage.googleapis.com/foto1982/jamie2.mp4',
  'https://storage.googleapis.com/foto1982/claudia.mp4',
  'https://storage.googleapis.com/foto1982/vivianna2.mp4',
  'https://storage.googleapis.com/foto1982/jalin2.mp4',
  'https://storage.googleapis.com/foto1982/katja2.mp4',
  'https://storage.googleapis.com/foto1982/kimberly2.mp4',
  'https://storage.googleapis.com/foto1982/astrid2.mp4',
  'https://storage.googleapis.com/foto1982/shavon2.mp4',
  'https://storage.googleapis.com/foto1982/landa2.mp4',
  'https://storage.googleapis.com/foto1982/lisselot2.mp4',
  'https://storage.googleapis.com/foto1982/bella2.mp4',
  'https://storage.googleapis.com/foto1982/bonita2.mp4',
  'https://storage.googleapis.com/foto1982/luna2.mp4',
  'https://storage.googleapis.com/foto1982/anastasia2.mp4',
];

// --- TRANSLATIONS ---
const LANDING_TEXTS: Record<string, {
  badge: string;
  heroLine1: string;
  heroLine2: string;
  heroLine3: string;
  heroSub: string;
  startFree: string;
  discoverMore: string;
  users: string;
  usersLabel: string;
  rating: string;
  ratingLabel: string;
  messages: string;
  messagesLabel: string;
  googleBtn: string;
  orEmail: string;
  usernamePlaceholder: string;
  ageConfirm: string;
  ageConfirmBold: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  submitRegister: string;
  submitLogin: string;
  loading: string;
  switchToRegister: string;
  switchToLogin: string;
  privacy: string;
  terms: string;
  navLogin: string;
  navRegister: string;
  featuresTitle: string;
  featuresSub: string;
  feat1Title: string;
  feat1Desc: string;
  feat2Title: string;
  feat2Desc: string;
  feat3Title: string;
  feat3Desc: string;
  reviewsBadge: string;
  reviewsTitle: string;
  reviewsTitleHighlight: string;
  reviewsSub: string;
  testimonials: { name: string; avatar: string; rating: number; text: string }[];
  faqBadge: string;
  faqTitle: string;
  faqTitleHighlight: string;
  faq: { q: string; a: string }[];
  ctaText: string;
  ctaBtn: string;
  footer: string;
}> = {
  nl: {
    badge: '18+ Exclusief Platform',
    heroLine1: 'Ontdek Jouw',
    heroLine2: 'Geheime',
    heroLine3: 'Verlangens',
    heroSub: 'Ongecensureerde AI-gestuurde erotische verhalen en intieme rollenspellen met 40+ verleidelijke karakters. Ervaar fantasieën die tot leven komen.',
    startFree: 'Start Gratis',
    discoverMore: 'Ontdek Meer',
    users: '10.000+',
    usersLabel: 'Gebruikers',
    rating: '4.8 / 5',
    ratingLabel: 'Beoordeling',
    messages: '1M+',
    messagesLabel: 'Berichten',
    googleBtn: 'Doorgaan met Google',
    orEmail: 'OF MET E-MAIL',
    usernamePlaceholder: 'Gebruikersnaam',
    ageConfirm: 'Ik bevestig dat ik ',
    ageConfirmBold: '18 jaar of ouder',
    emailPlaceholder: 'E-mailadres',
    passwordPlaceholder: 'Wachtwoord (min. 6 tekens)',
    submitRegister: 'Maak Gratis Account',
    submitLogin: 'Inloggen',
    loading: 'EVEN GEDULD...',
    switchToRegister: 'Nieuw hier? Maak een account aan',
    switchToLogin: 'Heb je al een account? Log in',
    privacy: 'Privacybeleid',
    terms: 'Voorwaarden',
    navLogin: 'Inloggen',
    navRegister: 'Aanmelden',
    featuresTitle: 'Wat Maakt XXX-Tales',
    featuresSub: 'Premium AI-technologie voor jouw meest persoonlijke fantasieën',
    feat1Title: '40+ Karakters',
    feat1Desc: 'Kies uit een diverse collectie van verleidelijke persoonlijkheden, elk met unieke fantasieën en verlangens die wachten om ontdekt te worden.',
    feat2Title: 'AI Rollenspel',
    feat2Desc: 'Intieme real-time gesprekken waar karakters intelligent reageren op jouw diepste verlangens, zonder censuur of oordeel.',
    feat3Title: 'Verhaal Generatie',
    feat3Desc: 'Laat de AI unieke, gepersonaliseerde erotische verhalen schrijven op basis van jouw specifieke scenario\'s, kinks en favoriete karakters.',
    reviewsBadge: 'Reviews',
    reviewsTitle: 'Wat Onze',
    reviewsTitleHighlight: 'Leden',
    reviewsSub: 'Duizenden tevreden gebruikers gingen je voor',
    testimonials: [
      { name: 'Mark V.', avatar: 'M', rating: 5, text: 'De verhalen zijn ongelooflijk realistisch. De AI begrijpt precies wat ik wil en de karakters voelen echt levensecht aan.' },
      { name: 'Dennis K.', avatar: 'D', rating: 5, text: 'Al maanden VIP-lid. De audio-verhalen met stemmen zijn next level. Beter dan wat ik ooit heb meegemaakt online.' },
      { name: 'Robert J.', avatar: 'R', rating: 4, text: 'Enorme variatie aan karakters en scenario\'s. De group chat feature is heel creatief. Aanrader voor wie iets nieuws zoekt.' },
      { name: 'Stefan B.', avatar: 'S', rating: 5, text: 'Discreet, veilig en de kwaliteit is top. De imagine-functie maakt het helemaal compleet. Beste investering dit jaar.' },
    ],
    faqBadge: 'FAQ',
    faqTitle: 'Veelgestelde',
    faqTitleHighlight: 'Vragen',
    faq: [
      { q: 'Is XXX-Tales gratis te gebruiken?', a: 'Ja! Je kunt gratis beginnen met een beperkt aantal berichten per dag. Met een VIP-abonnement krijg je onbeperkt toegang tot alle karakters, verhalen, audio en premium functies.' },
      { q: 'Hoe werkt de AI precies?', a: 'Onze AI maakt gebruik van geavanceerde taalmodellen die speciaal zijn afgestemd op creatief schrijven en rollenspel. Elk karakter heeft een unieke persoonlijkheid en stijl.' },
      { q: 'Is mijn privacy beschermd?', a: 'Absoluut. Al je gesprekken worden lokaal op je apparaat opgeslagen en worden niet gedeeld met derden. Je kunt op elk moment al je data verwijderen.' },
      { q: 'Kan ik mijn abonnement opzeggen?', a: 'Ja, je kunt je VIP-abonnement op elk moment opzeggen. Er zijn geen verborgen kosten of langetermijnverplichtingen.' },
      { q: 'Welke functies zijn er beschikbaar?', a: 'XXX-Tales biedt: 1-op-1 chat met 40+ karakters, group chats, AI-gegenereerde verhalen met audio, een Imagine-functie voor visuele content, live voice chat en een Solo Coach modus.' },
    ],
    ctaText: 'Nog vragen? Begin gewoon — het is gratis.',
    ctaBtn: 'Start Nu Gratis',
    footer: '© 2026 XXX-Tales AI. Alle rechten voorbehouden.',
  },
  en: {
    badge: '18+ Exclusive Platform',
    heroLine1: 'Discover Your',
    heroLine2: 'Secret',
    heroLine3: 'Desires',
    heroSub: 'Uncensored AI-driven erotic stories and intimate roleplay with 40+ seductive characters. Experience fantasies that come to life.',
    startFree: 'Start Free',
    discoverMore: 'Discover More',
    users: '10,000+',
    usersLabel: 'Users',
    rating: '4.8 / 5',
    ratingLabel: 'Rating',
    messages: '1M+',
    messagesLabel: 'Messages',
    googleBtn: 'Continue with Google',
    orEmail: 'OR WITH EMAIL',
    usernamePlaceholder: 'Username',
    ageConfirm: 'I confirm that I am ',
    ageConfirmBold: '18 years or older',
    emailPlaceholder: 'Email address',
    passwordPlaceholder: 'Password (min. 6 characters)',
    submitRegister: 'Create Free Account',
    submitLogin: 'Log In',
    loading: 'PLEASE WAIT...',
    switchToRegister: 'New here? Create an account',
    switchToLogin: 'Already have an account? Log in',
    privacy: 'Privacy Policy',
    terms: 'Terms',
    navLogin: 'Log In',
    navRegister: 'Sign Up',
    featuresTitle: 'What Makes XXX-Tales',
    featuresSub: 'Premium AI technology for your most personal fantasies',
    feat1Title: '40+ Characters',
    feat1Desc: 'Choose from a diverse collection of seductive personalities, each with unique fantasies and desires waiting to be discovered.',
    feat2Title: 'AI Roleplay',
    feat2Desc: 'Intimate real-time conversations where characters intelligently respond to your deepest desires, without censorship or judgment.',
    feat3Title: 'Story Generation',
    feat3Desc: 'Let the AI write unique, personalized erotic stories based on your specific scenarios, kinks and favourite characters.',
    reviewsBadge: 'Reviews',
    reviewsTitle: 'What Our',
    reviewsTitleHighlight: 'Members',
    reviewsSub: 'Thousands of satisfied users have gone before you',
    testimonials: [
      { name: 'James V.', avatar: 'J', rating: 5, text: 'The stories are incredibly realistic. The AI understands exactly what I want and the characters feel truly lifelike.' },
      { name: 'Daniel K.', avatar: 'D', rating: 5, text: 'VIP member for months. The audio stories with voices are next level. Better than anything I\'ve experienced online.' },
      { name: 'Robert J.', avatar: 'R', rating: 4, text: 'Huge variety of characters and scenarios. The group chat feature is very creative. Recommended for anyone looking for something new.' },
      { name: 'Steven B.', avatar: 'S', rating: 5, text: 'Discreet, safe and top quality. The imagine function makes it complete. Best investment this year.' },
    ],
    faqBadge: 'FAQ',
    faqTitle: 'Frequently Asked',
    faqTitleHighlight: 'Questions',
    faq: [
      { q: 'Is XXX-Tales free to use?', a: 'Yes! You can start for free with a limited number of messages per day. With a VIP subscription you get unlimited access to all characters, stories, audio and premium features.' },
      { q: 'How does the AI work?', a: 'Our AI uses advanced language models specifically tuned for creative writing and roleplay. Each character has a unique personality and style.' },
      { q: 'Is my privacy protected?', a: 'Absolutely. All your conversations are stored locally on your device and are not shared with third parties. You can delete all your data at any time.' },
      { q: 'Can I cancel my subscription?', a: 'Yes, you can cancel your VIP subscription at any time. There are no hidden costs or long-term commitments.' },
      { q: 'What features are available?', a: 'XXX-Tales offers: 1-on-1 chat with 40+ characters, group chats, AI-generated stories with audio, an Imagine feature, live voice chat and a Solo Coach mode.' },
    ],
    ctaText: 'Still questions? Just start — it\'s free.',
    ctaBtn: 'Start Now Free',
    footer: '© 2026 XXX-Tales AI. All rights reserved.',
  },
  de: {
    badge: '18+ Exklusive Plattform',
    heroLine1: 'Entdecke Deine',
    heroLine2: 'Geheimen',
    heroLine3: 'Verlangen',
    heroSub: 'Unzensierte KI-gesteuerte erotische Geschichten und intimes Rollenspiel mit 40+ verführerischen Charakteren. Erlebe Fantasien, die zum Leben erwachen.',
    startFree: 'Kostenlos Starten',
    discoverMore: 'Mehr Entdecken',
    users: '10.000+',
    usersLabel: 'Nutzer',
    rating: '4,8 / 5',
    ratingLabel: 'Bewertung',
    messages: '1Mio+',
    messagesLabel: 'Nachrichten',
    googleBtn: 'Mit Google fortfahren',
    orEmail: 'ODER MIT E-MAIL',
    usernamePlaceholder: 'Benutzername',
    ageConfirm: 'Ich bestätige, dass ich ',
    ageConfirmBold: '18 Jahre oder älter',
    emailPlaceholder: 'E-Mail-Adresse',
    passwordPlaceholder: 'Passwort (min. 6 Zeichen)',
    submitRegister: 'Kostenloses Konto erstellen',
    submitLogin: 'Einloggen',
    loading: 'BITTE WARTEN...',
    switchToRegister: 'Neu hier? Konto erstellen',
    switchToLogin: 'Bereits ein Konto? Einloggen',
    privacy: 'Datenschutz',
    terms: 'AGB',
    navLogin: 'Einloggen',
    navRegister: 'Anmelden',
    featuresTitle: 'Was XXX-Tales',
    featuresSub: 'Premium KI-Technologie für deine persönlichsten Fantasien',
    feat1Title: '40+ Charaktere',
    feat1Desc: 'Wähle aus einer vielfältigen Sammlung verführerischer Persönlichkeiten, jede mit einzigartigen Fantasien und Wünschen.',
    feat2Title: 'KI Rollenspiel',
    feat2Desc: 'Intime Echtzeit-Gespräche, bei denen Charaktere intelligent auf deine tiefsten Wünsche reagieren.',
    feat3Title: 'Geschichte Generierung',
    feat3Desc: 'Lass die KI einzigartige, personalisierte erotische Geschichten basierend auf deinen Szenarien schreiben.',
    reviewsBadge: 'Bewertungen',
    reviewsTitle: 'Was Unsere',
    reviewsTitleHighlight: 'Mitglieder',
    reviewsSub: 'Tausende zufriedene Nutzer waren vor dir',
    testimonials: [
      { name: 'Markus V.', avatar: 'M', rating: 5, text: 'Die Geschichten sind unglaublich realistisch. Die KI versteht genau, was ich will, und die Charaktere fühlen sich wirklich lebendig an.' },
      { name: 'Dennis K.', avatar: 'D', rating: 5, text: 'Seit Monaten VIP-Mitglied. Die Audio-Geschichten mit Stimmen sind next level. Besser als alles, was ich online erlebt habe.' },
      { name: 'Robert J.', avatar: 'R', rating: 4, text: 'Riesige Auswahl an Charakteren und Szenarien. Das Gruppen-Chat-Feature ist sehr kreativ. Empfehlenswert für jeden, der etwas Neues sucht.' },
      { name: 'Stefan B.', avatar: 'S', rating: 5, text: 'Diskret, sicher und top Qualität. Die Imagine-Funktion macht es komplett. Beste Investition dieses Jahr.' },
    ],
    faqBadge: 'FAQ',
    faqTitle: 'Häufig Gestellte',
    faqTitleHighlight: 'Fragen',
    faq: [
      { q: 'Ist XXX-Tales kostenlos nutzbar?', a: 'Ja! Du kannst kostenlos mit einer begrenzten Anzahl von Nachrichten pro Tag beginnen. Mit einem VIP-Abonnement erhältst du unbegrenzten Zugang.' },
      { q: 'Wie funktioniert die KI?', a: 'Unsere KI verwendet fortschrittliche Sprachmodelle, die speziell auf kreatives Schreiben und Rollenspiel abgestimmt sind.' },
      { q: 'Ist meine Privatsphäre geschützt?', a: 'Absolut. Alle deine Gespräche werden lokal auf deinem Gerät gespeichert und nicht mit Dritten geteilt.' },
      { q: 'Kann ich mein Abonnement kündigen?', a: 'Ja, du kannst dein VIP-Abonnement jederzeit kündigen. Es gibt keine versteckten Kosten.' },
      { q: 'Welche Funktionen gibt es?', a: 'XXX-Tales bietet: 1-zu-1-Chat mit 40+ Charakteren, Gruppen-Chats, KI-generierte Geschichten mit Audio, eine Imagine-Funktion und einen Solo-Coach-Modus.' },
    ],
    ctaText: 'Noch Fragen? Fang einfach an — es ist kostenlos.',
    ctaBtn: 'Jetzt Kostenlos Starten',
    footer: '© 2026 XXX-Tales AI. Alle Rechte vorbehalten.',
  },
  fr: {
    badge: 'Plateforme Exclusive 18+',
    heroLine1: 'Découvrez Vos',
    heroLine2: 'Désirs',
    heroLine3: 'Secrets',
    heroSub: 'Histoires érotiques IA non censurées et jeux de rôle intimes avec plus de 40 personnages séduisants. Vivez des fantasmes qui prennent vie.',
    startFree: 'Commencer Gratuitement',
    discoverMore: 'Découvrir Plus',
    users: '10 000+',
    usersLabel: 'Utilisateurs',
    rating: '4,8 / 5',
    ratingLabel: 'Note',
    messages: '1M+',
    messagesLabel: 'Messages',
    googleBtn: 'Continuer avec Google',
    orEmail: 'OU AVEC E-MAIL',
    usernamePlaceholder: "Nom d'utilisateur",
    ageConfirm: 'Je confirme que j\'ai ',
    ageConfirmBold: '18 ans ou plus',
    emailPlaceholder: 'Adresse e-mail',
    passwordPlaceholder: 'Mot de passe (min. 6 caractères)',
    submitRegister: 'Créer un compte gratuit',
    submitLogin: 'Se connecter',
    loading: 'VEUILLEZ PATIENTER...',
    switchToRegister: 'Nouveau ici ? Créer un compte',
    switchToLogin: 'Déjà un compte ? Se connecter',
    privacy: 'Confidentialité',
    terms: 'Conditions',
    navLogin: 'Connexion',
    navRegister: "S'inscrire",
    featuresTitle: 'Ce qui Rend XXX-Tales',
    featuresSub: 'Technologie IA premium pour vos fantasmes les plus personnels',
    feat1Title: '40+ Personnages',
    feat1Desc: 'Choisissez parmi une collection diversifiée de personnalités séduisantes, chacune avec des fantasmes et désirs uniques.',
    feat2Title: 'Jeu de Rôle IA',
    feat2Desc: 'Conversations intimes en temps réel où les personnages répondent intelligemment à vos désirs les plus profonds.',
    feat3Title: 'Génération d\'Histoires',
    feat3Desc: 'Laissez l\'IA écrire des histoires érotiques uniques et personnalisées basées sur vos scénarios spécifiques.',
    reviewsBadge: 'Avis',
    reviewsTitle: 'Ce que Disent Nos',
    reviewsTitleHighlight: 'Membres',
    reviewsSub: 'Des milliers d\'utilisateurs satisfaits vous ont précédé',
    testimonials: [
      { name: 'Marc V.', avatar: 'M', rating: 5, text: 'Les histoires sont incroyablement réalistes. L\'IA comprend exactement ce que je veux et les personnages semblent vraiment vivants.' },
      { name: 'Denis K.', avatar: 'D', rating: 5, text: 'Membre VIP depuis des mois. Les histoires audio avec des voix sont incroyables. Mieux que tout ce que j\'ai vécu en ligne.' },
      { name: 'Robert J.', avatar: 'R', rating: 4, text: 'Énorme variété de personnages et de scénarios. La fonctionnalité de chat de groupe est très créative. Recommandé.' },
      { name: 'Stéphane B.', avatar: 'S', rating: 5, text: 'Discret, sûr et de qualité. La fonction Imagine complète l\'expérience. Meilleur investissement cette année.' },
    ],
    faqBadge: 'FAQ',
    faqTitle: 'Questions',
    faqTitleHighlight: 'Fréquentes',
    faq: [
      { q: 'XXX-Tales est-il gratuit ?', a: 'Oui ! Vous pouvez commencer gratuitement avec un nombre limité de messages par jour. Avec un abonnement VIP, vous obtenez un accès illimité.' },
      { q: 'Comment fonctionne l\'IA ?', a: 'Notre IA utilise des modèles de langage avancés spécialement conçus pour l\'écriture créative et le jeu de rôle.' },
      { q: 'Ma vie privée est-elle protégée ?', a: 'Absolument. Toutes vos conversations sont stockées localement sur votre appareil et ne sont pas partagées avec des tiers.' },
      { q: 'Puis-je annuler mon abonnement ?', a: 'Oui, vous pouvez annuler votre abonnement VIP à tout moment. Il n\'y a pas de frais cachés.' },
      { q: 'Quelles fonctionnalités sont disponibles ?', a: 'XXX-Tales propose : chat 1-sur-1 avec 40+ personnages, chats de groupe, histoires IA avec audio, une fonction Imagine et un mode Solo Coach.' },
    ],
    ctaText: 'Encore des questions ? Commencez simplement — c\'est gratuit.',
    ctaBtn: 'Commencer Maintenant',
    footer: '© 2026 XXX-Tales AI. Tous droits réservés.',
  },
  es: {
    badge: 'Plataforma Exclusiva 18+',
    heroLine1: 'Descubre Tus',
    heroLine2: 'Deseos',
    heroLine3: 'Secretos',
    heroSub: 'Historias eróticas de IA sin censura y juegos de rol íntimos con más de 40 personajes seductores. Experimenta fantasías que cobran vida.',
    startFree: 'Empezar Gratis',
    discoverMore: 'Descubrir Más',
    users: '10.000+',
    usersLabel: 'Usuarios',
    rating: '4,8 / 5',
    ratingLabel: 'Valoración',
    messages: '1M+',
    messagesLabel: 'Mensajes',
    googleBtn: 'Continuar con Google',
    orEmail: 'O CON EMAIL',
    usernamePlaceholder: 'Nombre de usuario',
    ageConfirm: 'Confirmo que tengo ',
    ageConfirmBold: '18 años o más',
    emailPlaceholder: 'Dirección de email',
    passwordPlaceholder: 'Contraseña (mín. 6 caracteres)',
    submitRegister: 'Crear cuenta gratuita',
    submitLogin: 'Iniciar sesión',
    loading: 'UN MOMENTO...',
    switchToRegister: '¿Nuevo aquí? Crear una cuenta',
    switchToLogin: '¿Ya tienes cuenta? Iniciar sesión',
    privacy: 'Privacidad',
    terms: 'Términos',
    navLogin: 'Iniciar sesión',
    navRegister: 'Registrarse',
    featuresTitle: 'Qué Hace Único a XXX-Tales',
    featuresSub: 'Tecnología IA premium para tus fantasías más personales',
    feat1Title: '40+ Personajes',
    feat1Desc: 'Elige entre una colección diversa de personalidades seductoras, cada una con fantasías y deseos únicos esperando ser descubiertos.',
    feat2Title: 'Juego de Rol IA',
    feat2Desc: 'Conversaciones íntimas en tiempo real donde los personajes responden inteligentemente a tus deseos más profundos.',
    feat3Title: 'Generación de Historias',
    feat3Desc: 'Deja que la IA escriba historias eróticas únicas y personalizadas basadas en tus escenarios, preferencias y personajes favoritos.',
    reviewsBadge: 'Reseñas',
    reviewsTitle: 'Lo Que Dicen Nuestros',
    reviewsTitleHighlight: 'Miembros',
    reviewsSub: 'Miles de usuarios satisfechos te han precedido',
    testimonials: [
      { name: 'Marcos V.', avatar: 'M', rating: 5, text: 'Las historias son increíblemente realistas. La IA entiende exactamente lo que quiero y los personajes se sienten verdaderamente vivos.' },
      { name: 'Diego K.', avatar: 'D', rating: 5, text: 'Miembro VIP durante meses. Las historias de audio con voces son increíbles. Mejor que cualquier cosa que haya experimentado en línea.' },
      { name: 'Roberto J.', avatar: 'R', rating: 4, text: 'Gran variedad de personajes y escenarios. La función de chat grupal es muy creativa. Recomendado para quien busca algo nuevo.' },
      { name: 'Esteban B.', avatar: 'S', rating: 5, text: 'Discreto, seguro y de máxima calidad. La función imaginar lo hace completo. La mejor inversión de este año.' },
    ],
    faqBadge: 'FAQ',
    faqTitle: 'Preguntas',
    faqTitleHighlight: 'Frecuentes',
    faq: [
      { q: '¿Es XXX-Tales gratuito?', a: 'Sí. Puedes empezar gratis con un número limitado de mensajes al día. Con una suscripción VIP obtienes acceso ilimitado a todos los personajes, historias, audio y funciones premium.' },
      { q: '¿Cómo funciona la IA?', a: 'Nuestra IA utiliza modelos de lenguaje avanzados especialmente ajustados para la escritura creativa y el juego de rol.' },
      { q: '¿Está protegida mi privacidad?', a: 'Absolutamente. Todas tus conversaciones se almacenan localmente en tu dispositivo y no se comparten con terceros.' },
      { q: '¿Puedo cancelar mi suscripción?', a: 'Sí, puedes cancelar tu suscripción VIP en cualquier momento. No hay costos ocultos ni compromisos a largo plazo.' },
      { q: '¿Qué funciones están disponibles?', a: 'XXX-Tales ofrece: chat 1 a 1 con 40+ personajes, chats grupales, historias IA con audio, una función Imaginar, chat de voz en vivo y un modo Solo Coach.' },
    ],
    ctaText: '¿Más preguntas? Empieza — es gratis.',
    ctaBtn: 'Empieza Ahora Gratis',
    footer: '© 2026 XXX-Tales AI. Todos los derechos reservados.',
  },
  it: {
    badge: 'Piattaforma Esclusiva 18+',
    heroLine1: 'Scopri I Tuoi',
    heroLine2: 'Desideri',
    heroLine3: 'Segreti',
    heroSub: 'Storie erotiche AI non censurate e giochi di ruolo intimi con oltre 40 personaggi seducenti. Vivi fantasie che prendono vita.',
    startFree: 'Inizia Gratis',
    discoverMore: 'Scopri di Più',
    users: '10.000+',
    usersLabel: 'Utenti',
    rating: '4,8 / 5',
    ratingLabel: 'Valutazione',
    messages: '1M+',
    messagesLabel: 'Messaggi',
    googleBtn: 'Continua con Google',
    orEmail: 'O CON EMAIL',
    usernamePlaceholder: 'Nome utente',
    ageConfirm: 'Confermo di avere ',
    ageConfirmBold: '18 anni o più',
    emailPlaceholder: 'Indirizzo email',
    passwordPlaceholder: 'Password (min. 6 caratteri)',
    submitRegister: 'Crea account gratuito',
    submitLogin: 'Accedi',
    loading: 'ATTENDERE...',
    switchToRegister: 'Nuovo qui? Crea un account',
    switchToLogin: 'Hai già un account? Accedi',
    privacy: 'Privacy',
    terms: 'Termini',
    navLogin: 'Accedi',
    navRegister: 'Iscriviti',
    featuresTitle: 'Cosa Rende XXX-Tales',
    featuresSub: 'Tecnologia AI premium per le tue fantasie più personali',
    feat1Title: '40+ Personaggi',
    feat1Desc: 'Scegli tra una collezione diversificata di personalità seducenti, ognuna con fantasie e desideri unici in attesa di essere scoperti.',
    feat2Title: 'Gioco di Ruolo AI',
    feat2Desc: 'Conversazioni intime in tempo reale dove i personaggi rispondono intelligentemente ai tuoi desideri più profondi.',
    feat3Title: 'Generazione di Storie',
    feat3Desc: 'Lascia che l\'AI scriva storie erotiche uniche e personalizzate basate sui tuoi scenari e personaggi preferiti.',
    reviewsBadge: 'Recensioni',
    reviewsTitle: 'Cosa Dicono I Nostri',
    reviewsTitleHighlight: 'Membri',
    reviewsSub: 'Migliaia di utenti soddisfatti ti hanno preceduto',
    testimonials: [
      { name: 'Marco V.', avatar: 'M', rating: 5, text: 'Le storie sono incredibilmente realistiche. L\'AI capisce esattamente cosa voglio e i personaggi sembrano davvero vivi.' },
      { name: 'Davide K.', avatar: 'D', rating: 5, text: 'Membro VIP da mesi. Le storie audio con le voci sono al livello successivo. Meglio di qualsiasi cosa abbia vissuto online.' },
      { name: 'Roberto J.', avatar: 'R', rating: 4, text: 'Enorme varietà di personaggi e scenari. La funzione chat di gruppo è molto creativa. Consigliato per chi cerca qualcosa di nuovo.' },
      { name: 'Stefano B.', avatar: 'S', rating: 5, text: 'Discreto, sicuro e di qualità superiore. La funzione Imagine lo completa. Il miglior investimento dell\'anno.' },
    ],
    faqBadge: 'FAQ',
    faqTitle: 'Domande',
    faqTitleHighlight: 'Frequenti',
    faq: [
      { q: 'XXX-Tales è gratuito?', a: 'Sì! Puoi iniziare gratuitamente con un numero limitato di messaggi al giorno. Con un abbonamento VIP ottieni accesso illimitato a tutti i personaggi, storie, audio e funzioni premium.' },
      { q: 'Come funziona l\'AI?', a: 'La nostra AI utilizza modelli linguistici avanzati appositamente sintonizzati per la scrittura creativa e il gioco di ruolo.' },
      { q: 'La mia privacy è protetta?', a: 'Assolutamente. Tutte le tue conversazioni sono memorizzate localmente sul tuo dispositivo e non vengono condivise con terze parti.' },
      { q: 'Posso annullare l\'abbonamento?', a: 'Sì, puoi annullare il tuo abbonamento VIP in qualsiasi momento. Non ci sono costi nascosti.' },
      { q: 'Quali funzioni sono disponibili?', a: 'XXX-Tales offre: chat 1-a-1 con 40+ personaggi, chat di gruppo, storie AI con audio, una funzione Imagine, chat vocale live e una modalità Solo Coach.' },
    ],
    ctaText: 'Ancora domande? Inizia semplicemente — è gratuito.',
    ctaBtn: 'Inizia Ora Gratis',
    footer: '© 2026 XXX-Tales AI. Tutti i diritti riservati.',
  },
};

const getT = (language?: Language) => {
  const code = (language || 'nl').split('-')[0];
  return LANDING_TEXTS[code] || LANDING_TEXTS['nl'];
};

interface LandingPageProps {
  authScreen: 'login' | 'register';
  setAuthScreen: (screen: 'login' | 'register') => void;
  handleAuthSubmit: (e: React.FormEvent) => void;
  handleGoogleLogin: () => void;
  isAgeAccepted: boolean;
  setIsAgeAccepted: (val: boolean) => void;
  authName: string;
  setAuthName: (val: string) => void;
  authEmail: string;
  setAuthEmail: (val: string) => void;
  authPassword: string;
  setAuthPassword: (val: string) => void;
  authLoading: boolean;
  authError: string;
  onOpenLegal: (tab: 'privacy' | 'terms') => void;
  language?: Language;
}

const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden bg-zinc-900/40 hover:border-white/20 transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 md:p-6 text-left"
      >
        <span className="text-white font-bold text-sm md:text-base pr-4">{q}</span>
        <div className={`shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
          <Icons.ChevronDown className="text-zinc-400" size={20} />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="px-5 md:px-6 pb-5 md:pb-6 text-zinc-400 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({
  authScreen,
  setAuthScreen,
  handleAuthSubmit,
  handleGoogleLogin,
  isAgeAccepted,
  setIsAgeAccepted,
  authName,
  setAuthName,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authLoading,
  authError,
  onOpenLegal,
  language,
}) => {
  const t = getT(language);

  const [videoIdx, setVideoIdx] = useState(0);
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);

  const advanceVideo = useCallback(() => {
    setVideoIdx(prev => {
      const next = (prev + 1) % LANDING_VIDEOS.length;
      const incoming = activeSlot === 0 ? videoBRef.current : videoARef.current;
      if (incoming) {
        incoming.src = LANDING_VIDEOS[next];
        incoming.load();
        incoming.play().catch(() => {});
      }
      setActiveSlot(s => (s === 0 ? 1 : 0) as 0 | 1);
      return next;
    });
  }, [activeSlot]);

  useEffect(() => {
    const timer = setInterval(advanceVideo, 8000);
    return () => clearInterval(timer);
  }, [advanceVideo]);

  const scrollToForm = () => {
    if (authScreen === 'login') setAuthScreen('register');
    const formElement = document.getElementById('auth-form');
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const scrollToFeatures = () => {
    const el = document.getElementById('features');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="h-full w-full bg-black overflow-y-auto no-scrollbar relative flex flex-col">
      {/* Background Video Crossfade */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/80 to-black z-10" />
        <video
          ref={videoARef}
          src={LANDING_VIDEOS[0]}
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms]"
          style={{ opacity: activeSlot === 0 ? 0.6 : 0 }}
        />
        <video
          ref={videoBRef}
          muted playsInline loop
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms]"
          style={{ opacity: activeSlot === 1 ? 0.6 : 0 }}
        />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="https://storage.googleapis.com/foto1982/logo.jpeg" className="w-10 h-10 rounded-lg border border-gold-500/30 object-cover shadow-lg" alt="Logo" />
          <span className="font-headline font-black text-xl text-shine tracking-tighter hidden md:block">XXX-Tales</span>
        </div>
        <div className="flex gap-4">
          {authScreen === 'register' ? (
            <button onClick={() => setAuthScreen('login')} className="px-6 py-2 rounded-full border border-white/10 bg-black/40 text-xs font-bold text-white hover:text-gold-500 hover:border-gold-500/50 uppercase tracking-widest transition-all backdrop-blur-md">{t.navLogin}</button>
          ) : (
            <button onClick={scrollToForm} className="px-6 py-2 btn-premium rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">{t.navRegister}</button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-40 flex flex-col items-center justify-center px-4 pt-10 pb-20 w-full max-w-5xl mx-auto text-center mt-8 md:mt-16">
        <div className="space-y-8 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-950/30 backdrop-blur-md mb-2 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
            <Icons.Lock size={12} className="text-red-500" />
            <span className="text-[10px] font-black text-red-200 uppercase tracking-[0.2em]">{t.badge}</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-headline font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl">
            {t.heroLine1} <br className="md:hidden" />
            <span className="text-red-600 inline-block filter drop-shadow-[0_0_25px_rgba(220,38,38,0.6)]">{t.heroLine2}</span> <br />
            <span className="text-red-600 filter drop-shadow-[0_0_25px_rgba(220,38,38,0.6)]">{t.heroLine3}</span>
          </h1>

          <p className="max-w-2xl mx-auto text-zinc-300 text-sm md:text-lg leading-relaxed font-body font-medium">
            {t.heroSub}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button onClick={scrollToForm} className="w-full sm:w-auto px-12 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest shadow-[0_0_40px_rgba(220,38,38,0.4)] transition-all transform hover:scale-105 active:scale-95">
              {t.startFree}
            </button>
            <button onClick={scrollToFeatures} className="w-full sm:w-auto px-12 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-white rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest backdrop-blur-md transition-all active:scale-95">
              {t.discoverMore}
            </button>
          </div>
        </div>

        {/* Social Proof Bar */}
        <div className="w-full max-w-2xl mx-auto mb-16 flex flex-wrap items-center justify-center gap-6 md:gap-10">
          <div className="flex items-center gap-2">
            <Icons.Users className="text-gold-500" size={20} />
            <div className="text-left">
              <p className="text-white font-black text-lg leading-tight">{t.users}</p>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">{t.usersLabel}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-white/10 hidden md:block" />
          <div className="flex items-center gap-2">
            <Icons.Star className="text-gold-500" size={20} />
            <div className="text-left">
              <p className="text-white font-black text-lg leading-tight">{t.rating}</p>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">{t.ratingLabel}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-white/10 hidden md:block" />
          <div className="flex items-center gap-2">
            <Icons.MessageCircle className="text-gold-500" size={20} />
            <div className="text-left">
              <p className="text-white font-black text-lg leading-tight">{t.messages}</p>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">{t.messagesLabel}</p>
            </div>
          </div>
        </div>

        {/* Auth Form */}
        <div id="auth-form" className="w-full max-w-md mx-auto glass-premium p-8 md:p-10 rounded-[2.5rem] border-gold-500/30 shadow-2xl animate-in zoom-in-95 duration-500 relative bg-black/40 backdrop-blur-xl">
          {authError && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-center font-medium">
              {authError}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full h-12 mb-6 flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-zinc-800 font-bold text-sm">{t.googleBtn}</span>
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{t.orEmail}</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
            {authScreen === 'register' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                <div className="relative group">
                  <Icons.User className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-gold-500 transition-colors" size={18} />
                  <input type="text" value={authName} onChange={e => setAuthName(e.target.value)} placeholder={t.usernamePlaceholder} className="w-full bg-black/60 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm outline-none focus:border-gold-500/50 transition-colors placeholder-zinc-600" required />
                </div>

                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setIsAgeAccepted(!isAgeAccepted)}>
                  <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${isAgeAccepted ? 'bg-gold-500 border-gold-500 text-black' : 'border-zinc-600 bg-black'}`}>
                    {isAgeAccepted && <Icons.Check size={14} strokeWidth={4} />}
                  </div>
                  <span className="text-[11px] text-zinc-400 select-none leading-tight mt-0.5">
                    {t.ageConfirm}<span className="text-white font-bold">{t.ageConfirmBold}</span> {language === 'nl' ? 'ben en akkoord ga met de voorwaarden.' : language === 'de' ? 'bin und den Bedingungen zustimme.' : language === 'fr' ? 'et accepte les conditions.' : language === 'es' ? 'y acepto los términos.' : language === 'it' ? 'e accetto i termini.' : 'and agree to the terms.'}
                  </span>
                </div>
              </div>
            )}

            <div className="relative group">
              <Icons.Mail className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-gold-500 transition-colors" size={18} />
              <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder={t.emailPlaceholder} className="w-full bg-black/60 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm outline-none focus:border-gold-500/50 transition-colors placeholder-zinc-600" required />
            </div>

            <div className="relative group">
              <Icons.Lock className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-gold-500 transition-colors" size={18} />
              <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder={t.passwordPlaceholder} minLength={6} className="w-full bg-black/60 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm outline-none focus:border-gold-500/50 transition-colors placeholder-zinc-600" required />
            </div>

            <button type="submit" disabled={authLoading} className="w-full py-4 btn-premium rounded-xl font-black text-[11px] uppercase tracking-widest mt-4 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
              {authLoading ? t.loading : authScreen === 'register' ? t.submitRegister : t.submitLogin}
            </button>
          </form>

          <button onClick={() => setAuthScreen(authScreen === 'login' ? 'register' : 'login')} className="mt-8 text-[10px] text-zinc-500 uppercase font-black tracking-widest hover:text-gold-500 transition-colors w-full text-center">
            {authScreen === 'login' ? t.switchToRegister : t.switchToLogin}
          </button>

          <div className="flex justify-center gap-6 mt-8 pt-6 border-t border-white/10">
            <button onClick={() => onOpenLegal('privacy')} className="text-[9px] text-zinc-600 hover:text-zinc-300 uppercase font-bold tracking-widest transition-colors">{t.privacy}</button>
            <button onClick={() => onOpenLegal('terms')} className="text-[9px] text-zinc-600 hover:text-zinc-300 uppercase font-bold tracking-widest transition-colors">{t.terms}</button>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative z-40 bg-black py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-headline font-black text-white">{t.featuresTitle} <span className="text-gold-500">Uniek</span>?</h2>
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] font-bold">{t.featuresSub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-zinc-900/40 border border-white/10 rounded-[2rem] p-8 hover:border-red-500/50 transition-all group hover:bg-zinc-900/60">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-900/10 border border-red-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(220,38,38,0.1)]">
                <Icons.Flame className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-headline font-bold text-white mb-4">{t.feat1Title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{t.feat1Desc}</p>
            </div>

            <div className="bg-zinc-900/40 border border-white/10 rounded-[2rem] p-8 hover:border-gold-500/50 transition-all group hover:bg-zinc-900/60">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500/10 to-gold-900/10 border border-gold-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(255,215,0,0.1)]">
                <Icons.Sparkles className="text-gold-500" size={32} />
              </div>
              <h3 className="text-xl font-headline font-bold text-white mb-4">{t.feat2Title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{t.feat2Desc}</p>
            </div>

            <div className="bg-zinc-900/40 border border-white/10 rounded-[2rem] p-8 hover:border-pink-500/50 transition-all group hover:bg-zinc-900/60">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/10 to-pink-900/10 border border-pink-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(236,72,153,0.1)]">
                <Icons.Heart className="text-pink-500" size={32} />
              </div>
              <h3 className="text-xl font-headline font-bold text-white mb-4">{t.feat3Title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{t.feat3Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-40 bg-black py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-500/20 bg-gold-500/5 mb-2">
              <Icons.Quote size={12} className="text-gold-500" />
              <span className="text-[10px] font-black text-gold-200 uppercase tracking-[0.2em]">{t.reviewsBadge}</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-headline font-black text-white">
              {t.reviewsTitle} <span className="text-gold-500">{t.reviewsTitleHighlight}</span> Zeggen
            </h2>
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] font-bold">{t.reviewsSub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {t.testimonials.map((testimonial, i) => (
              <div key={i} className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 md:p-8 hover:border-gold-500/30 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-white font-black text-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{testimonial.name}</p>
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Icons.Star key={si} size={14} className={si < testimonial.rating ? 'text-gold-500 fill-gold-500' : 'text-zinc-700'} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-40 bg-black py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-2">
              <Icons.HelpCircle size={12} className="text-zinc-400" />
              <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">{t.faqBadge}</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-headline font-black text-white">
              {t.faqTitle} <span className="text-gold-500">{t.faqTitleHighlight}</span>
            </h2>
          </div>

          <div className="space-y-3">
            {t.faq.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} />
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-zinc-400 text-sm mb-6">{t.ctaText}</p>
            <button
              onClick={scrollToForm}
              className="px-12 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_0_40px_rgba(220,38,38,0.4)] transition-all transform hover:scale-105 active:scale-95"
            >
              {t.ctaBtn}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-40 py-10 text-center border-t border-white/5 bg-black">
        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">{t.footer}</p>
      </footer>
    </div>
  );
};

export default LandingPage;
