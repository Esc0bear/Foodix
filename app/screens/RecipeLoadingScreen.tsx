import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/gluestack-theme';

const { width, height } = Dimensions.get('window');

interface RecipeLoadingScreenProps {
  visible: boolean;
  currentStep: number;
  totalSteps: number;
  stepText: string;
}

const LOADING_STEPS = [
  {
    id: 1,
    title: "Analyse de votre recette",
    description: "Nous analysons les ingrédients et instructions que vous avez partagés",
    duration: 6000, // 6 secondes
  },
  {
    id: 2,
    title: "Génération avec l'IA",
    description: "Notre intelligence artificielle crée une recette structurée et détaillée",
    duration: 12000, // 12 secondes
  },
  {
    id: 3,
    title: "Validation des données",
    description: "Vérification et formatage des ingrédients, quantités et étapes",
    duration: 4000, // 4 secondes
  },
  {
    id: 4,
    title: "Finalisation",
    description: "Préparation de votre recette personnalisée",
    duration: 2000, // 2 secondes
  },
];

export const RecipeLoadingScreen: React.FC<RecipeLoadingScreenProps> = ({ 
  visible, 
  currentStep, 
  totalSteps, 
  stepText 
}) => {
  const [progress, setProgress] = useState(0);

  console.log('🎨 [RecipeLoadingScreen] Rendu du composant:', {
    visible,
    currentStep,
    totalSteps,
    stepText
  });

  useEffect(() => {
    if (!visible) {
      console.log('🎨 [RecipeLoadingScreen] Composant masqué (visible=false)');
      setProgress(0);
      return;
    }

    console.log('🎨 [RecipeLoadingScreen] Démarrage de l\'animation de progression pour l\'étape:', currentStep);

    // Animation de progression
    const stepDuration = LOADING_STEPS[currentStep - 1]?.duration || 6000;
    const interval = 50; // Mise à jour toutes les 50ms
    const increment = 100 / (stepDuration / interval);

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + increment;
        if (newProgress >= 100) {
          clearInterval(timer);
          return 100;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [visible, currentStep]);

  if (!visible) {
    console.log('🎨 [RecipeLoadingScreen] Composant masqué (visible=false) - return null');
    return null;
  }

  const currentStepData = LOADING_STEPS[currentStep - 1];
  const progressPercentage = Math.min(progress, 100);

  console.log('🎨 [RecipeLoadingScreen] Affichage du composant avec progress:', progressPercentage, 'étape:', currentStepData?.title);

  return (
    <View style={styles.container}>
      {/* Animation Lottie */}
      <View style={styles.animationContainer}>
        <LottieView
          source={{
            uri: 'https://lottie.host/d4b15ef2-fdd4-4ed8-9a4d-7496e7517bf4/EFWNIcDnOe.lottie'
          }}
          autoPlay
          loop
          style={styles.animation}
          resizeMode="contain"
        />
      </View>

      {/* Contenu principal */}
      <View style={styles.content}>
        {/* Titre principal */}
        <Text style={styles.mainTitle}>Création de votre recette</Text>
        
        {/* Étape actuelle */}
        <View style={styles.stepContainer}>
          <Text style={styles.stepNumber}>{currentStep}/{totalSteps}</Text>
          <Text style={styles.stepTitle}>{currentStepData?.title || stepText}</Text>
          <Text style={styles.stepDescription}>
            {currentStepData?.description || "Traitement en cours..."}
          </Text>
        </View>

        {/* Animation Lottie de progression */}
        <View style={styles.progressAnimationContainer}>
          <LottieView
            source={{
              uri: 'https://lottie.host/b5e2175c-3a46-4393-8408-64f10fe4eba1/X6TG4V2dqb.lottie'
            }}
            autoPlay
            loop
            style={styles.progressAnimation}
            resizeMode="contain"
          />
        </View>

        {/* Indicateur de chargement */}
        <View style={styles.loadingIndicator}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    zIndex: 1000,
  },
  animationContainer: {
    width: 200,
    height: 200,
    marginBottom: spacing.xl,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  mainTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  stepContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  stepNumber: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary[600],
    marginBottom: spacing.sm,
  },
  stepTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.gray[800],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stepDescription: {
    fontSize: typography.sizes.md,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
  },
  progressAnimationContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  progressAnimation: {
    width: '100%',
    height: '100%',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[400],
    opacity: 0.6,
  },
});
