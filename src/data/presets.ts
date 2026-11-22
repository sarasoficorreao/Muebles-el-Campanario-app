import type { MaterialPreset, SampleFurniture } from '../types';
import sampleChairImg from '../assets/images/sample_wooden_chair_1795307917897.jpg';
import sampleArmchairImg from '../assets/images/sample_armchair_1795307917819.jpg';
import sampleBenchImg from '../assets/images/sample_bench_settee_1795307917934.jpg';

export const SAMPLE_FURNITURE: SampleFurniture[] = [
  {
    id: 'silla-comedor-roble',
    title: 'Silla de Comedor Clásica',
    category: 'Comedor · Madera y Cojín',
    imageUrl: sampleChairImg,
    suggestedPrompt:
      'Pasa el espaldar de madera a forja con un diseño de plantas sencillo y realista que lo pueda hacer alguien que sabe forja, cambia la madera a nogal oscuro y el tapizado a lino crudo.',
  },
  {
    id: 'poltrona-nogal',
    title: 'Poltrona de Sala en Nogal',
    category: 'Sala · Brazos en Madera',
    imageUrl: sampleArmchairImg,
    suggestedPrompt:
      'Cambia la madera a roble miel claro y retapiza los cojines en cuero coñac envejecido manteniendo las costuras.',
  },
  {
    id: 'banca-cedro',
    title: 'Banca Doble de Taller',
    category: 'Recibidor · Espaldar Listones',
    imageUrl: sampleBenchImg,
    suggestedPrompt:
      'Reemplaza el espaldar de listones de madera por forja artesanal negra mate con diseño de ramas y hojas sencillas, madera en cedro rojo y cojín en gris marengo.',
  },
];

export const WOOD_PRESETS: MaterialPreset[] = [
  {
    id: 'wood-nogal',
    name: 'Nogal Oscuro',
    category: 'wood',
    swatchColor: '#4A3022',
    swatchSecondary: '#2E1C12',
    promptPhraseEs: 'madera en tono nogal oscuro satinado con veta natural',
    shortSpec: 'Nogal Oscuro · Sellador mate',
  },
  {
    id: 'wood-roble-miel',
    name: 'Roble Miel',
    category: 'wood',
    swatchColor: '#B68246',
    swatchSecondary: '#8B5E2E',
    promptPhraseEs: 'madera en tono roble miel cálido natural',
    shortSpec: 'Roble Miel · Laca natural',
  },
  {
    id: 'wood-cedro',
    name: 'Cedro Rojo',
    category: 'wood',
    swatchColor: '#8E432C',
    swatchSecondary: '#652B1B',
    promptPhraseEs: 'madera en tono cedro rojo colonial',
    shortSpec: 'Cedro Rojo · Tinte tradicional',
  },
  {
    id: 'wood-ebano',
    name: 'Ébano Mate',
    category: 'wood',
    swatchColor: '#252321',
    swatchSecondary: '#141312',
    promptPhraseEs: 'madera teñida en ébano negro mate dejando ver la veta',
    shortSpec: 'Ébano · Poro abierto mate',
  },
  {
    id: 'wood-ceniza',
    name: 'Roble Ceniza',
    category: 'wood',
    swatchColor: '#9E9384',
    swatchSecondary: '#7A7063',
    promptPhraseEs: 'madera en tono roble ceniza lavado claro',
    shortSpec: 'Roble Ceniza · Lavado suave',
  },
  {
    id: 'wood-decapado',
    name: 'Blanco Decapé',
    category: 'wood',
    swatchColor: '#EAE6DF',
    swatchSecondary: '#CFC7BA',
    promptPhraseEs: 'madera pintada en blanco hueso decapé artesanal',
    shortSpec: 'Blanco Decapé · Pátina suave',
  },
];

export const UPHOLSTERY_PRESETS: MaterialPreset[] = [
  {
    id: 'uph-lino',
    name: 'Lino Crudo',
    category: 'upholstery',
    swatchColor: '#DFD8CC',
    swatchSecondary: '#C9C0B1',
    promptPhraseEs: 'tapizado en tela lino crudo natural de trama visible',
    shortSpec: 'Lino Crudo · Trama gruesa',
  },
  {
    id: 'uph-esmeralda',
    name: 'Terciopelo Esmeralda',
    category: 'upholstery',
    swatchColor: '#234D3E',
    swatchSecondary: '#17362B',
    promptPhraseEs: 'tapizado en terciopelo verde esmeralda profundo',
    shortSpec: 'Terciopelo · Verde Esmeralda',
  },
  {
    id: 'uph-cognac',
    name: 'Cuero Coñac',
    category: 'upholstery',
    swatchColor: '#94522F',
    swatchSecondary: '#6F3B1F',
    promptPhraseEs: 'tapizado en cuero genuino tono coñac envejecido',
    shortSpec: 'Cuero Natural · Tono Coñac',
  },
  {
    id: 'uph-marengo',
    name: 'Gris Marengo',
    category: 'upholstery',
    swatchColor: '#4B4E52',
    swatchSecondary: '#34373A',
    promptPhraseEs: 'tapizado en tela lona resistente color gris marengo',
    shortSpec: 'Lona Tapicera · Gris Marengo',
  },
  {
    id: 'uph-terracota',
    name: 'Terracota',
    category: 'upholstery',
    swatchColor: '#A6543E',
    swatchSecondary: '#7D3B2A',
    promptPhraseEs: 'tapizado en chenilla color terracota cálido',
    shortSpec: 'Chenilla · Terracota',
  },
  {
    id: 'uph-mostaza',
    name: 'Ocre Antiguo',
    category: 'upholstery',
    swatchColor: '#B88B38',
    swatchSecondary: '#8F6A25',
    promptPhraseEs: 'tapizado en tela terciopelo tono ocre mostaza apagado',
    shortSpec: 'Terciopelo · Ocre Antiguo',
  },
];

export const FORJA_PRESETS: MaterialPreset[] = [
  {
    id: 'forja-plantas',
    name: 'Plantas Sencillas',
    category: 'forja',
    swatchColor: '#1E1E1E',
    swatchSecondary: '#474747',
    promptPhraseEs:
      'pasa el espaldar de madera a hierro forjado negro mate con un diseño sencillo y realista de tallos y hojas de plantas que pueda fabricar un herrero artesanal',
    shortSpec: 'Varilla 3/8" + platina 3/4" · Hojas forjadas',
  },
  {
    id: 'forja-olivo',
    name: 'Ramas de Olivo',
    category: 'forja',
    swatchColor: '#292929',
    swatchSecondary: '#595959',
    promptPhraseEs:
      'reemplaza el espaldar por forja artesanal en hierro negro mate con dos ramas curvas de olivo y hojas simétricas soldadas de forma realista',
    shortSpec: 'Varilla redonda 3/8" · Ramas simétricas',
  },
  {
    id: 'forja-volutas',
    name: 'Volutas Coloniales',
    category: 'forja',
    swatchColor: '#211F1D',
    swatchSecondary: '#544F4A',
    promptPhraseEs:
      'cambia el espaldar a hierro forjado colonial con volutas en C y S sencillas, barrotes verticales y remaches reales',
    shortSpec: 'Platina 1/2" x 3/16" · Volutas en C/S',
  },
  {
    id: 'forja-recto',
    name: 'Barrotes y Aro',
    category: 'forja',
    swatchColor: '#2B2D2F',
    swatchSecondary: '#62666A',
    promptPhraseEs:
      'reemplaza el espaldar por forja minimalista de barrotes verticales en varilla cuadrada negra mate con un aro central forjado',
    shortSpec: 'Varilla cuadrada 1/2" · Aro central',
  },
];

export const QUICK_PROMPT_EXAMPLES: string[] = [
  'Pasa el espaldar de madera a forja con un diseño de plantas sencillo y realista que lo pueda hacer alguien que sabe forja',
  'Cambia la madera a nogal oscuro y el tapizado a lino crudo',
  'Pon la madera en roble miel y retapiza el asiento en cuero coñac',
  'Espaldar en forja colonial de volutas sencillas, madera en cedro rojo y cojín gris marengo',
];
