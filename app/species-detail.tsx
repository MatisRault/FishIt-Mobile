import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// Base de données complète des poissons d'eau douce français présents dans l'API Hub'Eau
const fishDatabase: { [key: string]: any } = {
  "Ablette": {
    habitat: "Rivières, lacs, eaux courantes",
    taille: "8-20 cm",
    poids: "10-100 g",
    description: "Petit cyprinidé argenté très vif, vivant en bancs près de la surface. Poisson fourrage important dans l'écosystème aquatique.",
    alimentation: "Omnivore : plancton, insectes, algues",
    reproduction: "Fraie au printemps et été, plusieurs pontes",
    statut: "Préoccupation mineure",
    techniques: "Pêche au coup fine, petits hameçons, asticots"
  },
  "Anguille": {
    habitat: "Rivières, lacs, étangs",
    taille: "60-150 cm",
    poids: "0.5-6 kg",
    description: "Poisson serpentiforme migrateur, très apprécié en gastronomie. Vit principalement en eau douce mais se reproduit en mer.",
    alimentation: "Carnivore : vers, crustacés, petits poissons",
    reproduction: "Migration vers la mer des Sargasses pour la reproduction",
    statut: "En danger critique",
    techniques: "Pêche de nuit, vers de terre, petits poissons morts"
  },
  "Anguille européenne": {
    habitat: "Rivières, lacs, étangs, estuaires",
    taille: "60-150 cm",
    poids: "0.5-6 kg",
    description: "Espèce catadrome emblématique, effectue de grandes migrations. Très longévité (jusqu'à 80 ans). Chair très prisée.",
    alimentation: "Carnivore : vers, crustacés, petits poissons, mollusques",
    reproduction: "Reproduction en mer des Sargasses, larves dérivent vers l'Europe",
    statut: "En danger critique",
    techniques: "Pêche nocturne, vers, petits poissons morts, nasses"
  },
  "Barbeau": {
    habitat: "Rivières à courant, fond graveleux",
    taille: "25-90 cm",
    poids: "0.5-8 kg",
    description: "Cyprinidé rhéophile aux barbillons caractéristiques. Excellent nageur, vit près du fond.",
    alimentation: "Omnivore : invertébrés benthiques, végétaux, détritus",
    reproduction: "Fraie au printemps en groupe dans les gravières",
    statut: "Préoccupation mineure",
    techniques: "Pêche au feeder, vers de terre, asticots, fromage"
  },
  "Barbeau fluviatile": {
    habitat: "Rivières courantes, zones gravelleuses",
    taille: "30-90 cm",
    poids: "0.5-8 kg",
    description: "Poisson de rivière typique, reconnaissable à ses 4 barbillons. Indicateur de bonne qualité d'eau.",
    alimentation: "Omnivore : invertébrés, algues, détritus organiques",
    reproduction: "Fraie collective au printemps sur graviers",
    statut: "Préoccupation mineure",
    techniques: "Pêche au feeder, quiver tip, vers, graines"
  },
  "Black-bass": {
    habitat: "Lacs, étangs, rivières lentes",
    taille: "25-60 cm",
    poids: "0.5-5 kg",
    description: "Prédateur introduit d'Amérique du Nord, très sportif et recherché par les pêcheurs aux leurres. Défense acharnée.",
    alimentation: "Carnivore : poissons, écrevisses, grenouilles",
    reproduction: "Fraie au printemps, le mâle garde le nid",
    statut: "Espèce introduite",
    techniques: "Leurres de surface, spinnerbaits, soft baits"
  },
  "Blageon": {
    habitat: "Rivières courantes, eaux claires",
    taille: "10-25 cm",
    poids: "50-200 g",
    description: "Petit cyprinidé grégaire des eaux vives. Espèce endémique du bassin du Rhône.",
    alimentation: "Omnivore : algues, invertébrés, débris végétaux",
    reproduction: "Fraie au printemps en bancs",
    statut: "Préoccupation mineure",
    techniques: "Pêche au coup légère, petits appâts naturels"
  },
  "Bouvière": {
    habitat: "Eaux calmes avec moules d'eau douce",
    taille: "5-10 cm",
    poids: "5-20 g",
    description: "Très petit cyprinidé à la reproduction fascinante, pond dans les moules. Couleurs vives en période de reproduction.",
    alimentation: "Omnivore : algues, petits invertébrés, plancton",
    reproduction: "Pond ses œufs dans les moules d'eau douce",
    statut: "Préoccupation mineure",
    techniques: "Pêche très fine, micro appâts"
  },
  "Brème": {
    habitat: "Eaux calmes, lacs, étangs",
    taille: "30-70 cm",
    poids: "1-6 kg",
    description: "Cyprinidé au corps haut et comprimé. Vit en bancs, très méfiant. Recherché par les pêcheurs au coup.",
    alimentation: "Omnivore : invertébrés benthiques, végétaux, vers",
    reproduction: "Fraie au printemps dans les herbiers",
    statut: "Préoccupation mineure",
    techniques: "Pêche au coup, feeder, vers, graines"
  },
  "Brème bordelière": {
    habitat: "Rivières lentes, lacs, étangs",
    taille: "15-35 cm",
    poids: "200-800 g",
    description: "Plus petite que la brème commune, souvent confondue avec elle. Corps moins haut.",
    alimentation: "Omnivore : invertébrés, algues, détritus",
    reproduction: "Fraie au printemps en groupe",
    statut: "Préoccupation mineure",
    techniques: "Pêche au coup, petits appâts"
  },
  "Brochet": {
    habitat: "Eaux calmes, herbiers aquatiques",
    taille: "30-130 cm",
    poids: "0.5-15 kg",
    description: "Grand prédateur d'eau douce, reconnaissable à sa mâchoire allongée et ses dents acérées. Excellent nageur et chasseur à l'affût.",
    alimentation: "Carnivore : poissons, grenouilles, écrevisses",
    reproduction: "Fraie au printemps dans les zones peu profondes",
    statut: "Préoccupation mineure",
    techniques: "Leurres, vifs, pêche aux leurres artificiels"
  },
  "Carassin": {
    habitat: "Eaux stagnantes, étangs, mares",
    taille: "15-45 cm",
    poids: "0.2-3 kg",
    description: "Cyprinidé très résistant, capable de survivre dans des eaux pauvres en oxygène. Ancêtre du poisson rouge.",
    alimentation: "Omnivore : végétaux, invertébrés, détritus",
    reproduction: "Fraie au printemps et été",
    statut: "Préoccupation mineure",
    techniques: "Pêche au coup, appâts végétaux"
  },
  "Carpe": {
    habitat: "Eaux calmes et chaudes, étangs, lacs",
    taille: "30-80 cm",
    poids: "1-20 kg",
    description: "Poisson robuste et intelligent, très recherché par les carpistes. Capable de vivre très longtemps et d'atteindre de grandes tailles.",
    alimentation: "Omnivore : végétaux, vers, mollusques",
    reproduction: "Fraie au printemps dans les herbiers",
    statut: "Préoccupation mineure",
    techniques: "Bouillettes, maïs, vers de terre, pêche à la carpe"
  },
  "Carpe commune": {
    habitat: "Lacs, étangs, rivières lentes",
    taille: "30-100 cm",
    poids: "2-30 kg",
    description: "La plus répandue des carpes, poisson emblématique de la pêche sportive. Intelligence remarquable.",
    alimentation: "Omnivore : tout type d'aliments disponibles",
    reproduction: "Fraie bruyante au printemps dans les herbiers",
    statut: "Préoccupation mineure",
    techniques: "Toutes techniques carpistes, bouillettes, graines"
  },
  "Chabot": {
    habitat: "Ruisseaux et rivières à courant, fond rocheux",
    taille: "8-18 cm",
    poids: "10-50 g",
    description: "Petit poisson benthique aux nageoires pectorales développées. Indicateur de bonne qualité d'eau.",
    alimentation: "Carnivore : larves d'insectes, vers, œufs de poissons",
    reproduction: "Fraie au printemps sous les pierres",
    statut: "Préoccupation mineure",
    techniques: "Pêche très fine, vers de vase, larves"
  },
  "Chevaine": {
    habitat: "Rivières, cours d'eau variés",
    taille: "20-80 cm",
    poids: "0.5-8 kg",
    description: "Cyprinidé robuste et opportuniste, excellent sauteur. Très méfiant et intelligent.",
    alimentation: "Omnivore : insectes, fruits, petits poissons, végétaux",
    reproduction: "Fraie au printemps sur graviers",
    statut: "Préoccupation mineure",
    techniques: "Pêche au coup, leurres, appâts variés"
  },
  "Chevesne": {
    habitat: "Rivières courantes et lentes",
    taille: "20-80 cm",
    poids: "0.5-8 kg",
    description: "Autre nom du chevaine, cyprinidé très adaptable et répandu. Poisson méfiant aux mœurs variées.",
    alimentation: "Omnivore : insectes, fruits tombés, alevin, végétaux",
    reproduction: "Reproduction printanière sur fond graveleux",
    statut: "Préoccupation mineure",
    techniques: "Pêche à la mouche, au coup, leurres légers"
  },
  "Épinoche": {
    habitat: "Ruisseaux, mares, eaux saumâtres",
    taille: "4-11 cm",
    poids: "2-8 g",
    description: "Très petit poisson aux épines dorsales caractéristiques. Comportement de reproduction complexe.",
    alimentation: "Carnivore : larves, petits crustacés, vers",
    reproduction: "Le mâle construit un nid et garde les œufs",
    statut: "Préoccupation mineure",
    techniques: "Pêche micro, appâts minuscules"
  },
  "Gardon": {
    habitat: "Rivières lentes, lacs, étangs",
    taille: "15-35 cm",
    poids: "0.1-1.5 kg",
    description: "Cyprinidé très commun, poisson de base pour l'apprentissage de la pêche. Forme souvent de gros bancs.",
    alimentation: "Omnivore : algues, petits invertébrés",
    reproduction: "Fraie au printemps en groupe",
    statut: "Préoccupation mineure",
    techniques: "Pêche au coup, vers, asticots, pain"
  },
  "Goujon": {
    habitat: "Rivières à fond sableux ou graveleux",
    taille: "8-20 cm",
    poids: "20-100 g",
    description: "Petit cyprinidé benthique aux barbillons. Vit en bancs près du fond, très actif.",
    alimentation: "Omnivore : invertébrés benthiques, algues, débris",
    reproduction: "Fraie au printemps en groupe",
    statut: "Préoccupation mineure",
    techniques: "Pêche au coup fine, vers de vase, asticots"
  },
  "Hotu": {
    habitat: "Rivières courantes, eaux claires",
    taille: "20-50 cm",
    poids: "0.2-2 kg",
    description: "Cyprinidé rhéophile au museau proéminent. Forme des bancs denses, espèce grégaire.",
    alimentation: "Omnivore : algues, invertébrés, détritus",
    reproduction: "Fraie au printemps sur graviers",
    statut: "Préoccupation mineure",
    techniques: "Pêche au coup en rivière, vers, larves"
  },
  "Ide": {
    habitat: "Rivières lentes, lacs",
    taille: "30-80 cm",
    poids: "1-8 kg",
    description: "Grand cyprinidé élégant aux reflets dorés. Poisson grégaire appréciant les eaux bien oxygénées.",
    alimentation: "Omnivore : insectes, petits poissons, végétaux",
    reproduction: "Fraie au printemps en bancs",
    statut: "Préoccupation mineure",
    techniques: "Pêche au coup, leurres, appâts naturels"
  },
  "Lamproie de Planer": {
    habitat: "Ruisseaux et rivières claires",
    taille: "10-20 cm",
    poids: "5-15 g",
    description: "Cyclostome primitif, larve filtrante pendant plusieurs années. Adulte ne se nourrit pas.",
    alimentation: "Larve filtrante : détritus, algues microscopiques",
    reproduction: "Fraie au printemps puis meurt",
    statut: "Préoccupation mineure",
    techniques: "Très rarement pêchée"
  },
  "Loche franche": {
    habitat: "Rivières à fond sableux ou limoneux",
    taille: "10-30 cm",
    poids: "50-300 g",
    description: "Poisson benthique allongé, nocturne. Capable de respirer par l'intestin en cas de manque d'oxygène.",
    alimentation: "Omnivore : invertébrés benthiques, détritus, algues",
    reproduction: "Fraie au printemps dans les végétaux",
    statut: "Préoccupation mineure",
    techniques: "Pêche de fond nocturne, vers"
  },
  "Lote": {
    habitat: "Lacs profonds et froids, rivières",
    taille: "30-80 cm",
    poids: "0.5-5 kg",
    description: "Seul gadidé d'eau douce, poisson nocturne d'eaux froides. Chair excellente mais pêche difficile.",
    alimentation: "Carnivore : poissons, écrevisses, vers",
    reproduction: "Fraie en hiver sous la glace",
    statut: "Préoccupation mineure",
    techniques: "Pêche de fond nocturne, vifs, vers"
  },
  "Ombre commun": {
    habitat: "Rivières courantes et fraîches",
    taille: "30-60 cm",
    poids: "0.5-3 kg",
    description: "Salmonidé élégant à la grande nageoire dorsale. Exige des eaux pures et bien oxygénées.",
    alimentation: "Carnivore : insectes aquatiques et terrestres, larves",
    reproduction: "Fraie au printemps sur graviers",
    statut: "Vulnérable",
    techniques: "Pêche à la mouche, appâts naturels fins"
  },
  "Perche": {
    habitat: "Lacs, rivières, étangs",
    taille: "15-50 cm",
    poids: "0.1-3 kg",
    description: "Poisson rayé facilement reconnaissable, grégaire quand il est jeune. Prédateur opportuniste très commun.",
    alimentation: "Carnivore : petits poissons, larves, vers",
    reproduction: "Fraie au printemps en bancs",
    statut: "Préoccupation mineure",
    techniques: "Petits leurres, vers, pêche au drop shot"
  },
  "Perche commune": {
    habitat: "Eaux douces variées, lacs, rivières",
    taille: "15-50 cm",
    poids: "0.1-3 kg",
    description: "Percidé emblématique aux rayures verticales. Prédateur vorace en bancs dans sa jeunesse.",
    alimentation: "Carnivore : poissons, larves d'insectes, crustacés",
    reproduction: "Pond en longues guirlandes gélatineuses",
    statut: "Préoccupation mineure",
    techniques: "Leurres souples, vifs, vers de terre"
  },
  "Perche soleil": {
    habitat: "Eaux calmes et chaudes, étangs",
    taille: "8-20 cm",
    poids: "50-200 g",
    description: "Petit centrarchidé introduit d'Amérique du Nord. Très coloré, territorial et agressif.",
    alimentation: "Carnivore : invertébrés, larves, petits poissons",
    reproduction: "Le mâle creuse et garde le nid",
    statut: "Espèce introduite",
    techniques: "Pêche légère, petits appâts"
  },
  "Poisson-chat": {
    habitat: "Eaux calmes et chaudes, étangs",
    taille: "15-45 cm",
    poids: "0.2-2 kg",
    description: "Siluriforme introduit d'Amérique du Nord, très résistant. Barbillons caractéristiques, nocturne.",
    alimentation: "Omnivore : invertébrés, débris, œufs de poissons",
    reproduction: "Garde parentale des œufs et alevins",
    statut: "Espèce introduite envahissante",
    techniques: "Pêche de fond, vers, appâts variés"
  },
  "Pseudorasbora": {
    habitat: "Eaux stagnantes, étangs, canaux",
    taille: "5-11 cm",
    poids: "5-25 g",
    description: "Petit cyprinidé asiatique invasif. Se reproduit très rapidement et colonise tous les milieux.",
    alimentation: "Omnivore : plancton, larves, œufs de poissons",
    reproduction: "Reproduction très prolifique",
    statut: "Espèce introduite envahissante",
    techniques: "Capturé accidentellement"
  },
  "Rotengle": {
    habitat: "Eaux stagnantes, étangs riches en végétation",
    taille: "15-40 cm",
    poids: "0.1-2 kg",
    description: "Cyprinidé aux reflets dorés, souvent confondu avec le gardon. Préfère les eaux chaudes et bien végétalisées.",
    alimentation: "Omnivore : végétaux, insectes aquatiques",
    reproduction: "Fraie au printemps dans les herbiers",
    statut: "Préoccupation mineure",
    techniques: "Pêche au coup, vers, larves d'insectes"
  },
  "Sandre": {
    habitat: "Grands lacs, rivières lentes",
    taille: "40-100 cm",
    poids: "1-10 kg",
    description: "Prédateur lucifuge aux yeux caractéristiques, excellent nageur. Chair très appréciée en cuisine.",
    alimentation: "Carnivore : petits poissons, vers",
    reproduction: "Fraie au printemps, le mâle garde le nid",
    statut: "Préoccupation mineure",
    techniques: "Leurres souples, vifs, pêche verticale"
  },
  "Silure": {
    habitat: "Grands fleuves, lacs profonds",
    taille: "100-300 cm",
    poids: "10-100+ kg",
    description: "Plus grand poisson d'eau douce d'Europe, prédateur redoutable aux longues barbillons. Peut vivre très longtemps.",
    alimentation: "Carnivore : poissons, écrevisses, parfois oiseaux",
    reproduction: "Fraie au printemps, garde parentale",
    statut: "Préoccupation mineure",
    techniques: "Gros vifs, leurres volumineux, pêche du bord ou en bateau"
  },
  "Silure glane": {
    habitat: "Grands cours d'eau, lacs",
    taille: "150-300 cm",
    poids: "20-150+ kg",
    description: "Géant des eaux douces européennes. Prédateur apex aux sens très développés.",
    alimentation: "Carnivore : gros poissons, écrevisses, rongeurs",
    reproduction: "Nidification et garde parentale élaborées",
    statut: "Préoccupation mineure",
    techniques: "Pêche aux gros vifs, pellets, techniques spécialisées"
  },
  "Spirlin": {
    habitat: "Rivières courantes, eaux claires",
    taille: "8-18 cm",
    poids: "15-60 g",
    description: "Petit cyprinidé grégaire des eaux vives. Corps fusiforme adapté au courant.",
    alimentation: "Omnivore : algues, invertébrés, détritus",
    reproduction: "Fraie au printemps en bancs",
    statut: "Préoccupation mineure",
    techniques: "Pêche au coup légère en rivière"
  },
  "Tanche": {
    habitat: "Eaux stagnantes, vaseuses et chaudes",
    taille: "20-60 cm",
    poids: "0.5-5 kg",
    description: "Poisson à la peau visqueuse, très résistant aux conditions difficiles. Excellent combattant une fois ferré.",
    alimentation: "Omnivore : vers, mollusques, débris végétaux",
    reproduction: "Fraie en été dans la végétation",
    statut: "Préoccupation mineure",
    techniques: "Vers de terre, bouillettes, pêche de fond"
  },
  "Truite commune": {
    habitat: "Rivières et ruisseaux frais et oxygénés",
    taille: "20-80 cm",
    poids: "0.2-8 kg",
    description: "Salmonidé emblématique des eaux claires et fraîches. Grande variabilité de formes et couleurs.",
    alimentation: "Carnivore : insectes, larves, petits poissons",
    reproduction: "Fraie en automne-hiver sur graviers",
    statut: "Préoccupation mineure",
    techniques: "Pêche à la mouche, leurres, appâts naturels"
  },
  "Truite fario": {
    habitat: "Ruisseaux et rivières de montagne",
    taille: "20-60 cm",
    poids: "0.2-5 kg",
    description: "Forme sédentaire de la truite commune. Reine des eaux vives et fraîches de montagne.",
    alimentation: "Carnivore : insectes terrestres et aquatiques",
    reproduction: "Fraie en automne dans les frayères",
    statut: "Préoccupation mineure",
    techniques: "Pêche à la mouche sèche, toc, leurres"
  },
  "Vairon": {
    habitat: "Ruisseaux et rivières fraîches",
    taille: "6-14 cm",
    poids: "5-30 g",
    description: "Très petit cyprinidé grégaire des eaux fraîches. Couleurs vives en période de reproduction.",
    alimentation: "Omnivore : algues, invertébrés, débris",
    reproduction: "Fraie au printemps en bancs denses",
    statut: "Préoccupation mineure",
    techniques: "Pêche très fine, micro appâts, vif pour carnassiers"
  },
  "Vandoise": {
    habitat: "Rivières courantes, eaux bien oxygénées",
    taille: "15-35 cm",
    poids: "100-500 g",
    description: "Cyprinidé rhéophile au corps fusiforme. Forme de gros bancs, espèce grégaire.",
    alimentation: "Omnivore : algues, invertébrés, insectes",
    reproduction: "Fraie au printemps sur graviers",
    statut: "Préoccupation mineure",
    techniques: "Pêche au coup en rivière, appâts naturels"
  }
};

export default function SpeciesDetailScreen() {
  const params = useLocalSearchParams();
  const { commonName, scientificName, emoji } = params;
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();

  // Recherche des données enrichies
  const fishData = fishDatabase[commonName as string] || null;

  const InfoCard = ({ title, content, icon }: { title: string, content: string, icon: string }) => (
    <View style={[styles.infoCard, { backgroundColor: colorScheme === 'dark' ? '#333' : '#ffffff' }]}>
      <View style={styles.infoHeader}>
        <FontAwesome name={icon as any} size={20} color="#204553" />
        <Text style={[styles.infoTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          {title}
        </Text>
      </View>
      <Text style={[styles.infoContent, { color: Colors[colorScheme ?? 'light'].text }]}>
        {content}
      </Text>
    </View>
  );

  const StatCard = ({ label, value, icon }: { label: string, value: string, icon: string }) => (
    <View style={[styles.statCard, { backgroundColor: colorScheme === 'dark' ? '#333' : '#ffffff' }]}>
      <FontAwesome name={icon as any} size={24} color="#204553" style={styles.statIcon} />
      <Text style={[styles.statValue, { color: Colors[colorScheme ?? 'light'].text }]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <Stack.Screen options={{ 
        title: commonName as string,
        headerBackTitle: "Retour"
      }} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header avec emoji et noms */}
        <View style={[styles.header, { backgroundColor: colorScheme === 'dark' ? '#333' : '#E2ECF6' }]}>
          <View style={styles.emojiContainer}>
            <Text style={styles.largeEmoji}>{emoji}</Text>
          </View>
          <Text style={[styles.commonName, { color: Colors[colorScheme ?? 'light'].text }]}>
            {commonName}
          </Text>
          <Text style={styles.scientificName}>
            {scientificName}
          </Text>
        </View>

        {fishData ? (
          <>
            {/* Statistiques rapides */}
            <View style={styles.statsContainer}>
              <StatCard label="Taille" value={fishData.taille} icon="line-chart" />
              <StatCard label="Poids" value={fishData.poids} icon="balance-scale" />
            </View>

            {/* Description */}
            <InfoCard 
              title="Description" 
              content={fishData.description}
              icon="info-circle"
            />

            {/* Habitat */}
            <InfoCard 
              title="Habitat" 
              content={fishData.habitat}
              icon="map-marker"
            />

            {/* Alimentation */}
            <InfoCard 
              title="Alimentation" 
              content={fishData.alimentation}
              icon="cutlery"
            />

            {/* Reproduction */}
            <InfoCard 
              title="Reproduction" 
              content={fishData.reproduction}
              icon="heart"
            />

            {/* Techniques de pêche */}
            <InfoCard 
              title="Techniques de pêche" 
              content={fishData.techniques}
              icon="anchor"
            />

            {/* Statut de conservation */}
            <View style={[styles.statusCard, { backgroundColor: colorScheme === 'dark' ? '#333' : '#ffffff' }]}>
              <View style={styles.infoHeader}>
                <FontAwesome name="shield" size={20} color="#204553" />
                <Text style={[styles.infoTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Statut de conservation
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={[styles.statusText, { 
                  color: fishData.statut === "En danger critique" ? "#d32f2f" : 
                         fishData.statut === "Espèce introduite" ? "#ff9800" : "#4caf50"
                }]}>
                  {fishData.statut}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View style={[styles.noDataCard, { backgroundColor: colorScheme === 'dark' ? '#333' : '#ffffff' }]}>
            <FontAwesome name="info-circle" size={40} color="#999" style={styles.noDataIcon} />
            <Text style={[styles.noDataTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Informations limitées
            </Text>
            <Text style={styles.noDataText}>
              Les données détaillées pour cette espèce ne sont pas encore disponibles dans notre base de données.
            </Text>
            <Text style={[styles.scientificNameOnly, { color: Colors[colorScheme ?? 'light'].text }]}>
              Nom scientifique : {scientificName}
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 30,
    marginBottom: 20,
  },
  emojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  largeEmoji: {
    fontSize: 40,
  },
  commonName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  scientificName: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    marginBottom: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  infoContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  statusCard: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noDataCard: {
    marginHorizontal: 20,
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noDataIcon: {
    marginBottom: 15,
  },
  noDataTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 15,
  },
  scientificNameOnly: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 30,
  },
});