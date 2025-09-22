import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  InputField,
  Button,
  ButtonText,
  Badge,
  BadgeText,
  Pressable,
  Text,
  ScrollView,
} from '@gluestack-ui/themed';
// import { SearchIcon, FilterIcon, XIcon } from '@gluestack-ui/icons';
import { RecipeFilters, DifficultyFilter, TimeFilter } from '../types/recipe';

interface FiltersBarProps {
  onFilter: (filters: RecipeFilters) => void;
  initialFilters?: RecipeFilters;
}

const DIFFICULTY_OPTIONS: { value: DifficultyFilter; label: string }[] = [
  { value: 'easy', label: 'Facile' },
  { value: 'medium', label: 'Moyen' },
  { value: 'hard', label: 'Difficile' },
];

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: '≤15', label: '≤ 15 min' },
  { value: '≤30', label: '≤ 30 min' },
  { value: '≤60', label: '≤ 60 min' },
  { value: '>60', label: '> 60 min' },
];

/**
 * Barre de filtres pour les recettes
 */
export default function FiltersBar({ onFilter, initialFilters = {} }: FiltersBarProps) {
  const [searchText, setSearchText] = useState(initialFilters.searchText || '');
  const [difficulty, setDifficulty] = useState<DifficultyFilter | undefined>(initialFilters.difficulty);
  const [time, setTime] = useState<TimeFilter | undefined>(initialFilters.time);
  const [showFilters, setShowFilters] = useState(false);

  // Appliquer les filtres
  const applyFilters = () => {
    const filters: RecipeFilters = {
      searchText: searchText.trim() || undefined,
      difficulty,
      time,
      platform: 'instagram', // Toujours Instagram pour cette app
    };
    
    onFilter(filters);
  };

  // Effacer tous les filtres
  const clearFilters = () => {
    setSearchText('');
    setDifficulty(undefined);
    setTime(undefined);
    onFilter({});
  };

  // Effacer un filtre spécifique
  const clearFilter = (type: 'search' | 'difficulty' | 'time') => {
    switch (type) {
      case 'search':
        setSearchText('');
        break;
      case 'difficulty':
        setDifficulty(undefined);
        break;
      case 'time':
        setTime(undefined);
        break;
    }
    applyFilters();
  };

  // Vérifier s'il y a des filtres actifs
  const hasActiveFilters = searchText.trim() || difficulty || time;

  return (
    <VStack space="sm">
      {/* Barre de recherche */}
      <HStack space="sm" alignItems="center">
        <Box flex={1}>
          <Input>
            <InputField
              placeholder="Rechercher une recette ou un ingrédient..."
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={applyFilters}
              returnKeyType="search"
            />
          </Input>
        </Box>
        
        <Button
          variant="outline"
          size="sm"
          onPress={() => setShowFilters(!showFilters)}
        >
          <ButtonText>Filtres</ButtonText>
        </Button>
      </HStack>

      {/* Filtres actifs */}
      {hasActiveFilters && (
        <HStack space="sm" flexWrap="wrap">
          {searchText.trim() && (
            <Badge
              variant="solid"
              action="primary"
              size="sm"
            >
              <BadgeText>Recherche: {searchText.trim()}</BadgeText>
              <Pressable onPress={() => clearFilter('search')} marginLeft="$2">
                <Text fontSize="$xs" color="$white">×</Text>
              </Pressable>
            </Badge>
          )}
          
          {difficulty && (
            <Badge
              variant="solid"
              action="primary"
              size="sm"
            >
              <BadgeText>Difficulté: {DIFFICULTY_OPTIONS.find(d => d.value === difficulty)?.label}</BadgeText>
              <Pressable onPress={() => clearFilter('difficulty')} marginLeft="$2">
                <Text fontSize="$xs" color="$white">×</Text>
              </Pressable>
            </Badge>
          )}
          
          {time && (
            <Badge
              variant="solid"
              action="primary"
              size="sm"
            >
              <BadgeText>Temps: {TIME_OPTIONS.find(t => t.value === time)?.label}</BadgeText>
              <Pressable onPress={() => clearFilter('time')} marginLeft="$2">
                <Text fontSize="$xs" color="$white">×</Text>
              </Pressable>
            </Badge>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onPress={clearFilters}
          >
            <ButtonText>Tout effacer</ButtonText>
          </Button>
        </HStack>
      )}

      {/* Panneau de filtres détaillés */}
      {showFilters && (
        <Box
          bg="$gray50"
          padding="$4"
          borderRadius="$md"
          borderWidth={1}
          borderColor="$gray200"
        >
          <VStack space="md">
            {/* Filtre par difficulté */}
            <VStack space="sm">
              <Text fontSize="$sm" fontWeight="$semibold" color="$gray700">
                Difficulté
              </Text>
              <HStack space="sm" flexWrap="wrap">
                {DIFFICULTY_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={difficulty === option.value ? "solid" : "outline"}
                    size="sm"
                    onPress={() => {
                      setDifficulty(difficulty === option.value ? undefined : option.value);
                    }}
                  >
                    <ButtonText>{option.label}</ButtonText>
                  </Button>
                ))}
              </HStack>
            </VStack>

            {/* Filtre par temps */}
            <VStack space="sm">
              <Text fontSize="$sm" fontWeight="$semibold" color="$gray700">
                Temps de préparation
              </Text>
              <HStack space="sm" flexWrap="wrap">
                {TIME_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={time === option.value ? "solid" : "outline"}
                    size="sm"
                    onPress={() => {
                      setTime(time === option.value ? undefined : option.value);
                    }}
                  >
                    <ButtonText>{option.label}</ButtonText>
                  </Button>
                ))}
              </HStack>
            </VStack>

            {/* Boutons d'action */}
            <HStack space="sm" justifyContent="flex-end">
              <Button
                variant="outline"
                size="sm"
                onPress={() => setShowFilters(false)}
              >
                <ButtonText>Fermer</ButtonText>
              </Button>
              <Button
                size="sm"
                onPress={applyFilters}
              >
                <ButtonText>Appliquer</ButtonText>
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}
    </VStack>
  );
}
