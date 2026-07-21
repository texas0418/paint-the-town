/* eslint-disable max-lines -- tracked in #1 */
import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Dimensions,
  TextInput,
  Animated,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  MapPin,
  Calendar,
  BadgeCheck,
  Image as ImageIcon,
  Sparkles,
  TrendingUp,
  Users,
  Globe,
  X,
  Share2,
  Flag,
  UserPlus,
  UserMinus,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { FeedPost, FeedComment } from '@/types';

const { width } = Dimensions.get('window');

const mockFeedPosts: FeedPost[] = [
  {
    id: '1',
    user: {
      id: 'u1',
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      username: 'sarahexplores',
      isFollowing: true,
      isVerified: true,
    },
    type: 'trip',
    destination: 'Santorini',
    country: 'Greece',
    images: [
      'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800',
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800',
    ],
    caption:
      'Golden hour in Santorini hits different ✨ The sunsets here are absolutely unreal. Every evening feels like a painting coming to life.',
    likes: 1247,
    comments: [
      {
        id: 'c1',
        userId: 'u2',
        userName: 'Mike Travel',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        text: 'This is stunning! Adding to my bucket list 😍',
        timestamp: '2024-01-15T10:30:00Z',
        likes: 23,
      },
    ],
    isLiked: false,
    isSaved: false,
    timestamp: '2024-01-15T18:00:00Z',
    tripDates: { start: '2024-01-10', end: '2024-01-17' },
    tags: ['sunset', 'greece', 'island'],
  },
  {
    id: '2',
    user: {
      id: 'u3',
      name: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      username: 'alexwanders',
      isFollowing: false,
    },
    type: 'photo',
    destination: 'Kyoto',
    country: 'Japan',
    images: ['https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800'],
    caption:
      'Found this hidden bamboo path away from the crowds. Sometimes getting lost leads to the best discoveries 🎋',
    likes: 892,
    comments: [],
    isLiked: true,
    isSaved: true,
    timestamp: '2024-01-14T09:00:00Z',
    tags: ['japan', 'nature', 'peaceful'],
  },
  {
    id: '3',
    user: {
      id: 'u4',
      name: 'Emma Johnson',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      username: 'emmaj_travels',
      isFollowing: true,
      isVerified: true,
    },
    type: 'milestone',
    destination: 'Iceland',
    country: 'Iceland',
    images: ['https://images.unsplash.com/photo-1531168556467-80aace0d0144?w=800'],
    caption:
      '🎉 Just hit 25 countries visited! Iceland made it extra special with the Northern Lights dancing above. Dreams do come true!',
    likes: 2341,
    comments: [
      {
        id: 'c2',
        userId: 'u5',
        userName: 'Travel Tim',
        userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        text: 'Congratulations! What an achievement! 🎊',
        timestamp: '2024-01-13T20:00:00Z',
        likes: 45,
      },
      {
        id: 'c3',
        userId: 'u6',
        userName: 'Luna K',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        text: 'The Northern Lights are on my list! Any tips?',
        timestamp: '2024-01-13T21:30:00Z',
        likes: 12,
      },
    ],
    isLiked: false,
    isSaved: false,
    timestamp: '2024-01-13T19:00:00Z',
    tags: ['milestone', 'northernlights', 'bucketlist'],
  },
  {
    id: '4',
    user: {
      id: 'u7',
      name: 'David Kim',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      username: 'davidkim.travel',
      isFollowing: false,
    },
    type: 'tip',
    destination: 'Bali',
    country: 'Indonesia',
    images: ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800'],
    caption:
      '💡 Pro tip: Wake up at 4am to see Uluwatu Temple without crowds. Yes it is early, but watching sunrise from here is absolutely worth it. Trust me!',
    likes: 567,
    comments: [],
    isLiked: false,
    isSaved: true,
    timestamp: '2024-01-12T06:00:00Z',
    tags: ['tips', 'bali', 'sunrise'],
  },
  {
    id: '5',
    user: {
      id: 'u8',
      name: 'Maria Santos',
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150',
      username: 'mariasantos',
      isFollowing: true,
    },
    type: 'trip',
    destination: 'Marrakech',
    country: 'Morocco',
    images: [
      'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800',
      'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800',
      'https://images.unsplash.com/photo-1509735855316-1bce9ef3cc2a?w=800',
    ],
    caption:
      'Getting lost in the medina is part of the magic ✨ The colors, the sounds, the smells - every sense is awakened here.',
    likes: 1089,
    comments: [],
    isLiked: true,
    isSaved: false,
    timestamp: '2024-01-11T14:00:00Z',
    tripDates: { start: '2024-01-05', end: '2024-01-12' },
    tags: ['morocco', 'medina', 'culture'],
  },
];

const trendingTopics = [
  { id: '1', tag: 'SoloTravel', posts: '12.5K' },
  { id: '2', tag: 'HiddenGems', posts: '8.3K' },
  { id: '3', tag: 'FoodieTravel', posts: '15.2K' },
  { id: '4', tag: 'SustainableTravel', posts: '5.7K' },
];

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function TravelFeedScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>(mockFeedPosts);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'following' | 'discover'>('following');
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<Record<string, number>>({});
  const scrollY = useRef(new Animated.Value(0)).current;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handleLike = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          };
        }
        return post;
      })
    );
  }, []);

  const handleSave = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return { ...post, isSaved: !post.isSaved };
        }
        return post;
      })
    );
  }, []);

  const handleFollow = useCallback((userId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.user.id === userId) {
          return {
            ...post,
            user: { ...post.user, isFollowing: !post.user.isFollowing },
          };
        }
        return post;
      })
    );
  }, []);

  const handleAddComment = useCallback(() => {
    if (!newComment.trim() || !selectedPost) return;

    const comment: FeedComment = {
      id: `c${Date.now()}`,
      userId: 'me',
      userName: 'You',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      text: newComment,
      timestamp: new Date().toISOString(),
      likes: 0,
    };

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === selectedPost.id) {
          return { ...post, comments: [...post.comments, comment] };
        }
        return post;
      })
    );

    setNewComment('');
  }, [newComment, selectedPost]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getPostTypeIcon = (type: FeedPost['type']) => {
    switch (type) {
      case 'milestone':
        return <Sparkles size={12} color={colors.warning} />;
      case 'tip':
        return <TrendingUp size={12} color={colors.success} />;
      default:
        return null;
    }
  };

  const nextImage = (postId: string, totalImages: number) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [postId]: ((prev[postId] || 0) + 1) % totalImages,
    }));
  };

  const prevImage = (postId: string, totalImages: number) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [postId]: ((prev[postId] || 0) - 1 + totalImages) % totalImages,
    }));
  };

  const renderPost = (post: FeedPost) => {
    const imageIndex = currentImageIndex[post.id] || 0;

    return (
      <View key={post.id} style={styles.postContainer}>
        <View style={styles.postHeader}>
          <Pressable style={styles.userInfo}>
            <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
            <View style={styles.userDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{post.user.name}</Text>
                {post.user.isVerified && (
                  <BadgeCheck size={14} color={colors.primary} style={styles.verifiedBadge} />
                )}
                {getPostTypeIcon(post.type)}
              </View>
              <View style={styles.locationRow}>
                <MapPin size={12} color={colors.textTertiary} />
                <Text style={styles.location}>
                  {post.destination}, {post.country}
                </Text>
              </View>
            </View>
          </Pressable>
          <View style={styles.headerActions}>
            {!post.user.isFollowing && (
              <Pressable style={styles.followButton} onPress={() => handleFollow(post.user.id)}>
                <Text style={styles.followButtonText}>Follow</Text>
              </Pressable>
            )}
            <Pressable
              style={styles.moreButton}
              onPress={() => {
                setSelectedPost(post);
                setShowOptions(true);
              }}
            >
              <MoreHorizontal size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={{ uri: post.images[imageIndex] }}
            style={styles.postImage}
            contentFit="cover"
          />
          {post.images.length > 1 && (
            <>
              <View style={styles.imageIndicators}>
                {post.images.map((_, idx) => (
                  <View
                    key={idx}
                    style={[styles.indicator, idx === imageIndex && styles.indicatorActive]}
                  />
                ))}
              </View>
              <Pressable
                style={[styles.imageNav, styles.imageNavLeft]}
                onPress={() => prevImage(post.id, post.images.length)}
              />
              <Pressable
                style={[styles.imageNav, styles.imageNavRight]}
                onPress={() => nextImage(post.id, post.images.length)}
              />
            </>
          )}
          {post.tripDates && (
            <View style={styles.tripDateBadge}>
              <Calendar size={12} color={colors.textLight} />
              <Text style={styles.tripDateText}>
                {new Date(post.tripDates.start).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                -{' '}
                {new Date(post.tripDates.end).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.postActions}>
          <View style={styles.leftActions}>
            <Pressable style={styles.actionButton} onPress={() => handleLike(post.id)}>
              <Heart
                size={24}
                color={post.isLiked ? colors.error : colors.text}
                fill={post.isLiked ? colors.error : 'transparent'}
              />
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => {
                setSelectedPost(post);
                setShowComments(true);
              }}
            >
              <MessageCircle size={24} color={colors.text} />
            </Pressable>
            <Pressable style={styles.actionButton}>
              <Send size={22} color={colors.text} />
            </Pressable>
          </View>
          <Pressable style={styles.actionButton} onPress={() => handleSave(post.id)}>
            <Bookmark
              size={24}
              color={post.isSaved ? colors.primary : colors.text}
              fill={post.isSaved ? colors.primary : 'transparent'}
            />
          </Pressable>
        </View>

        <View style={styles.postContent}>
          <Text style={styles.likesCount}>{formatNumber(post.likes)} likes</Text>
          <Text style={styles.caption}>
            <Text style={styles.captionUsername}>{post.user.username}</Text> {post.caption}
          </Text>
          {post.comments.length > 0 && (
            <Pressable
              onPress={() => {
                setSelectedPost(post);
                setShowComments(true);
              }}
            >
              <Text style={styles.viewComments}>View all {post.comments.length} comments</Text>
            </Pressable>
          )}
          <Text style={styles.timestamp}>{formatTimestamp(post.timestamp)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.headerGradient}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.textLight} />
          </Pressable>
          <Text style={styles.headerTitle}>Travel Feed</Text>
          <Pressable style={styles.shareButton}>
            <ImageIcon size={22} color={colors.textLight} />
          </Pressable>
        </View>

        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'following' && styles.tabActive]}
            onPress={() => setActiveTab('following')}
          >
            <Users
              size={16}
              color={activeTab === 'following' ? colors.textLight : 'rgba(255,255,255,0.6)'}
            />
            <Text style={[styles.tabText, activeTab === 'following' && styles.tabTextActive]}>
              Following
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'discover' && styles.tabActive]}
            onPress={() => setActiveTab('discover')}
          >
            <Globe
              size={16}
              color={activeTab === 'discover' ? colors.textLight : 'rgba(255,255,255,0.6)'}
            />
            <Text style={[styles.tabText, activeTab === 'discover' && styles.tabTextActive]}>
              Discover
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: false,
          })}
          scrollEventThrottle={16}
        >
          {activeTab === 'discover' && (
            <View style={styles.trendingSection}>
              <Text style={styles.trendingTitle}>Trending Now</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {trendingTopics.map((topic) => (
                  <Pressable key={topic.id} style={styles.trendingTag}>
                    <Text style={styles.trendingTagText}>#{topic.tag}</Text>
                    <Text style={styles.trendingTagCount}>{topic.posts} posts</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.storySection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.storyScroll}
            >
              <Pressable style={styles.addStoryButton}>
                <View style={styles.addStoryCircle}>
                  <LinearGradient
                    colors={[colors.secondary, colors.secondaryLight]}
                    style={styles.addStoryGradient}
                  >
                    <ImageIcon size={20} color={colors.textLight} />
                  </LinearGradient>
                </View>
                <Text style={styles.storyName}>Share Trip</Text>
              </Pressable>

              {posts.slice(0, 5).map((post) => (
                <Pressable key={`story-${post.id}`} style={styles.storyItem}>
                  <LinearGradient
                    colors={[colors.secondary, colors.warning]}
                    style={styles.storyRing}
                  >
                    <Image source={{ uri: post.user.avatar }} style={styles.storyAvatar} />
                  </LinearGradient>
                  <Text style={styles.storyName} numberOfLines={1}>
                    {post.user.name.split(' ')[0]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.feedContainer}>{posts.map((post) => renderPost(post))}</View>

          <View style={styles.endMessage}>
            <Sparkles size={20} color={colors.textTertiary} />
            <Text style={styles.endMessageText}>You are all caught up!</Text>
            <Text style={styles.endMessageSubtext}>Follow more travelers for inspiration</Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showComments}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowComments(false)}
      >
        <SafeAreaView style={styles.commentsModal}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments</Text>
            <Pressable onPress={() => setShowComments(false)}>
              <X size={24} color={colors.text} />
            </Pressable>
          </View>

          <FlatList
            data={selectedPost?.comments || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.commentItem}>
                <Image source={{ uri: item.userAvatar }} style={styles.commentAvatar} />
                <View style={styles.commentContent}>
                  <Text style={styles.commentUserName}>{item.userName}</Text>
                  <Text style={styles.commentText}>{item.text}</Text>
                  <View style={styles.commentMeta}>
                    <Text style={styles.commentTime}>{formatTimestamp(item.timestamp)}</Text>
                    <Text style={styles.commentLikes}>{item.likes} likes</Text>
                    <Pressable>
                      <Text style={styles.commentReply}>Reply</Text>
                    </Pressable>
                  </View>
                </View>
                <Pressable>
                  <Heart size={16} color={colors.textTertiary} />
                </Pressable>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyComments}>
                <MessageCircle size={40} color={colors.textTertiary} />
                <Text style={styles.emptyCommentsText}>No comments yet</Text>
                <Text style={styles.emptyCommentsSubtext}>Be the first to comment</Text>
              </View>
            }
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.commentInputContainer}
          >
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' }}
              style={styles.commentInputAvatar}
            />
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textTertiary}
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <Pressable
              style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
              onPress={handleAddComment}
              disabled={!newComment.trim()}
            >
              <Send size={20} color={newComment.trim() ? colors.primary : colors.textTertiary} />
            </Pressable>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showOptions}
        animationType="slide"
        transparent
        onRequestClose={() => setShowOptions(false)}
      >
        <Pressable style={styles.optionsOverlay} onPress={() => setShowOptions(false)}>
          <View style={styles.optionsContainer}>
            <View style={styles.optionsHandle} />

            {selectedPost && !selectedPost.user.isFollowing && (
              <Pressable
                style={styles.optionItem}
                onPress={() => {
                  handleFollow(selectedPost.user.id);
                  setShowOptions(false);
                }}
              >
                <UserPlus size={22} color={colors.primary} />
                <Text style={[styles.optionText, { color: colors.primary }]}>
                  Follow @{selectedPost.user.username}
                </Text>
              </Pressable>
            )}

            {selectedPost && selectedPost.user.isFollowing && (
              <Pressable
                style={styles.optionItem}
                onPress={() => {
                  handleFollow(selectedPost.user.id);
                  setShowOptions(false);
                }}
              >
                <UserMinus size={22} color={colors.text} />
                <Text style={styles.optionText}>Unfollow @{selectedPost?.user.username}</Text>
              </Pressable>
            )}

            <Pressable style={styles.optionItem}>
              <Share2 size={22} color={colors.text} />
              <Text style={styles.optionText}>Share to...</Text>
            </Pressable>

            <Pressable style={styles.optionItem}>
              <Bookmark size={22} color={colors.text} />
              <Text style={styles.optionText}>Save post</Text>
            </Pressable>

            <Pressable style={styles.optionItem}>
              <Flag size={22} color={colors.error} />
              <Text style={[styles.optionText, { color: colors.error }]}>Report</Text>
            </Pressable>

            <Pressable style={styles.cancelButton} onPress={() => setShowOptions(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
    height: 180,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textLight,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  tabTextActive: {
    color: colors.textLight,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  trendingSection: {
    paddingVertical: 16,
    paddingLeft: 20,
  },
  trendingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  trendingTag: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  trendingTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  trendingTagCount: {
    fontSize: 11,
    color: colors.primaryLight,
    marginTop: 2,
  },
  storySection: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: 16,
  },
  storyScroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  addStoryButton: {
    alignItems: 'center',
    marginRight: 16,
  },
  addStoryCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 3,
  },
  addStoryGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  storyRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  storyName: {
    fontSize: 12,
    color: colors.text,
    marginTop: 6,
    width: 68,
    textAlign: 'center',
  },
  feedContainer: {
    paddingTop: 8,
  },
  postContainer: {
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  verifiedBadge: {
    marginLeft: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  location: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
  },
  moreButton: {
    padding: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  postImage: {
    width: width,
    height: width,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  indicatorActive: {
    backgroundColor: colors.textLight,
    width: 20,
  },
  imageNav: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: width / 3,
  },
  imageNavLeft: {
    left: 0,
  },
  imageNavRight: {
    right: 0,
  },
  tripDateBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tripDateText: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: '500',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  postContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  likesCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  caption: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  captionUsername: {
    fontWeight: '600',
  },
  viewComments: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 8,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 6,
  },
  endMessage: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingBottom: 100,
  },
  endMessageText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
  },
  endMessageSubtext: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 4,
  },
  commentsModal: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  commentItem: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentContent: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  commentText: {
    fontSize: 14,
    color: colors.text,
    marginTop: 2,
    lineHeight: 20,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 16,
  },
  commentTime: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  commentLikes: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  commentReply: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 4,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 12,
  },
  commentInputAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  optionsOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  optionsContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  optionsHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 16,
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
  },
  cancelButton: {
    marginTop: 8,
    marginHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
