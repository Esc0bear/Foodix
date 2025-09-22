import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme/gluestack-theme';

/**
 * Écran de découverte (placeholder pour l'instant)
 */
export default function DiscoverScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Bientôt disponible</Text>
        <Text style={styles.description}>
          Découvrez bientôt de nouvelles recettes et fonctionnalités passionnantes !
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.black,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  description: {
    fontSize: typography.sizes.lg,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
});