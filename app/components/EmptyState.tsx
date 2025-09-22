import React from 'react';
import {
  Box,
  Text,
  VStack,
  Icon,
} from '@gluestack-ui/themed';
// import { SearchIcon } from '@gluestack-ui/icons';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<any>;
}

/**
 * Composant pour afficher un état vide avec icône et texte
 */
export default function EmptyState({ 
  title, 
  description, 
  icon: IconComponent 
}: EmptyStateProps) {
  return (
    <Box flex={1} justifyContent="center" alignItems="center" padding="$8">
      <VStack space="md" alignItems="center">
        {IconComponent && (
          <Icon
            as={IconComponent}
            size="xl"
            color="$primary500"
          />
        )}
        <Text 
          fontSize="$lg" 
          fontWeight="$semibold" 
          color="$text900"
          textAlign="center"
        >
          {title}
        </Text>
        {description && (
          <Text 
            fontSize="$sm" 
            color="$gray600"
            textAlign="center"
            maxWidth={280}
          >
            {description}
          </Text>
        )}
      </VStack>
    </Box>
  );
}
