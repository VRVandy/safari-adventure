import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { Animal } from '@/types/animal';
import { colors } from '@/constants/theme';

interface Props {
  animal: Animal;
}

export function AnimalPreview({ animal }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animal.imageUrl) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [animal.imageUrl]);

  return (
    <View style={styles.container}>
      <View style={styles.photoWrap}>
        {animal.imageUrl ? (
          <Animated.Image
            source={{ uri: animal.imageUrl }}
            style={[styles.photo, { opacity: fadeAnim }]}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.emoji}>{animal.emoji}</Text>
        )}
      </View>
      <Text style={styles.name}>{animal.name}</Text>
      <Text style={styles.type}>{animal.type} · {animal.habitat}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  photoWrap: {
    width: 280,
    height: 240,
    borderRadius: 16,
    backgroundColor: colors.jungleDark,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  emoji: {
    fontSize: 80,
  },
  name: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: colors.amber,
    textAlign: 'center',
  },
  type: {
    fontSize: 13,
    color: colors.leafLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
