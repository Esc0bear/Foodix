import React from 'react';
import {
  Box,
  Pressable,
  VStack,
  HStack,
  Text,
  Badge,
  BadgeText,
  Image,
  AspectRatio,
} from '@gluestack-ui/themed';
import { Recipe } from '../types/recipe';
import {
  formatTime,
  formatDifficulty,
  formatDate,
  getDifficultyColor,
  calculateTotalTime,
  truncateText,
} from '../utils/format';

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
  onDelete?: () => void;
}

/**
 * Carte d'affichage d'une recette dans la liste
 */
export default function RecipeCard({ recipe, onPress, onDelete }: RecipeCardProps) {
  const totalTime = calculateTotalTime(recipe);
  
  return (
    <Pressable onPress={onPress}>
      {({ isPressed }: { isPressed: boolean }) => (
        <Box
          bg="$white"
          borderRadius="$lg"
          shadowColor="$black"
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={0.1}
          shadowRadius={4}
          elevation={2}
          marginBottom="$3"
          opacity={isPressed ? 0.8 : 1}
          transform={[{ scale: isPressed ? 0.98 : 1 }]}
        >
          <HStack space="md" padding="$4">
            {/* Image de la recette */}
            <Box width="$20" height="$20">
              <AspectRatio ratio={1}>
                <Image
                  source={{ uri: recipe.source.thumbnail || undefined }}
                  alt={recipe.title}
                  borderRadius="$md"
                  bg="$gray100"
                />
              </AspectRatio>
            </Box>

            {/* Contenu de la carte */}
            <VStack flex={1} space="xs" justifyContent="space-between">
              {/* Titre et résumé */}
              <VStack space="xs" flex={1}>
                <Text
                  fontSize="$md"
                  fontWeight="$semibold"
                  color="$text900"
                  numberOfLines={2}
                >
                  {recipe.title}
                </Text>
                
                {recipe.summary && (
                  <Text
                    fontSize="$sm"
                    color="$gray600"
                    numberOfLines={2}
                  >
                    {truncateText(recipe.summary, 100)}
                  </Text>
                )}
              </VStack>

              {/* Métadonnées */}
              <VStack space="xs">
                {/* Badges d'information */}
                <HStack space="sm" flexWrap="wrap">
                  {recipe.difficulty && (
                    <Badge
                      variant="solid"
                      action="primary"
                      size="sm"
                      bg={getDifficultyColor(recipe.difficulty)}
                    >
                      <BadgeText>{formatDifficulty(recipe.difficulty)}</BadgeText>
                    </Badge>
                  )}
                  
                  {totalTime && (
                    <Badge variant="outline" size="sm">
                      <BadgeText>{formatTime(totalTime)}</BadgeText>
                    </Badge>
                  )}
                  
                  {recipe.servings && (
                    <Badge variant="outline" size="sm">
                      <BadgeText>{recipe.servings} portion{recipe.servings > 1 ? 's' : ''}</BadgeText>
                    </Badge>
                  )}
                </HStack>

                {/* Source et date */}
                <HStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$xs" color="$gray500">
                    {recipe.source.author || 'Instagram'}
                  </Text>
                  <Text fontSize="$xs" color="$gray500">
                    {formatDate(recipe.createdAt)}
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </HStack>
        </Box>
      )}
    </Pressable>
  );
}
