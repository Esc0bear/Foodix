import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Constants from 'expo-constants';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/gluestack-theme';
import { checkOEmbedStatus } from '../services/oembed';
import { checkAPIStatus } from '../services/api';
import { useRecipesStore } from '../store/useRecipesStore';

/**
 * Écran des paramètres de l'application - Design moderne inspiré de ReelMeal
 */
export default function SettingsScreen() {
  const [oEmbedStatus, setOEmbedStatus] = useState<'checking' | 'ok' | 'nok'>('checking');
  const [openAIStatus, setOpenAIStatus] = useState<'checking' | 'ok' | 'nok'>('checking');

  useEffect(() => {
    const fetchStatuses = async () => {
      // Check oEmbed status
      try {
        const oEmbedOk = await checkOEmbedStatus();
        setOEmbedStatus(oEmbedOk ? 'ok' : 'nok');
      } catch (error) {
        console.error('Erreur de vérification oEmbed:', error);
        setOEmbedStatus('nok');
      }

      // Check OpenAI proxy status
      try {
        const openAIOk = await checkAPIStatus('openai');
        setOpenAIStatus(openAIOk ? 'ok' : 'nok');
      } catch (error) {
        console.error('Erreur de vérification OpenAI:', error);
        setOpenAIStatus('nok');
      }
    };

    fetchStatuses();
  }, []);

  const renderStatus = (status: 'checking' | 'ok' | 'nok') => {
    switch (status) {
      case 'checking':
        return <ActivityIndicator size="small" color={colors.gray[500]} />;
      case 'ok':
        return <Text style={[styles.statusText, { color: 'green' }]}>OK</Text>;
      case 'nok':
        return <Text style={[styles.statusText, { color: 'red' }]}>NOK</Text>;
    }
  };

  const handlePressLink = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  };

  const handleSendEmail = () => {
    Linking.openURL(`mailto:${Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPPORT_EMAIL}`).catch((err) =>
      console.error('Failed to open email client:', err)
    );
  };

  const handleClearRecipes = () => {
    useRecipesStore.getState().clearRecipes();
  };

  return (
    <View style={styles.container}>
      {/* Fond violet très clair avec opacité */}
      <View style={styles.backgroundOverlay} />
      <ScrollView>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>
          Manage your account, subscription, and app preferences.
        </Text>
      </View>

      {/* Premium Active Section */}
      <View style={styles.section}>
        <View style={styles.premiumCard}>
          <View style={styles.premiumIcon}>
            <Text style={styles.premiumIconText}>💎</Text>
          </View>
          <View style={styles.premiumContent}>
            <Text style={styles.premiumTitle}>Premium Active</Text>
            <Text style={styles.premiumSubtitle}>
              You're enjoying all Premium features.
            </Text>
          </View>
        </View>
      </View>

      {/* Cloud Sync Section */}
      <View style={styles.section}>
        <View style={styles.syncCard}>
          <View style={styles.syncIcon}>
            <Text style={styles.syncIconText}>☁️</Text>
          </View>
          <View style={styles.syncContent}>
            <Text style={styles.syncTitle}>Cloud Sync</Text>
            <Text style={styles.syncSubtitle}>
              Sign in to sync your recipes across devices.
            </Text>
            <View style={styles.syncButtons}>
              <TouchableOpacity style={styles.appleButton}>
                <Text style={styles.appleIcon}>🍎</Text>
                <Text style={styles.appleText}>Sign in with Apple</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.googleButton}>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleText}>Sign in with Google</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* App Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        
        <View style={styles.settingsCard}>
          {/* Help & Support */}
          <TouchableOpacity style={styles.settingItem} onPress={handleSendEmail}>
            <View style={[styles.settingIcon, { backgroundColor: '#E3F2FD' }]}>
              <Text style={styles.settingIconText}>?</Text>
            </View>
            <Text style={styles.settingText}>Help & Support</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          {/* Privacy Policy */}
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => handlePressLink(Constants.expoConfig?.extra?.EXPO_PUBLIC_PRIVACY_URL || '')}
          >
            <View style={[styles.settingIcon, { backgroundColor: '#E8F5E8' }]}>
              <Text style={styles.settingIconText}>✓</Text>
            </View>
            <Text style={styles.settingText}>Privacy Policy</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          {/* Terms of Service */}
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => handlePressLink(Constants.expoConfig?.extra?.EXPO_PUBLIC_TERMS_URL || '')}
          >
            <View style={[styles.settingIcon, { backgroundColor: '#FFF3E0' }]}>
              <Text style={styles.settingIconText}>📄</Text>
            </View>
            <Text style={styles.settingText}>Terms of Service</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          {/* Service Status */}
          <View style={styles.settingItem}>
            <View style={[styles.settingIcon, { backgroundColor: '#F3E5F5' }]}>
              <Text style={styles.settingIconText}>🔗</Text>
            </View>
            <Text style={styles.settingText}>Service Status</Text>
            <View style={styles.statusContainer}>
              {renderStatus(oEmbedStatus)}
            </View>
          </View>

          {/* Clear Recipes */}
          <TouchableOpacity style={styles.settingItem} onPress={handleClearRecipes}>
            <View style={[styles.settingIcon, { backgroundColor: '#FFEBEE' }]}>
              <Text style={styles.settingIconText}>🗑️</Text>
            </View>
            <Text style={styles.settingText}>Clear All Recipes</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Foodix - Version {Constants.expoConfig?.version}
        </Text>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  // Fond violet très clair avec opacité
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(168, 85, 247, 0.05)', // primary.500 avec 5% d'opacité
    zIndex: -1,
  },
  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.sizes.md,
    color: colors.gray[600],
    fontWeight: typography.weights.normal,
  },
  // Sections
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.black,
    marginBottom: spacing.md,
  },
  // Premium Card
  premiumCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.card,
  },
  premiumIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  premiumIconText: {
    fontSize: 24,
    color: colors.white,
  },
  premiumContent: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  premiumSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
  },
  // Sync Card
  syncCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  syncIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  syncIconText: {
    fontSize: 24,
    color: '#1976D2',
  },
  syncContent: {
    flex: 1,
  },
  syncTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.black,
    marginBottom: spacing.xs,
  },
  syncSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
  },
  syncButtons: {
    gap: spacing.sm,
  },
  appleButton: {
    backgroundColor: colors.black,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
    color: colors.white,
  },
  appleText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  googleButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  googleIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
    color: colors.gray[700],
    fontWeight: typography.weights.bold,
  },
  googleText: {
    color: colors.black,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  // Settings Card
  settingsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    ...shadows.card,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingIconText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: typography.weights.bold,
  },
  settingText: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.black,
    fontWeight: typography.weights.medium,
  },
  chevron: {
    fontSize: 20,
    color: colors.gray[400],
    fontWeight: typography.weights.bold,
  },
  statusContainer: {
    marginLeft: spacing.sm,
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.sizes.sm,
    color: colors.gray[500],
    fontWeight: typography.weights.medium,
  },
});