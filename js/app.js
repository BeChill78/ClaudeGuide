'use strict';

// ─── STATE ────────────────────────────────────────────────────────────────────
const S = {
  apiKey: '',
  guideMode: 'ai',       // 'free' | 'ai'
  guideStyle: 'expert',  // 'expert' | 'narrateur' | 'passionne'
  group: 'solo',
  travelMode: 'urbain',
  audioFormat: 'dense',
  duration: 2,
  departureTime: '',
  startPoint: '',
  interests: '',
  destination: '',
  pois: [],
  currentPoi: null,
  map: null,
  markers: [],
  polyline: null,
  userMarker: null,
  userLat: null,
  userLng: null,
  watchId: null,
  excursionMode: false,
  triggeredPois: new Set(),
  distanceTimer: null,
  speechSynth: window.speechSynthesis,
  currentUtterance: null,
  chatHistory: [],
  chatPoiContext: null,
};

// ─── PRE-BUILT CIRCUITS ───────────────────────────────────────────────────────
const CIRCUITS = [
  {
    id: 'paris-medieval',
    title: 'Paris Médiéval',
    destination: 'Paris',
    duration: '3h',
    theme: 'Histoire',
    tags: ['moyen-âge', 'architecture', 'îles'],
    lat: 48.8534, lng: 2.3488,
    pois: [
      { name: 'Notre-Dame de Paris', lat: 48.8530, lng: 2.3499, duration: 40,
        description: 'Chef-d\'œuvre gothique du XIIe siècle, Notre-Dame incarne huit siècles d\'histoire parisienne. Ses deux tours culminent à 69 mètres. La cathédrale, en cours de restauration après l\'incendie de 2019, révèle une architecture d\'une précision remarquable : ses arcs-boutants innovants permirent d\'élever des murs percés de vitraux immenses. Observez la rosace occidentale, composée de 84 médaillons représentant vices, vertus et travaux des mois.', tags: ['gothique', 'cathédrale'] },
      { name: 'Sainte-Chapelle', lat: 48.8554, lng: 2.3450, duration: 30,
        description: 'Joyau gothique rayonnant édifié par Saint Louis en 1248 pour abriter les reliques de la Passion. La chapelle haute est une cage de lumière : 15 verrières de 15 mètres encerclent l\'espace, racontant en 1113 scènes l\'histoire biblique. Par temps ensoleillé, les 600 m² de vitraux projettent un kaléidoscope de bleus et d\'ors. Construite en seulement sept ans, cette chapelle palatine témoigne du prestige royal capétien.', tags: ['vitraux', 'gothique'] },
      { name: 'Place Dauphine', lat: 48.8558, lng: 2.3414, duration: 20,
        description: 'Havre de tranquillité en plein cœur de Paris, la place Dauphine fut créée par Henri IV en 1607. Ses maisons de briques rouges et de pierres blanches forment un triangle presque intact depuis le XVIIe siècle. C\'est ici que Yves Montand et Simone Signoret habitèrent au numéro 15. Un café en terrasse s\'impose pour savourer l\'atmosphère unique de l\'île de la Cité.', tags: ['place historique', 'Renaissance'] },
      { name: 'Musée de Cluny', lat: 48.8509, lng: 2.3439, duration: 45,
        description: 'Le musée national du Moyen Âge abrite les plus belles collections médiévales de France dans un hôtel gothique du XVe siècle adossé aux thermes gallo-romains de Lutèce. La pièce maîtresse : la tenture de la Dame à la Licorne, six tapisseries flamandes des années 1500 d\'une délicatesse extraordinaire. Admirez aussi les 21 têtes des rois de Judée arrachées à Notre-Dame pendant la Révolution, retrouvées par hasard en 1977.', tags: ['musée', 'tapisseries', 'médiéval'] },
      { name: 'Rue Saint-Jacques — Quartier Latin', lat: 48.8496, lng: 2.3471, duration: 25,
        description: 'La rue Saint-Jacques est l\'une des plus vieilles voies de Paris, tracée sur l\'antique decumanus romain. Elle fut pendant des siècles le chemin de Saint-Jacques-de-Compostelle. Le quartier Latin tire son nom du latin parlé par les étudiants de la Sorbonne fondée en 1257. Longez Saint-Séverin dont les gargouilles veillent depuis le XIIIe siècle. Chaque pavé a foulé Dante, Rabelais, Pascal.', tags: ['quartier historique', 'université'] },
    ]
  },
  {
    id: 'rome-antique',
    title: 'Rome Antique',
    destination: 'Rome',
    duration: '4h',
    theme: 'Antiquité',
    tags: ['empire romain', 'ruines', 'architecture'],
    lat: 41.8902, lng: 12.4922,
    pois: [
      { name: 'Colisée', lat: 41.8902, lng: 12.4922, duration: 60,
        description: 'L\'amphithéâtre Flavien, inauguré en 80 ap. J.-C. sous Titus, pouvait accueillir 50 000 spectateurs pour des combats de gladiateurs et des chasses d\'animaux sauvages. Sa façade extérieure superpose trois ordres architecturaux : dorique, ionique, corinthien. Les 80 entrées numérotées permettaient d\'évacuer la foule en moins de 10 minutes. Sous l\'arène : le hypogée, réseau de couloirs où patientaient bêtes et combattants.', tags: ['gladiateurs', 'empire romain'] },
      { name: 'Forum Romain', lat: 41.8925, lng: 12.4853, duration: 45,
        description: 'Cœur politique et commercial de la République puis de l\'Empire, le Forum fut pendant mille ans le centre du monde occidental. La Voie Sacrée le traverse, jalonnée de temples et d\'arcs de triomphe. Le Temple de Saturne (497 av. J.-C.) abritait le trésor de Rome. L\'Arc de Titus célèbre la destruction du Temple de Jérusalem en 70 ap. J.-C.', tags: ['sénat', 'temples', 'voie sacrée'] },
      { name: 'Palatin', lat: 41.8893, lng: 12.4877, duration: 30,
        description: 'Colline mythique où Romulus aurait fondé Rome en 753 av. J.-C., le Palatin devint la résidence des empereurs — notre mot "palais" en est issu. Les ruines des palais d\'Auguste, de Tibère et de Domitien dominent le Forum. Le jardin Farnèse offre une vue panoramique incomparable sur l\'ensemble du site.', tags: ['empereurs', 'jardins', 'panorama'] },
      { name: 'Circus Maximus', lat: 41.8858, lng: 12.4855, duration: 20,
        description: 'La plus grande structure de divertissement de l\'Antiquité mesurait 600 mètres de long et contenait jusqu\'à 300 000 spectateurs. Les courses de chars y captivèrent Rome pendant neuf siècles. La spina centrale était ornée d\'obélisques égyptiens. Aujourd\'hui vaste pelouse, il accueille les grands concerts romains.', tags: ['courses de chars', 'spectacles'] },
      { name: 'Thermes de Caracalla', lat: 41.8791, lng: 12.4924, duration: 35,
        description: 'Inaugurés en 216 ap. J.-C., ces thermes colossaux accueillaient 1600 baigneurs simultanément dans 130 000 m² de luxe impérial. Les Romains y passaient l\'après-midi : frigidarium, tepidarium, caldarium, gymnase, bibliothèques, jardins. Les mosaïques de sols représentant des athlètes sont parmi les plus belles conservées.', tags: ['bains romains', 'mosaïques'] },
    ]
  },
  {
    id: 'barcelone-moderniste',
    title: 'Barcelone Moderniste',
    destination: 'Barcelone',
    duration: '4h',
    theme: 'Architecture',
    tags: ['Gaudí', 'modernisme', 'art nouveau'],
    lat: 41.4036, lng: 2.1744,
    pois: [
      { name: 'Sagrada Família', lat: 41.4036, lng: 2.1744, duration: 75,
        description: 'Le chef-d\'œuvre inachevé d\'Antoni Gaudí dépasse l\'entendement architectural. Commencée en 1882, toujours en construction, la basilique est un testament de foi et de nature : ses tours-clochers évoquent des stalactites, ses colonnes des arbres, ses voûtes des forêts pétrifiées. La façade de la Nativité fourmille de symboles naturalistes. Gaudí est enterré dans la crypte.', tags: ['Gaudí', 'basilique', 'symboles'] },
      { name: 'Casa Batlló', lat: 41.3916, lng: 2.1649, duration: 40,
        description: 'Remodelée par Gaudí entre 1904 et 1906, la Casa Batlló est surnommée "la Maison des Os" pour ses colonnes de façade évoquant un squelette. Le toit couvert de tuiles multicolores représente le dragon tué par Saint Georges, patron de la Catalogne. La nuit, la façade illuminée devient féerique.', tags: ['Gaudí', 'façade osseuse', 'dragon'] },
      { name: 'Casa Milà — La Pedrera', lat: 41.3954, lng: 2.1619, duration: 40,
        description: 'Dernière œuvre civile de Gaudí (1906–1912), La Pedrera est un immeuble dont la façade ondulante en calcaire gris rappelle une falaise marine. La terrasse sur le toit est peuplée de cheminées torsadées en forme de guerriers. Gaudí n\'utilisa aucune poutre : la structure est portée par des colonnes et des arcs paraboliques.', tags: ['Gaudí', 'toit terrasse', 'UNESCO'] },
      { name: 'Palau de la Música Catalana', lat: 41.3875, lng: 2.1752, duration: 35,
        description: 'Chef-d\'œuvre de Lluís Domènech i Montaner (1908), inscrit à l\'UNESCO, ce palais est le seul bâtiment moderniste éclairé naturellement par deux façades. La salle de concerts est couverte d\'un vitrail convexe de 1500 pièces qui baigne l\'espace d\'une lumière changeante. Les concerts de la saison s\'y tiennent encore.', tags: ['Domènech i Montaner', 'musique', 'vitrail'] },
      { name: 'Parc Güell', lat: 41.4145, lng: 2.1527, duration: 50,
        description: 'Projet de cité-jardin commandité par Eusebi Güell, transformé en parc public en 1926. La terrasse principale est bordée d\'un banc en forme de serpent de mer, recouvert de trencadís — mosaïque de tessons colorés. L\'hypostyle, forêt de 86 colonnes doriques, devait être le marché de la cité. Le panorama sur Barcelone et la mer est exceptionnel en fin d\'après-midi.', tags: ['Gaudí', 'mosaïques', 'panorama'] },
    ]
  },
  {
    id: 'amsterdam-canaux',
    title: 'Amsterdam — Canaux & Golden Age',
    destination: 'Amsterdam',
    duration: '3h',
    theme: 'Histoire',
    tags: ['canaux', 'Golden Age', 'maisons à pignon'],
    lat: 52.3702, lng: 4.8952,
    pois: [
      { name: 'Herengracht — Maisons du Siècle d\'Or', lat: 52.3665, lng: 4.8897, duration: 30,
        description: 'Le Herengracht est le plus heureux des trois grands canaux concentriques creusés au XVIIe siècle. Ses maisons à pignons baroques, reflets dans l\'eau sombre, sont les plus précieuses d\'Amsterdam. La Gouden Bocht concentre les plus belles demeures de marchands enrichis par le commerce mondial. Chaque façade affiche un pignon différent : à gradins, en cloche, à corniche.', tags: ['canaux', 'architecture', 'Golden Age'] },
      { name: 'Rijksmuseum', lat: 52.3600, lng: 4.8852, duration: 60,
        description: 'Le musée national des Pays-Bas renferme la plus grande collection de peinture hollandaise du Siècle d\'Or. La "Ronde de nuit" de Rembrandt (1642), peinture monumentale de 3,63 × 4,37 m, occupe une salle construite pour elle. La "Laitière" de Vermeer révèle une lumière d\'une précision photographique. Le musée conserve 8000 objets exposés dont des Delftware et instruments de navigation.', tags: ['Rembrandt', 'Vermeer', 'peinture flamande'] },
      { name: 'Maison d\'Anne Frank', lat: 52.3752, lng: 4.8840, duration: 45,
        description: 'Au 263 Prinsengracht, derrière une bibliothèque pivotante, la famille Frank se cacha de juillet 1942 à août 1944. Anne, 13 ans à son arrivée, rédigea son journal dans cet appartement secret. L\'Annexe a été préservée vide selon le souhait d\'Otto, seul survivant. Les photos que collait Anne ornent encore les murs.', tags: ['Seconde Guerre Mondiale', 'mémoire', 'journal intime'] },
      { name: 'Jordaan — Noordmarkt', lat: 52.3744, lng: 4.8823, duration: 25,
        description: 'Le Jordaan, ancien quartier ouvrier et huguenot du XVIIe siècle, est devenu le plus bohème de la ville. Ses ruelles aux noms de plantes abritent galeries d\'art, antiquaires, cafés bruns enfumés. Le marché du Noordmarkt réunit fromages fermiers, vêtements vintage, produits bio dans une ambiance villageoise.', tags: ['quartier', 'marché', 'vie locale'] },
      { name: 'Westerkerk', lat: 52.3748, lng: 4.8839, duration: 20,
        description: 'La plus grande église protestante d\'Amsterdam (1631) domine le Jordaan de sa tour de 85 mètres surmontée de la couronne impériale. Rembrandt est enterré quelque part dans la nef, mais sa tombe exacte est inconnue. Les carillons de 48 cloches s\'égrenaient le vendredi à 12h du vivant d\'Anne Frank.', tags: ['église protestante', 'Rembrandt', 'carillons'] },
    ]
  },
  {
    id: 'lisbonne-alfama',
    title: 'Lisbonne — Alfama & Belvédères',
    destination: 'Lisbonne',
    duration: '3h',
    theme: 'Histoire',
    tags: ['azulejos', 'fado', 'Alfama'],
    lat: 38.7139, lng: -9.1334,
    pois: [
      { name: 'Castelo de São Jorge', lat: 38.7139, lng: -9.1334, duration: 40,
        description: 'La citadelle maure domine Lisbonne depuis le IVe siècle av. J.-C. : Phéniciens, Romains, Wisigoths et Maures l\'ont tous fortifiée. Les dix tours médiévales et les murailles enclosent un jardin de paons et d\'oliviers sauvages. La terrasse offre la plus belle vue sur Lisbonne, le Tage et le pont du 25-Avril.', tags: ['château fort', 'maures', 'panorama'] },
      { name: 'Miradouro das Portas do Sol', lat: 38.7127, lng: -9.1289, duration: 25,
        description: 'Le plus vieux quartier de Lisbonne déroule ses ruelles pavées entre maisons couvertes d\'azulejos bleus et blancs. Le Miradouro das Portas do Sol est le point d\'observation idéal sur les toits de l\'Alfama et l\'estuaire du Tage. Les soirs de week-end, des maisons du quartier s\'ouvrent pour des concerts de fado authentique.', tags: ['fado', 'azulejos', 'belvédère'] },
      { name: 'Cathédrale Sé de Lisboa', lat: 38.7097, lng: -9.1329, duration: 25,
        description: 'La plus ancienne église de Lisbonne (1147) fut construite sur une mosquée maure peu après la reconquête. Sa façade romane austère flanquée de deux tours crénelées résiste depuis neuf siècles aux tremblements de terre. António de Lisboa (Saint Antoine de Padoue) y fut baptisé en 1195.', tags: ['cathédrale romane', 'Saint Antoine', 'archéologie'] },
      { name: 'Mouraria — Largo do Intendente', lat: 38.7183, lng: -9.1355, duration: 25,
        description: 'La Mouraria fut assignée aux Maures après 1147. C\'est là que naquit le fado : la chanteuse Maria Severa y vécut au XIXe siècle. Le Largo do Intendente concentre des ateliers de céramique et la fabrique Viúva Lamego dont les carreaux d\'azulejos décorent Lisbonne depuis 1849.', tags: ['fado', 'multiculturalisme', 'artisanat'] },
      { name: 'Musée National du Carrelage (Azulejo)', lat: 38.7232, lng: -9.1105, duration: 40,
        description: 'Installé dans le couvent da Madre de Deus (1509), ce musée retrace 500 ans d\'azulejos. La pièce maîtresse : le Grand Panorama de Lisbonne (1700–1730), panneau de 23 mètres représentant la capitale avant le tremblement de terre de 1755 — document historique unique.', tags: ['azulejos', 'céramique', 'couvent'] },
    ]
  },
  {
    id: 'prague-baroque',
    title: 'Prague Baroque & Gothique',
    destination: 'Prague',
    duration: '4h',
    theme: 'Architecture',
    tags: ['baroque', 'gothique', 'château'],
    lat: 50.0880, lng: 14.4208,
    pois: [
      { name: 'Château de Prague', lat: 50.0902, lng: 14.3999, duration: 60,
        description: 'Le plus grand complexe castral du monde en superficie (70 000 m²) domine la Vltava depuis le IXe siècle. La cathédrale Saint-Guy, commencée en 1344, est un bijou gothique dont la façade ouest fut achevée en 1929. La chapelle Wenceslas, ornée de jaspe et améthyste, abrite le tombeau du saint patron de Bohême.', tags: ['château royal', 'cathédrale gothique', 'panorama'] },
      { name: 'Pont Charles', lat: 50.0865, lng: 14.4114, duration: 30,
        description: 'Construit entre 1357 et 1402 sur ordre de Charles IV, ce pont de 516 mètres à 16 arches gothiques fut le seul pont de Prague jusqu\'en 1841. Ses 30 statues baroques racontent l\'hagiographie de la Bohême. À l\'aube, avant les foules, le pont baigne dans une lumière dorée extraordinaire.', tags: ['pont médiéval', 'statues baroques', 'Vltava'] },
      { name: 'Place de la Vieille Ville — Horloge Astronomique', lat: 50.0874, lng: 14.4213, duration: 30,
        description: 'L\'Horloge Astronomique (Orloj), installée en 1410, est le troisième plus ancien mécanisme de ce type encore en fonctionnement. Chaque heure, les douze apôtres défilent tandis que le squelette de la Mort sonne le glas. Le cadran indique simultanément l\'heure solaire, la position du soleil et de la lune dans le zodiaque.', tags: ['horloge astronomique', 'place médiévale'] },
      { name: 'Josefov — Ancien Cimetière Juif', lat: 50.0902, lng: 14.4183, duration: 35,
        description: 'L\'ancien ghetto juif de Prague abrite six synagogues et le cimetière médiéval où 12 000 pierres tombales s\'entassent sur douze couches de sépultures. Maharal, le rabbin Loew créateur légendaire du Golem, y repose. La Synagogue Vieille-Nouvelle (1270) est la plus ancienne d\'Europe centrale encore en activité.', tags: ['ghetto juif', 'cimetière médiéval', 'mémoire'] },
      { name: 'Petit Côté — Mala Strana', lat: 50.0876, lng: 14.4034, duration: 30,
        description: 'Le quartier baroque par excellence de Prague. Ses palais aux façades dorées, ses jardins en terrasses et ses ruelles pavées créent un décor d\'opéra. L\'église Saint-Nicolas est le chef-d\'œuvre du baroque jésuite en Bohême. Kafka, Mozart et Casanova hantèrent ces ruelles.', tags: ['baroque', 'jardins', 'Mozart'] },
    ]
  },
  {
    id: 'florence-renaissance',
    title: 'Florence — Berceau de la Renaissance',
    destination: 'Florence',
    duration: '4h',
    theme: 'Art',
    tags: ['Renaissance', 'Médicis', 'musées'],
    lat: 43.7696, lng: 11.2558,
    pois: [
      { name: 'Galerie des Offices', lat: 43.7677, lng: 11.2553, duration: 75,
        description: 'La plus importante collection de peinture de la Renaissance italienne, réunie par les Médicis. La salle 10–14 abrite "La Naissance de Vénus" et "Le Printemps" de Botticelli — deux icônes commanditées par Laurent le Magnifique. Raphaël, Michel-Ange, Titien et Léonard de Vinci sont représentés.', tags: ['Botticelli', 'Médicis', 'peinture Renaissance'] },
      { name: 'Dôme — Santa Maria del Fiore', lat: 43.7731, lng: 11.2560, duration: 45,
        description: 'La coupole de Brunelleschi (1436) est l\'exploit technique de la Renaissance. Sa double coque auto-portante en briques posées en arête de poisson révolutionne l\'architecture. 463 marches mènent au sommet d\'où la vue sur Florence est absolue.', tags: ['Brunelleschi', 'coupole', 'architecture'] },
      { name: 'Baptistère de San Giovanni', lat: 43.7733, lng: 11.2551, duration: 25,
        description: 'Le baptistère roman (XIe–XIIIe s.) est le monument le plus aimé des Florentins : Dante y fut baptisé. La porte est de Lorenzo Ghiberti (1425–1452), que Michel-Ange surnomma "Portes du Paradis", est un chef-d\'œuvre de la perspective narrative.', tags: ['baptistère roman', 'Ghiberti', 'mosaïques byzantines'] },
      { name: 'Palais Vecchio', lat: 43.7696, lng: 11.2558, duration: 35,
        description: 'Le Palazzo della Signoria, siège du gouvernement républicain depuis 1299. La Salle des Cinq Cents, commandée par Savonarole et peinte par Vasari, dissimulerait sous une fresque une œuvre de Léonard de Vinci. La Torre d\'Arnolfo offre la meilleure vue sur la Piazza della Signoria.', tags: ['palais médiéval', 'gouvernement républicain', 'Vasari'] },
      { name: 'Pont Vecchio', lat: 43.7681, lng: 11.2531, duration: 20,
        description: 'Le seul pont de Florence épargné en 1944 est couvert depuis 1593 de boutiques d\'orfèvres et de bijoutiers. Le Corridor Vasarien le surplombe : ce passage secret de 1km construit en 1565 reliait le Palais Pitti au Palais de la Seigneurie, permettant aux Médicis de circuler en sécurité.', tags: ['bijoutiers', 'corridor secret', 'pont médiéval'] },
    ]
  },
  {
    id: 'vienne-imperial',
    title: 'Vienne Impériale',
    destination: 'Vienne',
    duration: '4h',
    theme: 'Histoire',
    tags: ['Habsbourg', 'baroque', 'cafés'],
    lat: 48.2082, lng: 16.3738,
    pois: [
      { name: 'Palais de Schönbrunn', lat: 48.1846, lng: 16.3124, duration: 60,
        description: 'La résidence d\'été des Habsbourg — 1441 pièces, 40 hectares de jardins — incarne 300 ans de puissance impériale. Mozart s\'y produisit à 6 ans devant François Ier. La Gloriette, colonnade en haut du jardin, offre le panorama le plus célèbre de Vienne.', tags: ['palais baroque', 'Habsbourg', 'jardins'] },
      { name: 'Kunsthistorisches Museum', lat: 48.2032, lng: 16.3614, duration: 60,
        description: 'Le musée d\'histoire de l\'art abrite la quatrième plus grande collection de peintures au monde. Brueghel l\'Ancien : la salle X conserve douze de ses œuvres dont "La Tour de Babel". Vermeer, Rubens, Titien et Caravage composent une traversée des maîtres anciens.', tags: ['Brueghel', 'Vermeer', 'collections impériales'] },
      { name: 'Stephansdom', lat: 48.2083, lng: 16.3731, duration: 35,
        description: 'La cathédrale Saint-Étienne, symbole de Vienne depuis le XIIe siècle. Son toit en tuiles vernissées de 250 000 pièces forme un motif de chevrons colorés. Dans les catacombes reposent les restes de 11 000 Viennois et les entrailles des Habsbourg.', tags: ['cathédrale gothique', 'catacombes', 'symbole de Vienne'] },
      { name: 'Belvédère Supérieur', lat: 48.1921, lng: 16.3814, duration: 45,
        description: 'Le Belvédère Supérieur (1722) est à la fois un chef-d\'œuvre du baroque autrichien et un des musées les plus visités. Il abrite le plus grand nombre de tableaux de Gustav Klimt : "Le Baiser" (1907–1908), icône de l\'Art Nouveau mondial, y est conservé.', tags: ['Klimt', 'Art Nouveau', 'Traité d\'État'] },
      { name: 'Café Central', lat: 48.2104, lng: 16.3659, duration: 25,
        description: 'Le Café Central, ouvert en 1876 dans le Palais Ferstel néo-gothique, fut le salon de Freud, Trotski, Karl Kraus et Hugo von Hofmannsthal. Commander un Wiener Melange sous ses voûtes gothiques est une expérience culturelle à part entière. L\'Apfelstrudel maison est servi à toute heure.', tags: ['café viennois', 'intellectuels', 'patrimoine'], is_meal: true },
    ]
  },
  {
    id: 'edinburgh-medieval',
    title: 'Édimbourg Médiéval & Romantique',
    destination: 'Édimbourg',
    duration: '3h',
    theme: 'Histoire',
    tags: ['château', 'Royal Mile', 'Highlands'],
    lat: 55.9486, lng: -3.1999,
    pois: [
      { name: 'Château d\'Édimbourg', lat: 55.9486, lng: -3.1999, duration: 60,
        description: 'Perché sur un rocher volcanique de 130 mètres, le château est le symbole incontesté de l\'Écosse. Les Honneurs d\'Écosse — les plus anciens joyaux de la Couronne de Grande-Bretagne — y sont exposés. La Pierre du Destin, sur laquelle furent couronnés les rois d\'Écosse depuis 840 ap. J.-C., revint d\'Angleterre en 1996.', tags: ['château fort', 'joyaux de la couronne', 'histoire écossaise'] },
      { name: 'Royal Mile — Vieille Ville', lat: 55.9501, lng: -3.1878, duration: 30,
        description: 'Le Royal Mile relie le Château au Palais de Holyroodhouse sur précisément un mile écossais. Ses closes plongeantes révèlent la ville verticale du XVIIe siècle : des tenements de 14 étages, premiers gratte-ciels du monde. Grassmarket, à la base des falaises, fut le lieu des exécutions publiques jusqu\'en 1784.', tags: ['Royal Mile', 'closes médiévales', 'tenements'] },
      { name: 'Palais de Holyroodhouse', lat: 55.9522, lng: -3.1719, duration: 35,
        description: 'Résidence officielle du souverain britannique en Écosse. La chambre de Marie Reine d\'Écosse fut le théâtre du meurtre de Rizzio, son secrétaire, devant ses yeux en 1566. Les ruines de l\'Abbaye d\'Holyrood (1128), attenantes, sont d\'une mélancolie romantique parfaite.', tags: ['palais royal', 'Marie Reine d\'Écosse', 'abbaye'] },
      { name: 'Greyfriars Kirkyard', lat: 55.9464, lng: -3.1906, duration: 25,
        description: 'Ce cimetière presbytérien de 1562 est l\'un des plus chargés d\'histoire d\'Écosse. Greyfriars Bobby : le terrier skye qui veilla sur la tombe de son maître pendant 14 ans (1858–1872). Les tombes néogothiques et les rumeurs de fantômes en font le cimetière le plus "hanté" de Grande-Bretagne.', tags: ['cimetière', 'Greyfriars Bobby', 'Covenant'] },
      { name: 'Calton Hill', lat: 55.9556, lng: -3.1785, duration: 20,
        description: 'La colline offre la vue la plus complète sur Édimbourg : château à l\'ouest, Firth of Forth au nord, Arthur\'s Seat au sud. Le Monument National inachevé, copie partielle du Parthénon, valut à Édimbourg le surnom d\'"Athènes du Nord". Le lever du soleil depuis ici est un des plus beaux d\'Europe.', tags: ['panorama', 'néoclassique', 'Athènes du Nord'] },
    ]
  },
  {
    id: 'santorini-cyclades',
    title: 'Santorin — Villages des Cyclades',
    destination: 'Santorin',
    duration: '3h',
    theme: 'Nature',
    tags: ['caldeira', 'cyclades', 'coucher de soleil'],
    lat: 36.4618, lng: 25.3760,
    pois: [
      { name: 'Oia — Coucher de Soleil', lat: 36.4618, lng: 25.3760, duration: 50,
        description: 'Oia est le village le plus photographié de Grèce, perché sur la lèvre nord de la caldeira volcanique. Ses maisons blanches à coupoles bleues dégringolent vers la mer 300 mètres en contrebas. Des centaines de visiteurs se massent sur le château vénitien en ruines pour applaudir le soleil qui plonge derrière Thirasia.', tags: ['coucher de soleil', 'maisons blanches', 'caldeira'] },
      { name: 'Fira — Vue sur la Caldeira', lat: 36.4167, lng: 25.4315, duration: 35,
        description: 'La capitale de Santorin est construite en amphithéâtre sur les 300 mètres de falaises de la caldeira formée par l\'éruption minoenne de 3600 av. J.-C. Le chemin muletier vers le port ancien est une ascension de 588 marches taillées dans la roche volcanique noire.', tags: ['caldeira', 'falaises', 'musée minoën'] },
      { name: 'Site Archéologique d\'Akrotiri', lat: 36.3519, lng: 25.4028, duration: 45,
        description: 'La "Pompéi de la Méditerranée" : la ville minoenne d\'Akrotiri fut ensevelie sous les cendres vers 1650 av. J.-C. Les fouilles révèlent des rues dallées, des maisons à deux étages avec plomberie et les plus belles fresques de l\'âge de bronze. La ville fut évacuée avant l\'éruption — aucun squelette trouvé.', tags: ['archéologie minoenne', 'fresques', 'âge du bronze'] },
      { name: 'Plage de Kamari — Sable Noir', lat: 36.3750, lng: 25.4844, duration: 30,
        description: 'Les plages de Santorin sont uniques : leur sable volcanique noir absorbe la chaleur et crée des eaux d\'une chaleur exceptionnelle. Kamari, à l\'est de l\'île, est la plage de sable noir la plus accessible. L\'eau turquoise contraste spectaculairement avec le rivage sombre.', tags: ['sable noir', 'plage volcanique', 'géologie'] },
      { name: 'Musée Préhistorique de Thira (Fira)', lat: 36.4172, lng: 25.4325, duration: 30,
        description: 'Ce musée exceptionnel expose les fresques et objets d\'Akrotiri, Pompéi égéenne ensevelie en 1650 av. J.-C. Les miniatures marines, les boxeurs et les singes bleus témoignent d\'une civilisation minoenne sophistiquée et cosmopolite en contact avec l\'Égypte et le Proche-Orient.', tags: ['musée minoën', 'fresques', 'archéologie'] },
    ]
  },
];

// ─── FREE DESTINATIONS DATABASE ──────────────────────────────────────────────
const DB = {
  'paris': { lat: 48.8566, lng: 2.3522, label: 'Paris' },
  'rome': { lat: 41.9028, lng: 12.4964, label: 'Rome' },
  'barcelone': { lat: 41.3851, lng: 2.1734, label: 'Barcelone' },
  'amsterdam': { lat: 52.3702, lng: 4.8952, label: 'Amsterdam' },
  'lisbonne': { lat: 38.7169, lng: -9.1395, label: 'Lisbonne' },
  'prague': { lat: 50.0755, lng: 14.4378, label: 'Prague' },
  'florence': { lat: 43.7696, lng: 11.2558, label: 'Florence' },
  'vienne': { lat: 48.2082, lng: 16.3738, label: 'Vienne' },
  'santorin': { lat: 36.3932, lng: 25.4615, label: 'Santorin' },
  'edimbourg': { lat: 55.9533, lng: -3.1883, label: 'Édimbourg' },
  'bruxelles': { lat: 50.8503, lng: 4.3517, label: 'Bruxelles' },
  'berlin': { lat: 52.5200, lng: 13.4050, label: 'Berlin' },
  'budapest': { lat: 47.4979, lng: 19.0402, label: 'Budapest' },
  'athenes': { lat: 37.9838, lng: 23.7275, label: 'Athènes' },
  'madrid': { lat: 40.4168, lng: -3.7038, label: 'Madrid' },
  'seville': { lat: 37.3891, lng: -5.9845, label: 'Séville' },
  'naples': { lat: 40.8518, lng: 14.2681, label: 'Naples' },
  'venise': { lat: 45.4408, lng: 12.3155, label: 'Venise' },
  'milan': { lat: 45.4642, lng: 9.1900, label: 'Milan' },
  'porto': { lat: 41.1579, lng: -8.6291, label: 'Porto' },
  'cracovie': { lat: 50.0647, lng: 19.9450, label: 'Cracovie' },
  'varsovie': { lat: 52.2297, lng: 21.0122, label: 'Varsovie' },
  'stockholm': { lat: 59.3293, lng: 18.0686, label: 'Stockholm' },
  'copenhague': { lat: 55.6761, lng: 12.5683, label: 'Copenhague' },
  'oslo': { lat: 59.9139, lng: 10.7522, label: 'Oslo' },
  'helsinki': { lat: 60.1699, lng: 24.9384, label: 'Helsinki' },
  'riga': { lat: 56.9496, lng: 24.1052, label: 'Riga' },
  'tallinn': { lat: 59.4370, lng: 24.7536, label: 'Tallinn' },
  'vilnius': { lat: 54.6872, lng: 25.2797, label: 'Vilnius' },
  'dublin': { lat: 53.3498, lng: -6.2603, label: 'Dublin' },
  'londres': { lat: 51.5074, lng: -0.1278, label: 'Londres' },
  'lyon': { lat: 45.7640, lng: 4.8357, label: 'Lyon' },
  'marseille': { lat: 43.2965, lng: 5.3698, label: 'Marseille' },
  'bordeaux': { lat: 44.8378, lng: -0.5792, label: 'Bordeaux' },
  'nice': { lat: 43.7102, lng: 7.2620, label: 'Nice' },
  'strasbourg': { lat: 48.5734, lng: 7.7521, label: 'Strasbourg' },
  'bruges': { lat: 51.2093, lng: 3.2247, label: 'Bruges' },
  'gand': { lat: 51.0543, lng: 3.7174, label: 'Gand' },
  'anvers': { lat: 51.2194, lng: 4.4025, label: 'Anvers' },
  'zurich': { lat: 47.3769, lng: 8.5417, label: 'Zurich' },
  'geneve': { lat: 46.2044, lng: 6.1432, label: 'Genève' },
  'berne': { lat: 46.9481, lng: 7.4474, label: 'Berne' },
  'sarajevo': { lat: 43.8563, lng: 18.4131, label: 'Sarajevo' },
  'dubrovnik': { lat: 42.6507, lng: 18.0944, label: 'Dubrovnik' },
  'split': { lat: 43.5081, lng: 16.4402, label: 'Split' },
  'valletta': { lat: 35.8997, lng: 14.5147, label: 'La Valette' },
  'reykjavik': { lat: 64.1355, lng: -21.8954, label: 'Reykjavik' },
  'luxembourg': { lat: 49.6117, lng: 6.1319, label: 'Luxembourg' },
  'monaco': { lat: 43.7384, lng: 7.4246, label: 'Monaco' },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function normalize(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function lookupDestination(input) {
  const key = normalize(input);
  for (const k of Object.keys(DB)) {
    if (normalize(k) === key || normalize(DB[k].label) === key) return { key: k, ...DB[k] };
  }
  for (const k of Object.keys(DB)) {
    if (normalize(DB[k].label).includes(key) || key.includes(normalize(k))) return { key: k, ...DB[k] };
  }
  return null;
}

function lookupCircuit(input) {
  const key = normalize(input);
  return CIRCUITS.find(c =>
    normalize(c.destination) === key ||
    normalize(c.title).includes(key) ||
    key.includes(normalize(c.destination))
  ) || null;
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function fmtTime(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3200);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── VOICE ────────────────────────────────────────────────────────────────────
let selectedVoice = null;

function selectVoice() {
  const voices = S.speechSynth.getVoices();
  const priority = ['Thomas', 'Amelie', 'Amélie', 'Marie', 'Virginie'];
  for (const name of priority) {
    const v = voices.find(v => v.name.includes(name));
    if (v) { selectedVoice = v; return; }
  }
  selectedVoice = voices.find(v => v.lang && v.lang.startsWith('fr')) || null;
}

if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = selectVoice;
  selectVoice();
}

function playAudio(text, poiName) {
  if (!text || !window.speechSynthesis) return;
  S.speechSynth.cancel();
  const bar = document.getElementById('audio-bar');
  document.getElementById('audio-bar-name').textContent = poiName || 'Guide';
  bar.classList.add('visible');
  const utter = new SpeechSynthesisUtterance(text);
  if (selectedVoice) utter.voice = selectedVoice;
  utter.lang = 'fr-FR';
  utter.rate = 0.92;
  utter.pitch = 1.0;
  utter.onend = () => bar.classList.remove('visible');
  utter.onerror = () => bar.classList.remove('visible');
  S.currentUtterance = utter;
  S.speechSynth.speak(utter);
}

function stopAudio() {
  if (window.speechSynthesis) S.speechSynth.cancel();
  document.getElementById('audio-bar').classList.remove('visible');
}

// ─── GENERATION ───────────────────────────────────────────────────────────────
async function startGeneration() {
  const dest = document.getElementById('input-destination').value.trim();
  if (!dest) { showToast('Saisis une destination', 'error'); return; }

  S.destination = dest;
  S.startPoint = document.getElementById('input-start').value.trim();
  S.interests = document.getElementById('input-interests').value.trim();
  S.duration = parseInt(document.getElementById('input-duration').value) || 2;
  S.departureTime = document.getElementById('input-departure').value;

  showScreen('screen-loading');
  setStep(0);

  if (S.guideMode === 'free') {
    await generateFree(dest);
  } else {
    await generateAI(dest);
  }
}

function setStep(n) {
  for (let i = 0; i <= 3; i++) {
    const el = document.getElementById('step-' + i);
    if (!el) continue;
    el.classList.remove('active', 'done');
    if (i < n) el.classList.add('done');
    if (i === n) el.classList.add('active');
  }
}

async function generateFree(dest) {
  const circuit = lookupCircuit(dest);
  if (circuit) {
    setStep(1); await delay(400);
    setStep(2); await delay(300);
    setStep(3);
    S.pois = circuit.pois.map((p, i) => ({ ...p, index: i }));
    await delay(300);
    saveHistory(circuit.title, S.pois.length);
    launchMap(circuit.lat, circuit.lng, circuit.title);
    return;
  }
  const match = lookupDestination(dest);
  if (match) {
    setStep(1); await delay(500);
    setStep(2); await delay(400);
    setStep(3);
    showToast('Mode gratuit — données statiques');
    S.pois = [];
    await delay(300);
    launchMap(match.lat, match.lng, match.label);
    return;
  }
  showToast('Destination non disponible en mode gratuit. Active le mode IA.', 'error');
  showScreen('screen-home');
}

async function generateAI(dest) {
  if (!S.apiKey) {
    showToast('Clé API manquante — va dans Réglages', 'error');
    showScreen('screen-home');
    return;
  }
  setStep(0);
  let centerLat = null, centerLng = null;

  try {
    setStep(1);
    const q = S.startPoint || dest;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'Nomade-PWA/1.0' } }
    );
    const data = await res.json();
    if (data.length) { centerLat = parseFloat(data[0].lat); centerLng = parseFloat(data[0].lon); }
  } catch (e) { console.warn('Geocode failed', e); }

  setStep(2);
  const prompt = buildPrompt(dest, centerLat, centerLng);
  let pois;
  try {
    pois = await callClaude(prompt);
  } catch (e) {
    showToast('Erreur API : ' + e.message, 'error');
    showScreen('screen-home');
    return;
  }

  if (!Array.isArray(pois) || !pois.length) {
    showToast('Réponse invalide. Réessaie.', 'error');
    showScreen('screen-home');
    return;
  }

  setStep(3);
  for (let i = 0; i < pois.length; i++) {
    const p = pois[i];
    if (p.lat && p.lng) continue;
    try {
      await delay(1100);
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(p.name + ', ' + dest)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'Nomade-PWA/1.0' } }
      );
      const d = await r.json();
      if (d.length) { p.lat = parseFloat(d[0].lat); p.lng = parseFloat(d[0].lon); }
    } catch (e) { console.warn('POI geocode failed', e); }
  }

  S.pois = pois.filter(p => p.lat && p.lng).map((p, i) => ({ ...p, index: i }));
  if (!S.pois.length) {
    showToast('Géolocalisation échouée. Réessaie.', 'error');
    showScreen('screen-home');
    return;
  }

  const first = S.pois[0];
  saveHistory(dest, S.pois.length);
  launchMap(centerLat || first.lat, centerLng || first.lng, dest);
}

function buildPrompt(dest, lat, lng) {
  const groupLabels = { solo: 'voyageur solo', couple: 'couple', famille: 'famille avec enfants' };
  const styleLabels = { expert: 'expert et précis', narrateur: 'conteur narratif et poétique', passionne: 'passionné et enthousiaste' };
  const modeLabel = S.travelMode === 'rando'
    ? 'randonnée / trek (ordre chronologique avec temps de marche estimés)'
    : 'visite urbaine à pied';
  const formatLabel = S.audioFormat === 'dense' ? 'court et dense (max 120 mots)' : 'narratif et détaillé (max 220 mots)';
  const count = S.duration <= 2 ? 5 : S.duration <= 4 ? 6 : 8;

  const parts = [
    `Tu es un guide touristique ${styleLabels[S.guideStyle]}, francophone.`,
    `Destination : ${dest}`,
    lat ? `Position de départ : ${lat.toFixed(5)}, ${lng.toFixed(5)}` : '',
    S.departureTime ? `Heure de départ : ${S.departureTime}` : '',
    `Durée disponible : ${S.duration} heure(s)`,
    `Profil du groupe : ${groupLabels[S.group]}`,
    `Mode de déplacement : ${modeLabel}`,
    S.interests ? `Intérêts spécifiques : ${S.interests}` : '',
    `Format audio : ${formatLabel}`,
    '',
    `Génère une visite de ${count} points d'intérêt.`,
    'IMPORTANT : réponds UNIQUEMENT avec du JSON brut, sans markdown, sans backtick, sans explication.',
    '',
    'Format attendu (tableau JSON) :',
    '[',
    '  {',
    '    "name": "Nom du lieu",',
    '    "lat": 48.8530,',
    '    "lng": 2.3499,',
    '    "duration": 30,',
    '    "description": "Texte audio en français...",',
    '    "heure_passage": "10:15",',
    '    "conseil_local": "Astuce pratique",',
    '    "meilleur_moment": "Matin ou soir",',
    '    "affluence": "Modérée",',
    '    "tags": ["tag1", "tag2"],',
    '    "is_meal": false',
    '  }',
    ']',
    '',
    'Règles :',
    '- Coordonnées GPS précises pour chaque lieu',
    `- description adaptée au profil : ${groupLabels[S.group]}, format ${formatLabel}`,
    `- heure_passage calculée depuis le départ${S.departureTime ? ' à ' + S.departureTime : ''}`,
    '- is_meal = true pour restaurants / cafés',
    '- ordre géographique logique pour minimiser les trajets',
    S.travelMode === 'rando' ? '- inclure les temps de marche entre les étapes dans la description' : '',
  ];

  return parts.filter(Boolean).join('\n');
}

async function callClaude(prompt) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': S.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${resp.status}`);
  }
  const data = await resp.json();
  const raw = (data.content?.[0]?.text || '').trim();
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('JSON parse error:', e, '\nRaw response:', raw);
    throw new Error('Réponse JSON invalide');
  }
}

// ─── MAP ──────────────────────────────────────────────────────────────────────
function launchMap(lat, lng, title) {
  showScreen('screen-map');
  document.getElementById('map-destination').textContent = title || S.destination;
  document.getElementById('map-meta').textContent =
    S.pois.length
      ? `${S.pois.length} lieu${S.pois.length > 1 ? 'x' : ''} · ${fmtTime(S.duration * 60)}`
      : fmtTime(S.duration * 60);

  if (!S.map) {
    S.map = L.map('map', { zoomControl: false, attributionControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(S.map);
  }

  S.map.setView([lat, lng], 15);
  clearMapLayers();

  if (S.pois.length) {
    renderMarkers();
    if (S.pois.length > 1) drawPolyline();
    renderPoiStrip();
    updateProgressBar(0);
    startDistanceUpdater();
    document.getElementById('poi-strip').style.display = '';
    document.getElementById('progress-wrap').style.display = '';
  } else {
    document.getElementById('poi-strip').style.display = 'none';
    document.getElementById('progress-wrap').style.display = 'none';
  }
}

function clearMapLayers() {
  S.markers.forEach(m => m.remove());
  S.markers = [];
  if (S.polyline) { S.polyline.remove(); S.polyline = null; }
  S.currentPoi = null;
  document.getElementById('poi-sheet').classList.remove('open');
}

function renderMarkers() {
  S.pois.forEach((p, i) => {
    const icon = L.divIcon({
      className: '',
      html: `<div class="map-pin${p.is_meal ? ' meal-pin' : ''}">${i + 1}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
    const marker = L.marker([p.lat, p.lng], { icon })
      .addTo(S.map)
      .on('click', () => selectPOI(i));
    S.markers.push(marker);
  });
}

function drawPolyline() {
  const latlngs = S.pois.map(p => [p.lat, p.lng]);
  S.polyline = L.polyline(latlngs, {
    color: '#c9a96e',
    weight: 2.5,
    opacity: 0.8,
    dashArray: '6, 8',
  }).addTo(S.map);
  S.map.fitBounds(S.polyline.getBounds(), { padding: [48, 48] });
}

// ─── POI STRIP ────────────────────────────────────────────────────────────────
function renderPoiStrip() {
  const strip = document.getElementById('poi-strip');
  strip.innerHTML = '';
  S.pois.forEach((p, i) => {
    const chip = document.createElement('div');
    chip.className = 'poi-chip';
    chip.dataset.index = i;
    chip.innerHTML = `
      <div class="poi-chip-top">
        <span class="chip-num">${i + 1}</span>
        ${p.is_meal ? '<span style="font-size:11px">🍽️</span>' : ''}
      </div>
      <span class="chip-name">${p.name}</span>
      <span class="chip-dist" id="chip-dist-${i}">—</span>
    `;
    chip.addEventListener('click', () => selectPOI(i));
    strip.appendChild(chip);
  });
}

function selectPOI(index) {
  S.currentPoi = S.pois[index];
  document.querySelectorAll('.poi-chip').forEach((c, i) => c.classList.toggle('active', i === index));
  if (S.map) S.map.panTo([S.currentPoi.lat, S.currentPoi.lng], { animate: true });
  updateProgressBar(index);
  renderPoiSheet(S.currentPoi, index);
  document.getElementById('poi-sheet').classList.add('open');
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function updateProgressBar(index) {
  const wrap = document.getElementById('progress-wrap');
  if (!S.pois.length || S.pois.length < 2) { wrap.style.display = 'none'; return; }
  wrap.style.display = '';
  document.getElementById('progress-text').textContent = `Stop ${index + 1} / ${S.pois.length}`;
  const pct = S.pois.length > 1 ? (index / (S.pois.length - 1)) * 100 : 0;
  document.getElementById('progress-fill').style.width = pct + '%';
}

// ─── POI SHEET ────────────────────────────────────────────────────────────────
function renderPoiSheet(p, index) {
  const next = S.pois[index + 1] || null;
  let distToNext = '';
  if (next) {
    const m = haversineMeters(p.lat, p.lng, next.lat, next.lng);
    const walkMin = Math.round(m / 80);
    distToNext = `<div class="poi-nav">
      <span>→ ${next.name}</span>
      <span>${fmtDist(m)} · ~${fmtTime(walkMin)}</span>
    </div>`;
  }

  const tags = Array.isArray(p.tags)
    ? p.tags.map(t => `<span class="poi-tag${p.is_meal ? ' meal-tag' : ''}">${t}</span>`).join('')
    : '';

  const escapedName = (p.name || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  document.getElementById('poi-sheet-content').innerHTML = `
    <div class="sheet-title">${p.is_meal ? '🍽️ ' : ''}${p.name || ''}</div>
    ${p.heure_passage ? `<div class="poi-time">🕐 Passage : ${p.heure_passage}</div>` : ''}
    ${p.duration ? `<div class="poi-time">⏱ Durée : ${fmtTime(p.duration)}</div>` : ''}
    <div class="sheet-desc">${p.description || ''}</div>
    ${p.conseil_local ? `<div class="sheet-tip">💡 ${p.conseil_local}</div>` : ''}
    ${p.meilleur_moment ? `<div class="sheet-tip">🌅 ${p.meilleur_moment}</div>` : ''}
    ${p.affluence ? `<div class="sheet-tip">👥 Affluence : ${p.affluence}</div>` : ''}
    ${tags ? `<div class="sheet-tags">${tags}</div>` : ''}
    ${distToNext}
    <div class="sheet-actions">
      <button class="btn-audio-sheet" onclick="playCurrentPoiAudio(${index})">▶ Audio</button>
      <button class="btn-chat-sheet" onclick="openChat(${index})">💬 Chat</button>
      <button class="btn-visited" onclick="markVisited(${index})">✓ Visité</button>
    </div>
  `;
}

function playCurrentPoiAudio(index) {
  const p = S.pois[index];
  if (p) playAudio(p.description, p.name);
}

function markVisited(index) {
  const chip = document.querySelector(`.poi-chip[data-index="${index}"]`);
  if (chip) chip.classList.add('visited');
  const next = index + 1;
  if (next < S.pois.length) {
    selectPOI(next);
  } else {
    document.getElementById('poi-sheet').classList.remove('open');
    showToast('Visite terminée !');
  }
}

// ─── DISTANCES UPDATE ─────────────────────────────────────────────────────────
function startDistanceUpdater() {
  if (S.distanceTimer) clearInterval(S.distanceTimer);
  updateDistances();
  S.distanceTimer = setInterval(updateDistances, 10000);
}

function updateDistances() {
  if (S.userLat === null || S.userLng === null) return;
  S.pois.forEach((p, i) => {
    const el = document.getElementById('chip-dist-' + i);
    if (el) el.textContent = fmtDist(haversineMeters(S.userLat, S.userLng, p.lat, p.lng));
  });
}

// ─── GPS / EXCURSION ──────────────────────────────────────────────────────────
function startGPS() {
  if (!navigator.geolocation) { showToast('GPS non disponible', 'error'); return; }
  if (S.watchId !== null) return;
  S.watchId = navigator.geolocation.watchPosition(onPositionUpdate, onGPSError, {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 10000,
  });
}

function stopGPS() {
  if (S.watchId !== null) {
    navigator.geolocation.clearWatch(S.watchId);
    S.watchId = null;
  }
  if (S.userMarker) { S.userMarker.remove(); S.userMarker = null; }
  S.userLat = null; S.userLng = null;
}

function onPositionUpdate(pos) {
  const { latitude: lat, longitude: lng } = pos.coords;
  S.userLat = lat; S.userLng = lng;
  updateDistances();
  if (!S.map) return;
  if (!S.userMarker) {
    S.userMarker = L.marker([lat, lng], {
      icon: L.divIcon({ className: 'user-marker', html: '', iconSize: [16, 16], iconAnchor: [8, 8] }),
      zIndexOffset: 1000,
    }).addTo(S.map);
  } else {
    S.userMarker.setLatLng([lat, lng]);
  }
  if (S.excursionMode) checkGeofences(lat, lng);
}

function onGPSError(err) {
  console.warn('GPS error:', err.message);
}

function checkGeofences(lat, lng) {
  S.pois.forEach((p, i) => {
    if (S.triggeredPois.has(i)) return;
    if (haversineMeters(lat, lng, p.lat, p.lng) <= 40) {
      S.triggeredPois.add(i);
      selectPOI(i);
      playAudio(p.description, p.name);
      showToast('📍 ' + p.name);
    }
  });
}

function toggleExcursionMode() {
  const btn = document.getElementById('btn-excursion');
  const status = document.getElementById('excursion-status');
  if (!S.excursionMode) {
    S.excursionMode = true;
    S.triggeredPois.clear();
    startGPS();
    btn.classList.add('active');
    btn.textContent = '⏹ Arrêter Excursion GPS';
    if (status) status.textContent = 'GPS actif — déclenchement auto à 40 m';
    showToast('Mode Excursion activé');
  } else {
    S.excursionMode = false;
    btn.classList.remove('active');
    btn.textContent = '📍 Mode Excursion GPS';
    if (status) status.textContent = '';
    showToast('Mode Excursion désactivé');
  }
}

// ─── CHAT ─────────────────────────────────────────────────────────────────────
function openChat(poiIndex) {
  const p = S.pois[poiIndex];
  if (!p) return;
  S.chatPoiContext = p;
  S.chatHistory = [];
  document.getElementById('chat-poi-name').textContent = p.name;
  document.getElementById('chat-messages').innerHTML = '';
  showScreen('screen-chat');
  appendChatMsg('assistant', `Bonjour ! Je suis ton guide pour ${p.name}. Pose-moi toutes tes questions sur ce lieu, son histoire ou les alentours !`);
}

function appendChatMsg(role, text) {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-msg ' + role;
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  appendChatMsg('user', msg);
  S.chatHistory.push({ role: 'user', content: msg });

  if (!S.apiKey) {
    appendChatMsg('assistant', 'Configure ta clé API dans les Réglages pour utiliser le chat.');
    return;
  }

  const styleLabels = { expert: 'expert et précis', narrateur: 'conteur narratif', passionne: 'passionné et enthousiaste' };
  const system = `Tu es un guide touristique ${styleLabels[S.guideStyle] || 'expert'} francophone.
Lieu actuel : ${S.chatPoiContext?.name || 'lieu touristique'}
Description : ${S.chatPoiContext?.description || ''}
Réponds en français, de façon concise (max 150 mots).`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': S.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 512,
        system,
        messages: S.chatHistory.slice(-8),
      }),
    });
    const data = await resp.json();
    const reply = data.content?.[0]?.text || 'Je n\'ai pas pu répondre.';
    S.chatHistory.push({ role: 'assistant', content: reply });
    appendChatMsg('assistant', reply);
  } catch (e) {
    appendChatMsg('assistant', 'Erreur de connexion. Réessaie.');
  }
}

// ─── HISTORY ──────────────────────────────────────────────────────────────────
function loadHistory() {
  try { return JSON.parse(localStorage.getItem('nomade_history') || '[]'); } catch { return []; }
}

function saveHistory(dest, poiCount) {
  const h = loadHistory();
  h.unshift({ dest, poiCount, date: new Date().toLocaleDateString('fr-FR') });
  localStorage.setItem('nomade_history', JSON.stringify(h.slice(0, 8)));
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById('history-list');
  if (!list) return;
  const h = loadHistory();
  if (!h.length) { list.innerHTML = '<div class="history-empty">Aucune visite enregistrée</div>'; return; }
  list.innerHTML = h.map(item => `
    <div class="history-item" data-dest="${item.dest}">
      <span class="hist-dest">${item.dest}</span>
      <span class="hist-meta">${item.poiCount} lieu${item.poiCount > 1 ? 'x' : ''} · ${item.date}</span>
    </div>
  `).join('');
  list.querySelectorAll('.history-item').forEach(el => {
    el.addEventListener('click', () => {
      document.getElementById('input-destination').value = el.dataset.dest;
    });
  });
}

// ─── CIRCUITS (DISCOVER TAB) ─────────────────────────────────────────────────
function renderCircuits() {
  const list = document.getElementById('circuits-list');
  if (!list) return;
  list.innerHTML = CIRCUITS.map(c => `
    <div class="circuit-card" data-circuit="${c.id}">
      <div class="circuit-title">${c.title}</div>
      <div class="circuit-meta">${c.duration} · ${c.theme} · ${c.pois.length} lieux</div>
      <div class="circuit-tags">${c.tags.map(t => `<span class="circuit-tag">${t}</span>`).join('')}</div>
    </div>
  `).join('');
  list.querySelectorAll('.circuit-card').forEach(el => {
    el.addEventListener('click', () => {
      const c = CIRCUITS.find(x => x.id === el.dataset.circuit);
      if (!c) return;
      document.getElementById('input-destination').value = c.destination;
      S.destination = c.destination;
      S.pois = c.pois.map((p, i) => ({ ...p, index: i }));
      showScreen('screen-loading');
      setStep(0);
      const go = async () => {
        setStep(1); await delay(350);
        setStep(2); await delay(350);
        setStep(3); await delay(300);
        saveHistory(c.title, S.pois.length);
        launchMap(c.lat, c.lng, c.title);
      };
      go();
    });
  });
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function bindSettings() {
  const keyInput = document.getElementById('input-api-key');
  const keyStatus = document.getElementById('key-status');
  const savedKey = localStorage.getItem('nomade_api_key') || '';
  if (savedKey) {
    S.apiKey = savedKey;
    if (keyInput) keyInput.value = savedKey;
    if (keyStatus) { keyStatus.textContent = 'Clé enregistrée ✓'; keyStatus.className = 'key-status ok'; }
  }

  const saveKeyBtn = document.getElementById('btn-save-key');
  if (saveKeyBtn) {
    saveKeyBtn.addEventListener('click', () => {
      const val = keyInput.value.trim();
      if (!val.startsWith('sk-ant-')) { showToast('Clé invalide (doit commencer par sk-ant-)', 'error'); return; }
      S.apiKey = val;
      localStorage.setItem('nomade_api_key', val);
      if (keyStatus) { keyStatus.textContent = 'Clé enregistrée ✓'; keyStatus.className = 'key-status ok'; }
      showToast('Clé API sauvegardée');
    });
  }

  // Guide style
  const savedStyle = localStorage.getItem('nomade_style') || 'expert';
  S.guideStyle = savedStyle;
  document.querySelectorAll('.style-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.style === savedStyle);
    btn.addEventListener('click', () => {
      document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      S.guideStyle = btn.dataset.style;
      localStorage.setItem('nomade_style', S.guideStyle);
      showToast('Style : ' + btn.textContent);
    });
  });

  const clearBtn = document.getElementById('btn-clear-history');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      localStorage.removeItem('nomade_history');
      renderHistory();
      showToast('Historique effacé');
    });
  }

  const freeList = document.getElementById('free-dest-list');
  if (freeList) {
    freeList.innerHTML = Object.values(DB).map(d => `<span class="free-dest-pill">${d.label}</span>`).join('');
  }

  const backBtn = document.getElementById('btn-settings-back');
  if (backBtn) backBtn.addEventListener('click', () => showScreen('screen-home'));
}

function showSettingsScreen() {
  const apiSection = document.getElementById('section-apikey');
  if (apiSection) apiSection.style.display = S.guideMode === 'ai' ? '' : 'none';
  showScreen('screen-settings');
}

// ─── HOME BINDINGS ─────────────────────────────────────────────────────────────
function bindHome() {
  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const tab = document.getElementById('tab-' + btn.dataset.tab);
      if (tab) tab.classList.add('active');
    });
  });

  // Group
  document.querySelectorAll('#group-btns .toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#group-btns .toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      S.group = btn.dataset.val;
    });
  });

  // Travel mode
  document.querySelectorAll('#mode-btns .toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#mode-btns .toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      S.travelMode = btn.dataset.val;
    });
  });

  // Theme
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Audio format
  document.querySelectorAll('.format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      S.audioFormat = btn.dataset.format;
    });
  });

  // Guide mode
  const hint = document.getElementById('guide-mode-hint');
  document.querySelectorAll('.guide-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.guide-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      S.guideMode = btn.dataset.mode;
      if (hint) hint.textContent = S.guideMode === 'ai'
        ? 'Mode IA — génération personnalisée via Claude'
        : 'Mode gratuit — 50 destinations européennes incluses';
    });
  });

  // Default departure time
  const dep = document.getElementById('input-departure');
  if (dep && !dep.value) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dep.value = now.toISOString().slice(0, 16);
  }

  document.getElementById('btn-generate').addEventListener('click', startGeneration);
  document.getElementById('input-destination').addEventListener('keydown', e => {
    if (e.key === 'Enter') startGeneration();
  });
  document.getElementById('btn-open-settings').addEventListener('click', showSettingsScreen);
}

// ─── MAP CONTROLS ─────────────────────────────────────────────────────────────
function bindMapControls() {
  document.getElementById('btn-map-home').addEventListener('click', () => {
    S.excursionMode = false;
    stopGPS();
    if (S.distanceTimer) { clearInterval(S.distanceTimer); S.distanceTimer = null; }
    showScreen('screen-home');
  });

  document.getElementById('btn-locate').addEventListener('click', () => {
    if (!navigator.geolocation) { showToast('GPS non disponible'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        S.userLat = pos.coords.latitude;
        S.userLng = pos.coords.longitude;
        if (S.map) S.map.setView([S.userLat, S.userLng], 16, { animate: true });
      },
      err => showToast('GPS : ' + err.message, 'error'),
      { enableHighAccuracy: true }
    );
  });

  document.getElementById('btn-map-settings').addEventListener('click', showSettingsScreen);
  document.getElementById('btn-excursion').addEventListener('click', toggleExcursionMode);

  const closeSheet = document.getElementById('btn-close-sheet');
  if (closeSheet) closeSheet.addEventListener('click', () => {
    document.getElementById('poi-sheet').classList.remove('open');
  });

  // Swipe down to close sheet
  const sheet = document.getElementById('poi-sheet');
  let sheetStartY = 0;
  sheet.addEventListener('touchstart', e => { sheetStartY = e.touches[0].clientY; }, { passive: true });
  sheet.addEventListener('touchend', e => {
    if (e.changedTouches[0].clientY - sheetStartY > 60) sheet.classList.remove('open');
  }, { passive: true });
}

// ─── AUDIO BAR ─────────────────────────────────────────────────────────────────
function bindAudioBar() {
  const stopBtn = document.getElementById('btn-audio-stop');
  if (stopBtn) stopBtn.addEventListener('click', stopAudio);
}

// ─── CHAT CONTROLS ────────────────────────────────────────────────────────────
function bindChat() {
  const sendBtn = document.getElementById('btn-send-chat');
  if (sendBtn) sendBtn.addEventListener('click', sendChatMessage);
  const chatInput = document.getElementById('chat-input');
  if (chatInput) chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendChatMessage(); });
  const chatBack = document.getElementById('chat-back');
  if (chatBack) chatBack.addEventListener('click', () => showScreen('screen-map'));
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
function init() {
  S.apiKey = localStorage.getItem('nomade_api_key') || '';
  S.guideStyle = localStorage.getItem('nomade_style') || 'expert';

  bindHome();
  bindMapControls();
  bindAudioBar();
  bindChat();
  bindSettings();
  renderHistory();
  renderCircuits();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(e => console.warn('SW:', e));
  }
}

document.addEventListener('DOMContentLoaded', init);
