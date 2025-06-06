/**
 * Service pour récupérer les données piscicoles depuis l'API Hub'Eau
 */

interface Station {
  code_station: string;
  libelle_station: string;
  code_commune: string;
  libelle_commune: string;
  latitude: number;
  longitude: number;
}

interface OperationIndicator {
  code_operation: string;
  code_station: string;
  ipr_noms_communs_taxon: string[];
  ipr_noms_latins_taxon: string[];
}

interface DepartmentFishData {
  spotCount: number;
  allPossibleSpecies: {
    commonName: string;
    scientificName: string;
  }[];
  stations: {
    code: string;
    name: string;
    commune: string;
    possibleSpecies: {
      commonName: string;
      scientificName: string;
    }[];
    coordinates: {
      latitude: number;
      longitude: number;
    };
  }[];
}

/**
 * Récupère les données piscicoles pour un département spécifique
 * @param departmentCode Code du département (ex: '33' pour la Gironde)
 * @returns Données consolidées sur les spots de pêche et les espèces
 */
export const getFishDataByDepartment = async (departmentCode: string): Promise<DepartmentFishData> => {
  try {
    const stationsUrl = `https://hubeau.eaufrance.fr/api/v1/etat_piscicole/stations?code_departement=${departmentCode}&size=100&format=json`;
    const stationsResponse = await fetch(stationsUrl);
    
    if (!stationsResponse.ok) {
      throw new Error(`Erreur lors de la récupération des stations: ${stationsResponse.status}`);
    }
    
    const stationsData = await stationsResponse.json();
    const stations: Station[] = stationsData.data || [];
    
    if (stations.length === 0) {
      throw new Error(`Aucune station trouvée pour le département ${departmentCode}`);
    }
    
    const indicatorsUrl = `https://hubeau.eaufrance.fr/api/v1/etat_piscicole/indicateurs?code_departement=${departmentCode}&size=100&format=json`;
    const indicatorsResponse = await fetch(indicatorsUrl);
    
    if (!indicatorsResponse.ok) {
      throw new Error(`Erreur lors de la récupération des indicateurs: ${indicatorsResponse.status}`);
    }
    
    const indicatorsData = await indicatorsResponse.json();
    const indicators: OperationIndicator[] = indicatorsData.data || [];
    
    const stationsByCode = new Map<string, Station>();
    stations.forEach(station => {
      stationsByCode.set(station.code_station, station);
    });
    
    const allPossibleSpeciesMap = new Map<string, string>();
    
    indicators.forEach(indicator => {
      if (indicator.ipr_noms_communs_taxon && indicator.ipr_noms_latins_taxon) {
        indicator.ipr_noms_communs_taxon.forEach((commonName, index) => {
          if (!allPossibleSpeciesMap.has(commonName)) {
            allPossibleSpeciesMap.set(
              commonName, 
              indicator.ipr_noms_latins_taxon[index] || ''
            );
          }
        });
      }
    });
    
    const allPossibleSpecies = Array.from(allPossibleSpeciesMap.entries()).map(([commonName, scientificName]) => ({
      commonName,
      scientificName
    }));
    
    const stationDetails = indicators
      .filter(indicator => indicator.code_station && stationsByCode.has(indicator.code_station))
      .map(indicator => {
        const station = stationsByCode.get(indicator.code_station)!;
        
        const indicatorSpeciesMap = new Map<string, string>();
        if (indicator.ipr_noms_communs_taxon && indicator.ipr_noms_latins_taxon) {
          indicator.ipr_noms_communs_taxon.forEach((commonName, index) => {
            if (!indicatorSpeciesMap.has(commonName)) {
              indicatorSpeciesMap.set(
                commonName, 
                indicator.ipr_noms_latins_taxon[index] || ''
              );
            }
          });
        }
        
        const indicatorSpecies = Array.from(indicatorSpeciesMap.entries()).map(([commonName, scientificName]) => ({
          commonName,
          scientificName
        }));
        
        return {
          code: indicator.code_operation,
          name: station.libelle_station,
          commune: station.libelle_commune,
          possibleSpecies: indicatorSpecies,
          coordinates: {
            latitude: station.latitude,
            longitude: station.longitude
          }
        };
      });
    
    return {
      spotCount: stationDetails.length,
      allPossibleSpecies: allPossibleSpecies,
      stations: stationDetails
    };
    
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    throw error;
  }
};

/**
 * Récupère les données pour la Gironde
 * @returns Données piscicoles pour la Gironde
 */
export const getGirondeFishData = (): Promise<DepartmentFishData> => {
  return getFishDataByDepartment('33');
};