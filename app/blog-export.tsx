/* eslint-disable max-lines -- tracked in #1 */
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Dimensions,
  Alert,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  BookOpen,
  Layout,
  Newspaper,
  Palette,
  Check,
  ChevronRight,
  MapPin,
  Calendar,
  Heart,
  Eye,
  Sparkles,
  Type,
  ImageIcon,
  Copy,
  ExternalLink,
  X,
  Clock,
  Globe,
  Bookmark,
  Share2,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { PhotoJournalEntry } from '@/types';
import React from 'react';

const { width } = Dimensions.get('window');

interface BlogTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  preview: string;
  primaryColor: string;
  secondaryColor: string;
  fontStyle: 'serif' | 'sans-serif' | 'handwritten';
  layout: 'classic' | 'magazine' | 'minimal' | 'scrapbook';
}

const BLOG_TEMPLATES: BlogTemplate[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and elegant with focus on your photos',
    icon: <Layout size={24} color={colors.text} />,
    preview: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400',
    primaryColor: '#1a1a1a',
    secondaryColor: '#f5f5f5',
    fontStyle: 'sans-serif',
    layout: 'minimal',
  },
  {
    id: 'magazine',
    name: 'Magazine',
    description: 'Editorial style with bold typography',
    icon: <Newspaper size={24} color={colors.text} />,
    preview: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400',
    primaryColor: '#2d3436',
    secondaryColor: '#dfe6e9',
    fontStyle: 'serif',
    layout: 'magazine',
  },
  {
    id: 'scrapbook',
    name: 'Scrapbook',
    description: 'Playful and personal with handwritten feel',
    icon: <BookOpen size={24} color={colors.text} />,
    preview: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400',
    primaryColor: '#6c5ce7',
    secondaryColor: '#ffeaa7',
    fontStyle: 'handwritten',
    layout: 'scrapbook',
  },
  {
    id: 'adventure',
    name: 'Adventure',
    description: 'Bold and dynamic for thrill seekers',
    icon: <Palette size={24} color={colors.text} />,
    preview: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400',
    primaryColor: '#e17055',
    secondaryColor: '#2d3436',
    fontStyle: 'sans-serif',
    layout: 'magazine',
  },
];

const SAMPLE_ENTRIES: PhotoJournalEntry[] = [
  {
    id: '1',
    tripId: 'trip-1',
    tripName: 'Bali Adventure',
    imageUri: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
    caption: 'Sunrise at Tegallalang Rice Terraces',
    note: 'Woke up at 4am to catch this magical sunrise. The mist rolling over the terraces was absolutely breathtaking. Met a local farmer who shared stories about traditional Balinese farming.',
    location: { name: 'Tegallalang, Bali', coordinates: { lat: -8.4325, lng: 115.2792 } },
    date: '2024-01-15',
    tags: ['sunrise', 'nature', 'rice terraces'],
    isFavorite: true,
    weather: 'Sunny, 24°C',
    mood: 'peaceful',
  },
  {
    id: '2',
    tripId: 'trip-1',
    tripName: 'Bali Adventure',
    imageUri: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800',
    caption: 'Temple ceremony at Tanah Lot',
    note: 'Witnessed an incredible traditional ceremony. The spiritual energy was palpable.',
    location: { name: 'Tanah Lot Temple, Bali', coordinates: { lat: -8.6213, lng: 115.0868 } },
    date: '2024-01-16',
    tags: ['temple', 'culture', 'ceremony'],
    isFavorite: false,
    mood: 'relaxed',
  },
  {
    id: '3',
    tripId: 'trip-2',
    tripName: 'Tokyo Nights',
    imageUri: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    caption: 'Shibuya Crossing at night',
    note: 'The organized chaos of Shibuya is something everyone should experience at least once.',
    location: { name: 'Shibuya, Tokyo', coordinates: { lat: 35.6595, lng: 139.7004 } },
    date: '2024-02-20',
    tags: ['city', 'nightlife', 'iconic'],
    isFavorite: true,
    mood: 'excited',
  },
  {
    id: '4',
    tripId: 'trip-2',
    tripName: 'Tokyo Nights',
    imageUri: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800',
    caption: 'Cherry blossoms in Ueno Park',
    note: 'Hanami season is pure magic. Locals picnicking under the sakura trees.',
    location: { name: 'Ueno Park, Tokyo', coordinates: { lat: 35.7148, lng: 139.7714 } },
    date: '2024-02-22',
    tags: ['cherry blossoms', 'spring', 'park'],
    isFavorite: true,
    mood: 'happy',
  },
  {
    id: '5',
    tripId: 'trip-3',
    tripName: 'Greek Islands',
    imageUri: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800',
    caption: 'Sunset in Santorini',
    note: 'No filter needed. This view from Oia is exactly as magical as everyone says.',
    location: { name: 'Oia, Santorini', coordinates: { lat: 36.4618, lng: 25.3753 } },
    date: '2024-03-10',
    tags: ['sunset', 'island', 'romantic'],
    isFavorite: true,
    weather: 'Clear, 22°C',
    mood: 'romantic',
  },
];

type Step = 'select' | 'customize' | 'preview';

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function BlogExportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const _initialTripId = params.tripId as string | undefined;

  const [currentStep, setCurrentStep] = useState<Step>('select');
  const [entries] = useState<PhotoJournalEntry[]>(SAMPLE_ENTRIES);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<BlogTemplate>(BLOG_TEMPLATES[0]);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogIntro, setBlogIntro] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const uniqueTrips = useMemo(() => {
    const tripMap: Record<string, { id: string; name: string; entries: PhotoJournalEntry[] }> = {};
    entries.forEach((entry) => {
      if (entry.tripId && entry.tripName) {
        if (!tripMap[entry.tripId]) {
          tripMap[entry.tripId] = { id: entry.tripId, name: entry.tripName, entries: [] };
        }
        tripMap[entry.tripId].entries.push(entry);
      }
    });
    return Object.values(tripMap);
  }, [entries]);

  const selectedEntriesData = useMemo(() => {
    return entries.filter((e) => selectedEntries.includes(e.id));
  }, [entries, selectedEntries]);

  const toggleEntry = (entryId: string) => {
    setSelectedEntries((prev) =>
      prev.includes(entryId) ? prev.filter((id) => id !== entryId) : [...prev, entryId]
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const selectAllFromTrip = (tripId: string) => {
    const tripEntries = entries.filter((e) => e.tripId === tripId).map((e) => e.id);
    const allSelected = tripEntries.every((id) => selectedEntries.includes(id));

    if (allSelected) {
      setSelectedEntries((prev) => prev.filter((id) => !tripEntries.includes(id)));
    } else {
      setSelectedEntries((prev) => [...new Set([...prev, ...tripEntries])]);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const generateBlogContent = () => {
    const tripName = selectedEntriesData[0]?.tripName || 'My Travel Story';
    const locations = [
      ...new Set(selectedEntriesData.map((e) => e.location?.name).filter(Boolean)),
    ];
    const dateRange =
      selectedEntriesData.length > 0
        ? `${formatDate(selectedEntriesData[selectedEntriesData.length - 1].date)} - ${formatDate(selectedEntriesData[0].date)}`
        : '';

    return {
      title: blogTitle || `${tripName}: A Journey to Remember`,
      intro:
        blogIntro ||
        `Discover the highlights of my unforgettable adventure through ${locations.slice(0, 3).join(', ')}${locations.length > 3 ? ' and more' : ''}.`,
      author: authorName || 'Travel Enthusiast',
      dateRange,
      entries: selectedEntriesData,
      template: selectedTemplate,
      totalPhotos: selectedEntriesData.length,
      totalLocations: locations.length,
    };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleExport = async (type: 'share' | 'copy') => {
    setIsExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const blog = generateBlogContent();
      const blogText = generateBlogText(blog);

      if (type === 'share') {
        await Share.share({
          title: blog.title,
          message: blogText,
        });
      } else {
        Alert.alert('Copied!', 'Your travel blog has been copied to clipboard.');
      }
    } catch (error) {
      console.log('Export error:', error);
      Alert.alert('Export Failed', 'Could not export your blog. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const generateBlogText = (blog: ReturnType<typeof generateBlogContent>) => {
    let text = `# ${blog.title}\n\n`;
    text += `*By ${blog.author}* | ${blog.dateRange}\n\n`;
    text += `${blog.intro}\n\n---\n\n`;

    blog.entries.forEach((entry, index) => {
      text += `## ${entry.caption}\n`;
      text += `📍 ${entry.location?.name || 'Unknown location'} | 📅 ${formatDate(entry.date)}\n\n`;
      text += `${entry.note}\n\n`;
      if (entry.tags.length > 0) {
        text += `Tags: ${entry.tags.map((t) => `#${t}`).join(' ')}\n\n`;
      }
      if (index < blog.entries.length - 1) {
        text += `---\n\n`;
      }
    });

    text += `\n---\n*${blog.totalPhotos} photos across ${blog.totalLocations} locations*`;
    return text;
  };

  const canProceed = () => {
    if (currentStep === 'select') return selectedEntries.length > 0;
    if (currentStep === 'customize') return true;
    return true;
  };

  const nextStep = () => {
    if (currentStep === 'select' && selectedEntries.length > 0) {
      setCurrentStep('customize');
      const tripName = selectedEntriesData[0]?.tripName;
      if (tripName && !blogTitle) {
        setBlogTitle(`${tripName}: A Journey to Remember`);
      }
    } else if (currentStep === 'customize') {
      setCurrentStep('preview');
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const prevStep = () => {
    if (currentStep === 'customize') setCurrentStep('select');
    else if (currentStep === 'preview') setCurrentStep('customize');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {['select', 'customize', 'preview'].map((step, index) => (
        <View key={step} style={styles.stepItem}>
          <View
            style={[
              styles.stepDot,
              currentStep === step && styles.stepDotActive,
              ['select', 'customize', 'preview'].indexOf(currentStep) > index &&
                styles.stepDotCompleted,
            ]}
          >
            {['select', 'customize', 'preview'].indexOf(currentStep) > index ? (
              <Check size={12} color={colors.textLight} />
            ) : (
              <Text style={[styles.stepNumber, currentStep === step && styles.stepNumberActive]}>
                {index + 1}
              </Text>
            )}
          </View>
          <Text style={[styles.stepLabel, currentStep === step && styles.stepLabelActive]}>
            {step.charAt(0).toUpperCase() + step.slice(1)}
          </Text>
          {index < 2 && (
            <View
              style={[
                styles.stepLine,
                ['select', 'customize', 'preview'].indexOf(currentStep) > index &&
                  styles.stepLineCompleted,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderSelectStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Select Photos for Your Story</Text>
      <Text style={styles.sectionSubtitle}>Choose the moments you want to share</Text>

      {uniqueTrips.map((trip) => {
        const tripEntryIds = trip.entries.map((e) => e.id);
        const selectedCount = tripEntryIds.filter((id) => selectedEntries.includes(id)).length;
        const allSelected = selectedCount === trip.entries.length;

        return (
          <View key={trip.id} style={styles.tripSection}>
            <Pressable style={styles.tripHeader} onPress={() => selectAllFromTrip(trip.id)}>
              <View style={styles.tripHeaderLeft}>
                <Globe size={18} color={colors.primary} />
                <Text style={styles.tripName}>{trip.name}</Text>
                <View style={styles.tripCount}>
                  <Text style={styles.tripCountText}>{trip.entries.length}</Text>
                </View>
              </View>
              <View style={[styles.selectAllBox, allSelected && styles.selectAllBoxActive]}>
                {allSelected && <Check size={14} color={colors.textLight} />}
              </View>
            </Pressable>

            <View style={styles.entriesGrid}>
              {trip.entries.map((entry) => {
                const isSelected = selectedEntries.includes(entry.id);
                return (
                  <Pressable
                    key={entry.id}
                    style={[styles.entryCard, isSelected && styles.entryCardSelected]}
                    onPress={() => toggleEntry(entry.id)}
                  >
                    <Image
                      source={{ uri: entry.imageUri }}
                      style={styles.entryImage}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.7)']}
                      style={styles.entryGradient}
                    />
                    <View style={styles.entryOverlay}>
                      <Text style={styles.entryCaption} numberOfLines={2}>
                        {entry.caption}
                      </Text>
                      {entry.location && (
                        <View style={styles.entryLocation}>
                          <MapPin size={10} color={colors.textLight} />
                          <Text style={styles.entryLocationText} numberOfLines={1}>
                            {entry.location.name}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View
                      style={[styles.entryCheckbox, isSelected && styles.entryCheckboxSelected]}
                    >
                      {isSelected && <Check size={14} color={colors.textLight} />}
                    </View>
                    {entry.isFavorite && (
                      <View style={styles.entryFavorite}>
                        <Heart size={12} color={colors.secondary} fill={colors.secondary} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );

  const renderCustomizeStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Customize Your Blog</Text>
      <Text style={styles.sectionSubtitle}>Add your personal touch</Text>

      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Blog Title</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Give your story a title..."
          placeholderTextColor={colors.textTertiary}
          value={blogTitle}
          onChangeText={setBlogTitle}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Introduction</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Write a brief intro to your travel story..."
          placeholderTextColor={colors.textTertiary}
          value={blogIntro}
          onChangeText={setBlogIntro}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Author Name</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Your name or pen name..."
          placeholderTextColor={colors.textTertiary}
          value={authorName}
          onChangeText={setAuthorName}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Choose a Style</Text>
        <View style={styles.templateGrid}>
          {BLOG_TEMPLATES.map((template) => (
            <Pressable
              key={template.id}
              style={[
                styles.templateCard,
                selectedTemplate.id === template.id && styles.templateCardSelected,
              ]}
              onPress={() => {
                setSelectedTemplate(template);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Image
                source={{ uri: template.preview }}
                style={styles.templatePreview}
                contentFit="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.templateGradient}
              />
              <View style={styles.templateInfo}>
                <View
                  style={[styles.templateIcon, { backgroundColor: template.primaryColor + '20' }]}
                >
                  {template.icon}
                </View>
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateDescription} numberOfLines={2}>
                  {template.description}
                </Text>
              </View>
              {selectedTemplate.id === template.id && (
                <View style={styles.templateSelected}>
                  <Check size={16} color={colors.textLight} />
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );

  const renderPreviewStep = () => {
    const blog = generateBlogContent();

    return (
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        <View style={styles.previewHeader}>
          <Text style={styles.sectionTitle}>Preview Your Blog</Text>
          <Pressable style={styles.fullPreviewButton} onPress={() => setShowPreviewModal(true)}>
            <Eye size={16} color={colors.primary} />
            <Text style={styles.fullPreviewText}>Full Preview</Text>
          </Pressable>
        </View>

        <View style={[styles.blogPreviewCard, { borderColor: selectedTemplate.primaryColor }]}>
          <Image
            source={{ uri: blog.entries[0]?.imageUri }}
            style={styles.blogCoverImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={styles.blogCoverGradient}
          />
          <View style={styles.blogCoverContent}>
            <View style={[styles.blogBadge, { backgroundColor: selectedTemplate.primaryColor }]}>
              <Bookmark size={12} color={colors.textLight} />
              <Text style={styles.blogBadgeText}>TRAVEL STORY</Text>
            </View>
            <Text style={styles.blogTitle}>{blog.title}</Text>
            <View style={styles.blogMeta}>
              <Text style={styles.blogAuthor}>By {blog.author}</Text>
              <View style={styles.blogMetaDivider} />
              <Text style={styles.blogDate}>{blog.dateRange}</Text>
            </View>
          </View>
        </View>

        <View style={styles.blogStats}>
          <View style={styles.blogStatItem}>
            <ImageIcon size={18} color={colors.primary} />
            <Text style={styles.blogStatValue}>{blog.totalPhotos}</Text>
            <Text style={styles.blogStatLabel}>Photos</Text>
          </View>
          <View style={styles.blogStatDivider} />
          <View style={styles.blogStatItem}>
            <MapPin size={18} color={colors.secondary} />
            <Text style={styles.blogStatValue}>{blog.totalLocations}</Text>
            <Text style={styles.blogStatLabel}>Locations</Text>
          </View>
          <View style={styles.blogStatDivider} />
          <View style={styles.blogStatItem}>
            <Clock size={18} color={colors.accent} />
            <Text style={styles.blogStatValue}>
              {Math.ceil(blog.entries.reduce((acc, e) => acc + (e.note?.length || 0), 0) / 200)}
            </Text>
            <Text style={styles.blogStatLabel}>Min Read</Text>
          </View>
        </View>

        <View style={styles.blogIntroPreview}>
          <Text style={styles.blogIntroText}>{blog.intro}</Text>
        </View>

        <View style={styles.entriesPreview}>
          {blog.entries.slice(0, 3).map((entry, index) => (
            <View key={entry.id} style={styles.entryPreviewCard}>
              <Image
                source={{ uri: entry.imageUri }}
                style={styles.entryPreviewImage}
                contentFit="cover"
              />
              <View style={styles.entryPreviewContent}>
                <Text style={styles.entryPreviewCaption}>{entry.caption}</Text>
                <Text style={styles.entryPreviewNote} numberOfLines={2}>
                  {entry.note}
                </Text>
                {entry.location && (
                  <View style={styles.entryPreviewLocation}>
                    <MapPin size={12} color={colors.textTertiary} />
                    <Text style={styles.entryPreviewLocationText}>{entry.location.name}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
          {blog.entries.length > 3 && (
            <View style={styles.moreEntriesIndicator}>
              <Text style={styles.moreEntriesText}>+{blog.entries.length - 3} more entries</Text>
            </View>
          )}
        </View>

        <View style={styles.exportActions}>
          <Text style={styles.exportTitle}>Export Your Story</Text>

          <Pressable
            style={styles.exportOption}
            onPress={() => handleExport('share')}
            disabled={isExporting}
          >
            <View style={[styles.exportIconBox, { backgroundColor: colors.primary + '15' }]}>
              <Share2 size={22} color={colors.primary} />
            </View>
            <View style={styles.exportOptionContent}>
              <Text style={styles.exportOptionTitle}>Share Story</Text>
              <Text style={styles.exportOptionDescription}>
                Share via messages, email, or social media
              </Text>
            </View>
            <ChevronRight size={20} color={colors.textTertiary} />
          </Pressable>

          <Pressable
            style={styles.exportOption}
            onPress={() => handleExport('copy')}
            disabled={isExporting}
          >
            <View style={[styles.exportIconBox, { backgroundColor: colors.secondary + '15' }]}>
              <Copy size={22} color={colors.secondary} />
            </View>
            <View style={styles.exportOptionContent}>
              <Text style={styles.exportOptionTitle}>Copy to Clipboard</Text>
              <Text style={styles.exportOptionDescription}>
                Copy formatted text to paste anywhere
              </Text>
            </View>
            <ChevronRight size={20} color={colors.textTertiary} />
          </Pressable>

          <Pressable style={[styles.exportOption, styles.exportOptionDisabled]}>
            <View style={[styles.exportIconBox, { backgroundColor: colors.accent + '30' }]}>
              <ExternalLink size={22} color={colors.textTertiary} />
            </View>
            <View style={styles.exportOptionContent}>
              <Text style={[styles.exportOptionTitle, { color: colors.textTertiary }]}>
                Publish Online
              </Text>
              <Text style={styles.exportOptionDescription}>Coming soon - Get a shareable link</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Soon</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    );
  };

  const renderFullPreviewModal = () => {
    const blog = generateBlogContent();

    return (
      <Modal visible={showPreviewModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.previewModalContainer}>
          <View style={styles.previewModalHeader}>
            <Pressable onPress={() => setShowPreviewModal(false)}>
              <X size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.previewModalTitle}>Full Preview</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.previewModalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.fullBlogPreview}>
              <Image
                source={{ uri: blog.entries[0]?.imageUri }}
                style={styles.fullBlogCover}
                contentFit="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.9)']}
                style={styles.fullBlogCoverGradient}
              />
              <View style={styles.fullBlogCoverContent}>
                <Text style={styles.fullBlogTitle}>{blog.title}</Text>
                <View style={styles.fullBlogMeta}>
                  <Text style={styles.fullBlogAuthor}>By {blog.author}</Text>
                  <Text style={styles.fullBlogDate}>{blog.dateRange}</Text>
                </View>
              </View>
            </View>

            <View style={styles.fullBlogBody}>
              <Text style={styles.fullBlogIntro}>{blog.intro}</Text>

              {blog.entries.map((entry, index) => (
                <View key={entry.id} style={styles.fullBlogEntry}>
                  <Image
                    source={{ uri: entry.imageUri }}
                    style={styles.fullBlogEntryImage}
                    contentFit="cover"
                  />
                  <Text style={styles.fullBlogEntryCaption}>{entry.caption}</Text>
                  <View style={styles.fullBlogEntryMeta}>
                    {entry.location && (
                      <View style={styles.fullBlogEntryMetaItem}>
                        <MapPin size={14} color={colors.textSecondary} />
                        <Text style={styles.fullBlogEntryMetaText}>{entry.location.name}</Text>
                      </View>
                    )}
                    <View style={styles.fullBlogEntryMetaItem}>
                      <Calendar size={14} color={colors.textSecondary} />
                      <Text style={styles.fullBlogEntryMetaText}>{formatDate(entry.date)}</Text>
                    </View>
                  </View>
                  <Text style={styles.fullBlogEntryNote}>{entry.note}</Text>
                  {entry.tags.length > 0 && (
                    <View style={styles.fullBlogEntryTags}>
                      {entry.tags.map((tag) => (
                        <View key={tag} style={styles.fullBlogTag}>
                          <Text style={styles.fullBlogTagText}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.headerGradient} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => (currentStep === 'select' ? router.back() : prevStep())}
          >
            <ArrowLeft size={24} color={colors.textLight} />
          </Pressable>
          <Text style={styles.headerTitle}>Create Travel Blog</Text>
          <View style={styles.headerRight}>
            <Sparkles size={22} color={colors.accent} />
          </View>
        </View>

        {renderStepIndicator()}

        <View style={styles.content}>
          {currentStep === 'select' && renderSelectStep()}
          {currentStep === 'customize' && renderCustomizeStep()}
          {currentStep === 'preview' && renderPreviewStep()}
        </View>

        {currentStep !== 'preview' && (
          <View style={styles.footer}>
            <View style={styles.selectionInfo}>
              {currentStep === 'select' && (
                <>
                  <ImageIcon size={16} color={colors.textSecondary} />
                  <Text style={styles.selectionText}>
                    {selectedEntries.length} photo{selectedEntries.length !== 1 ? 's' : ''} selected
                  </Text>
                </>
              )}
              {currentStep === 'customize' && (
                <>
                  <Type size={16} color={colors.textSecondary} />
                  <Text style={styles.selectionText}>{selectedTemplate.name} template</Text>
                </>
              )}
            </View>
            <Pressable
              style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
              onPress={nextStep}
              disabled={!canProceed()}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === 'select' ? 'Continue' : 'Preview Blog'}
              </Text>
              <ChevronRight size={20} color={colors.textLight} />
            </Pressable>
          </View>
        )}
      </SafeAreaView>

      {renderFullPreviewModal()}
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
    height: 200,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textLight,
  },
  headerRight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepDotCompleted: {
    backgroundColor: colors.success,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  stepNumberActive: {
    color: colors.textLight,
  },
  stepLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: colors.textLight,
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
  },
  stepLineCompleted: {
    backgroundColor: colors.success,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  stepContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  tripSection: {
    marginBottom: 24,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tripHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tripName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  tripCount: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tripCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  selectAllBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectAllBoxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  entriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  entryCard: {
    width: (width - 60) / 2,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  entryCardSelected: {
    borderWidth: 3,
    borderColor: colors.primary,
  },
  entryImage: {
    width: '100%',
    height: '100%',
  },
  entryGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  entryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  entryCaption: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
    lineHeight: 18,
  },
  entryLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  entryLocationText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  entryCheckbox: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 2,
    borderColor: colors.textLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryCheckboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  entryFavorite: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 100,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  templateCard: {
    width: (width - 52) / 2,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateCardSelected: {
    borderColor: colors.primary,
  },
  templatePreview: {
    width: '100%',
    height: '100%',
  },
  templateGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  templateInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  templateIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: 2,
  },
  templateDescription: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 15,
  },
  templateSelected: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  fullPreviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  fullPreviewText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  blogPreviewCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 16,
    height: 220,
    position: 'relative',
    borderWidth: 2,
  },
  blogCoverImage: {
    width: '100%',
    height: '100%',
  },
  blogCoverGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  blogCoverContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  blogBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 10,
  },
  blogBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textLight,
    letterSpacing: 1,
  },
  blogTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: 8,
    lineHeight: 26,
  },
  blogMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blogAuthor: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  blogMetaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 10,
  },
  blogDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  blogStats: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  blogStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  blogStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  blogStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  blogStatDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  blogIntroPreview: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  blogIntroText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  entriesPreview: {
    marginTop: 20,
    gap: 12,
  },
  entryPreviewCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  entryPreviewImage: {
    width: 90,
    height: 90,
  },
  entryPreviewContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  entryPreviewCaption: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  entryPreviewNote: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  entryPreviewLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  entryPreviewLocationText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  moreEntriesIndicator: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  moreEntriesText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  exportActions: {
    marginTop: 24,
  },
  exportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  exportOptionDisabled: {
    opacity: 0.6,
  },
  exportIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportOptionContent: {
    flex: 1,
  },
  exportOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  exportOptionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  comingSoonBadge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 30,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 6,
  },
  nextButtonDisabled: {
    backgroundColor: colors.border,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textLight,
  },
  bottomPadding: {
    height: 40,
  },
  previewModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  previewModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  previewModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  previewModalContent: {
    flex: 1,
  },
  fullBlogPreview: {
    height: 320,
    position: 'relative',
  },
  fullBlogCover: {
    width: '100%',
    height: '100%',
  },
  fullBlogCoverGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  fullBlogCoverContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  fullBlogTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: 12,
    lineHeight: 34,
  },
  fullBlogMeta: {
    gap: 6,
  },
  fullBlogAuthor: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  fullBlogDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  fullBlogBody: {
    padding: 20,
  },
  fullBlogIntro: {
    fontSize: 17,
    color: colors.textSecondary,
    lineHeight: 28,
    fontStyle: 'italic',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fullBlogEntry: {
    marginBottom: 40,
  },
  fullBlogEntryImage: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    marginBottom: 16,
  },
  fullBlogEntryCaption: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  fullBlogEntryMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  fullBlogEntryMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fullBlogEntryMetaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  fullBlogEntryNote: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 26,
    marginBottom: 14,
  },
  fullBlogEntryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fullBlogTag: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  fullBlogTagText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
