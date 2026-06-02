import React, { useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Animal } from '@/types/animal';
import { SoundButton } from './SoundButton';
import { colors } from '@/constants/theme';
import { fetchMoreFacts } from '@/lib/api';

interface Props {
  animal: Animal;
}

export function AnimalCard({ animal }: Props) {
  const [facts, setFacts] = useState(animal.facts);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imgError, setImgError] = useState(false);

  async function handleMoreFacts() {
    setLoadingMore(true);
    try {
      const more = await fetchMoreFacts(animal, facts);
      setFacts(prev => [...prev, ...more]);
    } catch {}
    setLoadingMore(false);
  }

  return (
    <View style={styles.card}>
      {/* Photo */}
      <View style={styles.photoWrap}>
        {animal.imageUrl && !imgError ? (
          <>
            <Image
              source={{ uri: animal.imageUrl }}
              style={styles.photo}
              resizeMode="contain"
              onError={() => setImgError(true)}
            />
            <Text style={styles.photoCredit}>Photo: Wikipedia</Text>
          </>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoEmoji}>{animal.emoji || '🐾'}</Text>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.name}>{animal.name}</Text>
        <Text style={styles.sci}>{animal.scientificName}</Text>

        <View style={styles.tags}>
          <View style={styles.tag}><Text style={styles.tagText}>{animal.type}</Text></View>
          <View style={styles.tag}><Text style={styles.tagText}>{animal.habitat}</Text></View>
        </View>

        {animal.hasMakeableSound && (
          <SoundButton animal={animal} />
        )}

        {facts.map((fact, i) => (
          <View key={i} style={styles.factRow}>
            <Text style={styles.factStar}>★</Text>
            <Text style={styles.factText}>{fact}</Text>
          </View>
        ))}

        <Pressable
          style={[styles.moreFacts, loadingMore && styles.moreFactsLoading]}
          onPress={handleMoreFacts}
          disabled={loadingMore}
        >
          {loadingMore
            ? <ActivityIndicator size="small" color={colors.leafLight} />
            : <Text style={styles.moreFactsText}>✨ More fun facts</Text>
          }
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.jungleDark,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.jungleLight,
    marginBottom: 20,
  },
  photoWrap: { width: '100%', height: 260, backgroundColor: colors.jungleDarkest },
  photo: { width: '100%', height: '100%' },
  photoCredit: {
    position: 'absolute', bottom: 4, right: 6,
    fontSize: 10, color: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
  },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoEmoji: { fontSize: 64 },
  body: { padding: 16 },
  name: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: colors.cream },
  sci: { fontSize: 11, color: colors.jungleBright, fontStyle: 'italic', marginBottom: 10 },
  tags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 14 },
  tag: {
    backgroundColor: colors.jungleMid, borderRadius: 20,
    paddingHorizontal: 9, paddingVertical: 3,
    borderWidth: 1, borderColor: colors.jungleLight,
  },
  tagText: { fontSize: 11, fontWeight: '600', color: colors.leafLight },
  factRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  factStar: { color: colors.amber, fontSize: 15, marginTop: 2 },
  factText: { flex: 1, fontSize: 13, color: colors.leafPale, lineHeight: 20 },
  moreFacts: {
    marginTop: 14, padding: 10,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.jungleLight,
    borderRadius: 12, alignItems: 'center',
  },
  moreFactsLoading: { opacity: 0.6 },
  moreFactsText: { fontSize: 13, fontWeight: '600', color: colors.leafLight },
});
