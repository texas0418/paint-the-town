import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Heart,
  Sparkles,
  Clock,
  DollarSign,
  Gift,
  MapPin,
  Calendar,
  ChevronRight,
  Check,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { datePlanIdeas } from '@/mocks/appData';
import { DatePlanIdea } from '@/types';

const categoryColors: Record<string, string> = {
  romantic: colors.secondary,
  adventure: colors.warning,
  cultural: colors.primaryLight,
  foodie: colors.success,
  relaxation: colors.accentDark,
};

export default function DatePlanScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<DatePlanIdea | null>(null);
  const [isSurprise, setIsSurprise] = useState(false);

  const categories = ['romantic', 'adventure', 'cultural', 'foodie', 'relaxation'];

  const filteredIdeas = selectedCategory
    ? datePlanIdeas.filter((idea) => idea.category === selectedCategory)
    : datePlanIdeas;

  const handleSelectIdea = (idea: DatePlanIdea) => {
    setSelectedIdea(idea);
  };

  const handlePlanDate = () => {
    if (selectedIdea) {
      router.push({
        pathname: '/plan-trip',
        params: { dateMode: 'true', ideaId: selectedIdea.id },
      });
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.secondary, colors.secondaryLight]}
        style={styles.headerGradient}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.textLight} />
          </Pressable>
          <View style={styles.headerContent}>
            <Heart size={28} color={colors.textLight} fill={colors.textLight} />
            <Text style={styles.headerTitle}>Date Planning</Text>
            <Text style={styles.headerSubtitle}>Create unforgettable moments together</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.surpriseSection}>
            <View style={styles.surpriseContent}>
              <Gift size={24} color={colors.secondary} />
              <View style={styles.surpriseText}>
                <Text style={styles.surpriseTitle}>Surprise Mode</Text>
                <Text style={styles.surpriseDescription}>
                  Keep the details hidden from your partner
                </Text>
              </View>
            </View>
            <Switch
              value={isSurprise}
              onValueChange={setIsSurprise}
              trackColor={{ false: colors.border, true: colors.secondary }}
              thumbColor={colors.textLight}
            />
          </View>

          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>What&apos;s the vibe?</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContent}
            >
              <Pressable
                style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>
                  All
                </Text>
              </Pressable>
              {categories.map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat && styles.categoryChipActive,
                    selectedCategory === cat && { backgroundColor: categoryColors[cat] },
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === cat && styles.categoryTextActive,
                    ]}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.ideasSection}>
            <Text style={styles.sectionTitle}>Date Ideas</Text>
            {filteredIdeas.map((idea) => (
              <Pressable
                key={idea.id}
                style={[styles.ideaCard, selectedIdea?.id === idea.id && styles.ideaCardSelected]}
                onPress={() => handleSelectIdea(idea)}
              >
                <Image source={{ uri: idea.image }} style={styles.ideaImage} contentFit="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.ideaGradient}
                />
                <View style={styles.ideaContent}>
                  <View
                    style={[
                      styles.ideaCategoryBadge,
                      { backgroundColor: categoryColors[idea.category] },
                    ]}
                  >
                    <Text style={styles.ideaCategoryText}>{idea.category}</Text>
                  </View>
                  <Text style={styles.ideaName}>{idea.name}</Text>
                  <Text style={styles.ideaDescription} numberOfLines={2}>
                    {idea.description}
                  </Text>
                  <View style={styles.ideaMeta}>
                    <View style={styles.metaItem}>
                      <Clock size={14} color={colors.textLight} />
                      <Text style={styles.metaText}>{idea.duration}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <DollarSign size={14} color={colors.textLight} />
                      <Text style={styles.metaText}>{idea.priceRange}</Text>
                    </View>
                  </View>
                </View>
                {selectedIdea?.id === idea.id && (
                  <View style={styles.selectedBadge}>
                    <Check size={16} color={colors.textLight} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          {selectedIdea && (
            <View style={styles.selectedDetails}>
              <Text style={styles.sectionTitle}>Included Activities</Text>
              <View style={styles.activitiesList}>
                {selectedIdea.activities.map((activity, index) => (
                  <View key={index} style={styles.activityItem}>
                    <View style={styles.activityNumber}>
                      <Text style={styles.activityNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.activityText}>{activity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.spacer} />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.planButton, !selectedIdea && styles.planButtonDisabled]}
            onPress={handlePlanDate}
            disabled={!selectedIdea}
          >
            <Sparkles size={20} color={colors.textLight} />
            <Text style={styles.planButtonText}>Plan This Date</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textLight,
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.textLight,
    opacity: 0.9,
    marginTop: 4,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
  },
  surpriseSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  surpriseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  surpriseText: {
    flex: 1,
  },
  surpriseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  surpriseDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  categoriesSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: colors.secondary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: colors.textLight,
  },
  ideasSection: {
    marginTop: 24,
  },
  ideaCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  ideaCardSelected: {
    borderWidth: 3,
    borderColor: colors.secondary,
  },
  ideaImage: {
    width: '100%',
    height: '100%',
  },
  ideaGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  ideaContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  ideaCategoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  ideaCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textLight,
    textTransform: 'uppercase',
  },
  ideaName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textLight,
  },
  ideaDescription: {
    fontSize: 14,
    color: colors.textLight,
    opacity: 0.9,
    marginTop: 4,
  },
  ideaMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: '500',
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDetails: {
    marginTop: 8,
    paddingBottom: 20,
  },
  activitiesList: {
    marginHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  activityNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  activityText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  spacer: {
    height: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 16,
  },
  planButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  planButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textLight,
  },
});
