export interface SceneData {
  id: number;
  number: string;
  navLabel: string;
  kicker: string;
  title: string;
  subtitle: string;
  description: string;
  sideCaptionLeft: string;
  sideCaptionRight: string;
  architecturalNote: string;
  elevationMetric: string;
  coordinates: string;
  cameraPos: [number, number, number];
  cameraLookAt: [number, number, number];
  fov: number;
  fogColor: string;
  fogDensity: number;
  skyTopColor: string;
  skyHorizonColor: string;
  sunIntensity: number;
  ambientIntensity: number;
}

export const SCENES: SceneData[] = [
  {
    id: 0,
    number: '01',
    navLabel: 'Arrival',
    kicker: 'Costiera Amalfitana · 40°38′N 14°36′E',
    title: 'Sunrise Over the Tyrrhenian Sea',
    subtitle: 'Where Golden Dawn Meets Palladian Limestone',
    description:
      'Carved into a private promontory above emerald Mediterranean waters, Villa Aurelia awakens as first light gilds the 18th-century travertine colonnades and terraced cypress groves.',
    sideCaptionLeft: 'Chapter I · Coastal Approach',
    sideCaptionRight: 'Elevation 42m · South-Southeast Aspect',
    architecturalNote: 'Restored 1784 Neoclassical Facade · 14 Fluted Travertine Columns',
    elevationMetric: '42m Above Sea Level',
    coordinates: '40.6333° N, 14.6029° E',
    cameraPos: [0, 8.2, 82],
    cameraLookAt: [0, 6.2, 18],
    fov: 46,
    fogColor: '#253129',
    fogDensity: 0.0065,
    skyTopColor: '#0E221B',
    skyHorizonColor: '#D89B56',
    sunIntensity: 2.8,
    ambientIntensity: 0.85,
  },
  {
    id: 1,
    number: '02',
    navLabel: 'Entrance',
    kicker: 'The Grand Portico · Piano Nobile',
    title: 'Through the Triumphal Archway',
    subtitle: 'A Procession of Bronze, Travertine & Flowing Water',
    description:
      'Ascend the twin-flight imperial staircase flanked by hand-turned bronze oil lanterns. Beyond the gilded wrought-iron gates lies the vaulted Atrium of the Four Winds and its tiered marble fountain.',
    sideCaptionLeft: 'Chapter II · The Grand Entrance',
    sideCaptionRight: 'Carrara & Verde Alpi Inlaid Flooring',
    architecturalNote: '9.4m Coffered Barrel Vault · Tiered Carrara Fountain Basin',
    elevationMetric: '48m Atrium Threshold',
    coordinates: 'Portico Centrale · Axis 0°',
    cameraPos: [0, 5.4, 29],
    cameraLookAt: [0, 4.8, -5],
    fov: 44,
    fogColor: '#1B2821',
    fogDensity: 0.007,
    skyTopColor: '#10241C',
    skyHorizonColor: '#C99555',
    sunIntensity: 2.3,
    ambientIntensity: 0.9,
  },
  {
    id: 2,
    number: '03',
    navLabel: 'Terrace',
    kicker: 'Giardino Segreto & Thermal Pool',
    title: 'The Emerald Pool & Garden Terrace',
    subtitle: 'Byzantine Mosaic Waters Framed by Ancient Cypresses',
    description:
      'Sheltered within the inner peristyle courtyard, a 28-meter heated thermal pool lined with 24-karat gold and emerald glass mosaic reflects the classical pergolas, terracotta amphorae, and ivory silk parasols.',
    sideCaptionLeft: 'Chapter III · Peristyle Terrace',
    sideCaptionRight: '28m Heated Saltwater Infinity Basin',
    architecturalNote: 'Hand-Laid Venetian Smalti Mosaic · 32°C Mineral Spring Water',
    elevationMetric: '49m Courtyard Level',
    coordinates: 'Chiostro Verde · Inner Sanctuary',
    cameraPos: [0, 4.9, -6],
    cameraLookAt: [0, 2.7, -34],
    fov: 45,
    fogColor: '#15271F',
    fogDensity: 0.0068,
    skyTopColor: '#0C2119',
    skyHorizonColor: '#C59B61',
    sunIntensity: 2.2,
    ambientIntensity: 0.95,
  },
  {
    id: 3,
    number: '04',
    navLabel: 'Dining',
    kicker: 'Il Salone d’Oro · Gastronomy',
    title: 'The Candlelit Dining Hall',
    subtitle: 'Haute Mediterranean Cuisine Under Venetian Chandeliers',
    description:
      'As twilight deepens inside the gilded vaulted refectory, three hundred beeswax tapers illuminate royal banquet tables dressed in Flanders linen, Murano crystal goblets, and seasonal harvests from our hillside estate.',
    sideCaptionLeft: 'Chapter IV · Salone d’Oro',
    sideCaptionRight: '300 Beeswax Tapers · Estate Cellar',
    architecturalNote: 'Gilded Coffered Vaulting · 18th-Century Murano Brass Chandeliers',
    elevationMetric: '50m Refectory Hall',
    coordinates: 'Ala Est · Gastronomic Salon',
    cameraPos: [0, 4.5, -42],
    cameraLookAt: [0, 3.6, -70],
    fov: 42,
    fogColor: '#161813',
    fogDensity: 0.008,
    skyTopColor: '#0B1712',
    skyHorizonColor: '#9E743B',
    sunIntensity: 1.2,
    ambientIntensity: 0.65,
  },
  {
    id: 4,
    number: '05',
    navLabel: 'Suites',
    kicker: 'Residenza Reale · Private Quarters',
    title: 'The Aurelia Royal Suite & Loggia',
    subtitle: 'Canopied Silk, Herringbone Oak & Endless Sea Vistas',
    description:
      'Retreat to a private sanctuary featuring a four-poster brushed-brass canopy bed, woven silk tapestries, and tall French casements opening directly onto a cantilevered limestone balustrade above the shimmering horizon.',
    sideCaptionLeft: 'Chapter V · The Royal Suite',
    sideCaptionRight: '185 m² Interior · Private Sea Loggia',
    architecturalNote: 'French Oak Parquet · Custom Como Silk Drapery & Brass Canopy',
    elevationMetric: '54m CliffsideBelvedere',
    coordinates: 'Belvedere Ovest · Suite I',
    cameraPos: [0, 4.2, -78],
    cameraLookAt: [0, 3.5, -108],
    fov: 43,
    fogColor: '#18241D',
    fogDensity: 0.0065,
    skyTopColor: '#0D1E18',
    skyHorizonColor: '#D49852',
    sunIntensity: 2.1,
    ambientIntensity: 0.85,
  },
  {
    id: 5,
    number: '06',
    navLabel: 'Reserve',
    kicker: 'Private Concierge · Bespoke Stays',
    title: 'Reserve Your Sanctuary',
    subtitle: 'Begin Your Sojourn at Villa Aurelia',
    description:
      'Step onto your private cliffside balcony where chilled vintageFranciacorta awaits beside the sea breeze. Select your preferred residence and bespoke estate experiences below.',
    sideCaptionLeft: 'Chapter VI · Private Loggia',
    sideCaptionRight: 'Direct Heliport & Yacht Mooring Available',
    architecturalNote: 'Cantilevered Limestone Balustrade · 180° Tyrrhenian Panorama',
    elevationMetric: '54m Seaward Edge',
    coordinates: 'Loggia d’Oro · Final Vista',
    cameraPos: [0, 3.8, -106],
    cameraLookAt: [0, 3.3, -145],
    fov: 40,
    fogColor: '#1E2B23',
    fogDensity: 0.005,
    skyTopColor: '#0E2019',
    skyHorizonColor: '#E3A45B',
    sunIntensity: 2.6,
    ambientIntensity: 0.9,
  },
];

export interface SuiteOption {
  id: string;
  name: string;
  tagline: string;
  size: string;
  view: string;
  nightlyRate: number;
  highlights: string[];
}

export const SUITE_OPTIONS: SuiteOption[] = [
  {
    id: 'royal-aurelia',
    name: 'The Aurelia Royal Suite',
    tagline: 'Flagship Piano Nobile Residence with Cantilevered Sea Loggia',
    size: '185 m²',
    view: 'Panoramic Tyrrhenian Sunrise View',
    nightlyRate: 2450,
    highlights: ['Private Limestone Sea Balcony', 'Four-Poster Brass & Como Silk Bed', 'Dedicated 24-Hour Maggiordomo'],
  },
  {
    id: 'cliffside-loggia',
    name: 'Cliffside Belvedere Suite',
    tagline: 'Vaulted Frescoed Suite Overlooking the Thermal Mosaic Pool',
    size: '125 m²',
    view: 'Peristyle Garden & Sea Horizon',
    nightlyRate: 1680,
    highlights: ['Double Arched French Doors', 'Carrara Marble Roman Plunge Bath', 'Private Wine Cellar Selection'],
  },
  {
    id: 'cypress-villa',
    name: 'Villa dei Cipressi',
    tagline: 'Detached Two-Story Limestone Pavilion in the Olive Grove',
    size: '240 m²',
    view: 'Private Cove & Heated Plunge Terrace',
    nightlyRate: 3200,
    highlights: ['Private Heated Infinity Plunge Pool', 'Outdoor Pergola Dining Pavilion', 'Direct Private Cove Access'],
  },
];

export interface CuratedExperience {
  id: string;
  title: string;
  duration: string;
  price: number;
  summary: string;
}

export const CURATED_EXPERIENCES: CuratedExperience[] = [
  {
    id: 'yacht-charter',
    title: 'Riva Aquarama Sunset Charter',
    duration: '4 Hours · Private Captain',
    price: 1150,
    summary: 'Cruise hidden limestone grottos and coastal coves aboard our restored mahogany motor yacht with champagne service.',
  },
  {
    id: 'candlelight-tasting',
    title: 'Salone d’Oro Seven-Course Sommelier Table',
    duration: 'Evening · Rare Vintage Pairing',
    price: 480,
    summary: 'Private candlelit tasting menu curated by our Executive Chef with rare Italian vintages from the 1784 cellar.',
  },
  {
    id: 'thermal-spa',
    title: 'Ancient Roman Caldarium & Neroli Ritual',
    duration: '150 Minutes · Private Thermal Suite',
    price: 390,
    summary: 'Mineral thermal hydrotherapy followed by warm volcanic stone and wild Amalfi orange blossom oil massage.',
  },
];
