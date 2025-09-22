import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

interface LoadingAnimationProps {
  visible: boolean;
  size?: number;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ 
  visible, 
  size = 200 
}) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <LottieView
        source={{
          uri: 'https://lottie.host/d4b15ef2-fdd4-4ed8-9a4d-7496e7517bf4/EFWNIcDnOe.lottie'
        }}
        autoPlay
        loop
        style={[styles.animation, { width: size, height: size }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  animation: {
    // Styles pour l'animation Lottie
  },
});
