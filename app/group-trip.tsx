import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Users,
  Mail,
  Crown,
  Check,
  X,
  Vote,
  MessageSquare,
  DollarSign,
  UserPlus,
  Sparkles,
  Share2,
  Link,
  Copy,
  Eye,
  Edit3,
  Clock,
  CheckCircle2,
  Circle,
  MessageCircle,
  ListTodo,
  Activity,
  Send,
  MoreHorizontal,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Plus,
  MapPin,
  Calendar,
  BarChart3,
  Receipt,
  CreditCard,
  Utensils,
  Car,
  Home,
  ShoppingBag,
  Plane,
  ArrowRightLeft,
  CheckCheck,
} from 'lucide-react-native';
import colors from '@/constants/colors';

interface CollabMember {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: 'organizer' | 'editor' | 'viewer';
  hasAccepted: boolean;
  lastActive?: string;
  isOnline?: boolean;
}

interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string;
  target: string;
  timestamp: string;
}

interface TripTask {
  id: string;
  title: string;
  assignedTo: string;
  assignedName: string;
  dueDate: string;
  completed: boolean;
  category: 'booking' | 'planning' | 'packing' | 'research';
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: string;
  itemId?: string;
}

interface VoteItem {
  id: string;
  title: string;
  description: string;
  category: 'itinerary' | 'activity' | 'restaurant' | 'accommodation';
  image?: string;
  date?: string;
  location?: string;
  votes: { memberId: string; memberName: string; vote: 'yes' | 'no' | 'maybe' }[];
  deadline: string;
  status: 'active' | 'completed';
  createdBy: string;
}

interface GroupExpense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category:
    | 'food'
    | 'transport'
    | 'accommodation'
    | 'activities'
    | 'shopping'
    | 'flights'
    | 'other';
  paidById: string;
  paidByName: string;
  splitWith: string[];
  date: string;
  receipt?: string;
}

interface Settlement {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
  settled: boolean;
}

const mockMembers: CollabMember[] = [
  {
    id: '1',
    name: 'You',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    email: 'you@email.com',
    role: 'organizer',
    hasAccepted: true,
    isOnline: true,
  },
  {
    id: '2',
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    email: 'sarah@email.com',
    role: 'editor',
    hasAccepted: true,
    lastActive: '2 min ago',
    isOnline: true,
  },
  {
    id: '3',
    name: 'Mike Johnson',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    email: 'mike@email.com',
    role: 'viewer',
    hasAccepted: true,
    lastActive: '1 hour ago',
    isOnline: false,
  },
  {
    id: '4',
    name: 'Emma Wilson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    email: 'emma@email.com',
    role: 'editor',
    hasAccepted: false,
  },
];

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    userId: '2',
    userName: 'Sarah',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    action: 'added',
    target: 'Eiffel Tower visit to Day 2',
    timestamp: '5 min ago',
  },
  {
    id: '2',
    userId: '1',
    userName: 'You',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    action: 'booked',
    target: 'Hotel Le Marais for 4 nights',
    timestamp: '1 hour ago',
  },
  {
    id: '3',
    userId: '3',
    userName: 'Mike',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    action: 'commented on',
    target: 'restaurant suggestion',
    timestamp: '3 hours ago',
  },
  {
    id: '4',
    userId: '2',
    userName: 'Sarah',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    action: 'completed task',
    target: 'Research local restaurants',
    timestamp: 'Yesterday',
  },
];

const mockTasks: TripTask[] = [
  {
    id: '1',
    title: 'Book flights for the group',
    assignedTo: '1',
    assignedName: 'You',
    dueDate: 'Jan 25',
    completed: false,
    category: 'booking',
  },
  {
    id: '2',
    title: 'Research local restaurants',
    assignedTo: '2',
    assignedName: 'Sarah',
    dueDate: 'Jan 23',
    completed: true,
    category: 'research',
  },
  {
    id: '3',
    title: 'Create packing list',
    assignedTo: '3',
    assignedName: 'Mike',
    dueDate: 'Jan 28',
    completed: false,
    category: 'packing',
  },
  {
    id: '4',
    title: 'Book museum tickets',
    assignedTo: '2',
    assignedName: 'Sarah',
    dueDate: 'Jan 26',
    completed: false,
    category: 'booking',
  },
];

const mockComments: Comment[] = [
  {
    id: '1',
    userId: '3',
    userName: 'Mike',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    text: 'I found a great restaurant near the hotel - Le Petit Cler. Should we add it?',
    timestamp: '3 hours ago',
  },
  {
    id: '2',
    userId: '2',
    userName: 'Sarah',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    text: "Yes! I heard great things about it. Let's book for Day 2 dinner.",
    timestamp: '2 hours ago',
  },
];

const mockExpenses: GroupExpense[] = [
  {
    id: '1',
    description: 'Dinner at Le Petit Cler',
    amount: 180,
    currency: 'EUR',
    category: 'food',
    paidById: '1',
    paidByName: 'You',
    splitWith: ['1', '2', '3'],
    date: 'Jan 20',
  },
  {
    id: '2',
    description: 'Uber to Eiffel Tower',
    amount: 25,
    currency: 'EUR',
    category: 'transport',
    paidById: '2',
    paidByName: 'Sarah',
    splitWith: ['1', '2', '3'],
    date: 'Jan 20',
  },
  {
    id: '3',
    description: 'Louvre Museum Tickets',
    amount: 60,
    currency: 'EUR',
    category: 'activities',
    paidById: '1',
    paidByName: 'You',
    splitWith: ['1', '2', '3'],
    date: 'Jan 21',
  },
  {
    id: '4',
    description: 'Hotel Le Marais (4 nights)',
    amount: 800,
    currency: 'EUR',
    category: 'accommodation',
    paidById: '3',
    paidByName: 'Mike',
    splitWith: ['1', '2', '3'],
    date: 'Jan 19',
  },
  {
    id: '5',
    description: 'Breakfast croissants',
    amount: 24,
    currency: 'EUR',
    category: 'food',
    paidById: '2',
    paidByName: 'Sarah',
    splitWith: ['1', '2'],
    date: 'Jan 21',
  },
];

const mockVoteItems: VoteItem[] = [
  {
    id: '1',
    title: 'Visit the Louvre Museum',
    description: "Spend a full day exploring the world's largest art museum",
    category: 'activity',
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400',
    date: 'Day 2 - Morning',
    location: 'Rue de Rivoli, Paris',
    votes: [
      { memberId: '1', memberName: 'You', vote: 'yes' },
      { memberId: '2', memberName: 'Sarah', vote: 'yes' },
      { memberId: '3', memberName: 'Mike', vote: 'maybe' },
    ],
    deadline: 'Jan 25',
    status: 'active',
    createdBy: '1',
  },
  {
    id: '2',
    title: 'Seine River Dinner Cruise',
    description: 'Romantic evening cruise with 3-course French dinner',
    category: 'activity',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
    date: 'Day 3 - Evening',
    location: 'Port de la Bourdonnais',
    votes: [{ memberId: '2', memberName: 'Sarah', vote: 'yes' }],
    deadline: 'Jan 26',
    status: 'active',
    createdBy: '2',
  },
  {
    id: '3',
    title: 'Le Petit Cler Restaurant',
    description: 'Cozy French bistro with authentic local cuisine',
    category: 'restaurant',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
    date: 'Day 2 - Dinner',
    location: 'Rue Cler, 7th Arr.',
    votes: [
      { memberId: '1', memberName: 'You', vote: 'yes' },
      { memberId: '2', memberName: 'Sarah', vote: 'yes' },
      { memberId: '3', memberName: 'Mike', vote: 'yes' },
    ],
    deadline: 'Jan 24',
    status: 'completed',
    createdBy: '3',
  },
  {
    id: '4',
    title: 'Day Trip to Versailles',
    description: 'Full day excursion to the Palace of Versailles and gardens',
    category: 'itinerary',
    image: 'https://images.unsplash.com/photo-1551410224-699683e15636?w=400',
    date: 'Day 4',
    location: 'Versailles, France',
    votes: [
      { memberId: '1', memberName: 'You', vote: 'maybe' },
      { memberId: '3', memberName: 'Mike', vote: 'no' },
    ],
    deadline: 'Jan 27',
    status: 'active',
    createdBy: '1',
  },
];

type TabType = 'members' | 'activity' | 'tasks' | 'voting' | 'comments' | 'expenses';

export default function GroupTripScreen() {
  const router = useRouter();
  const [members, setMembers] = useState<CollabMember[]>(mockMembers);
  const [activities] = useState<ActivityItem[]>(mockActivities);
  const [tasks, setTasks] = useState<TripTask[]>(mockTasks);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [voteItems, setVoteItems] = useState<VoteItem[]>(mockVoteItems);
  const [expenses, setExpenses] = useState<GroupExpense[]>(mockExpenses);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('members');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CollabMember | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState<'editor' | 'viewer'>('editor');
  const [newComment, setNewComment] = useState('');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('1');
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showCreateVoteModal, setShowCreateVoteModal] = useState(false);
  const [selectedVoteItem, setSelectedVoteItem] = useState<VoteItem | null>(null);
  const [newVoteTitle, setNewVoteTitle] = useState('');
  const [newVoteDescription, setNewVoteDescription] = useState('');
  const [newVoteCategory, setNewVoteCategory] = useState<
    'itinerary' | 'activity' | 'restaurant' | 'accommodation'
  >('activity');
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showSettlementsModal, setShowSettlementsModal] = useState(false);
  const [newExpenseDescription, setNewExpenseDescription] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState<GroupExpense['category']>('food');
  const [newExpenseSplitWith, setNewExpenseSplitWith] = useState<string[]>(['1', '2', '3']);

  const shareCode = 'TRIP-PAR-2024';
  const shareLink = 'https://paintthetown.app/join/abc123xyz';

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(shareLink);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'Share link copied to clipboard');
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(shareCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'Invite code copied to clipboard');
  };

  const handleNativeShare = async () => {
    try {
      await Share.share({
        message: `Join my trip on Paint the Town! Use code: ${shareCode} or click: ${shareLink}`,
        title: 'Join My Trip',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleInvite = () => {
    if (!inviteEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    const newMember: CollabMember = {
      id: `member-${Date.now()}`,
      name: inviteEmail.split('@')[0],
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
      email: inviteEmail,
      role: invitePermission,
      hasAccepted: false,
    };

    setMembers([...members, newMember]);
    setInviteEmail('');
    setShowInviteModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Invitation Sent!', `An invitation has been sent to ${inviteEmail}`);
  };

  const handleUpdatePermission = (memberId: string, newRole: 'editor' | 'viewer') => {
    setMembers(members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
    setShowPermissionModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemoveMember = (memberId: string) => {
    Alert.alert('Remove Member', 'Are you sure you want to remove this member from the trip?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setMembers(members.filter((m) => m.id !== memberId));
          setShowPermissionModal(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    const assignee = members.find((m) => m.id === newTaskAssignee);
    const newTask: TripTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      assignedTo: newTaskAssignee,
      assignedName: assignee?.name || 'Unassigned',
      dueDate: 'Jan 30',
      completed: false,
      category: 'planning',
    };

    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setShowAddTaskModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSendComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      userId: '1',
      userName: 'You',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      text: newComment,
      timestamp: 'Just now',
    };

    setComments([...comments, comment]);
    setNewComment('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleVote = (itemId: string, vote: 'yes' | 'no' | 'maybe') => {
    setVoteItems(
      voteItems.map((item) => {
        if (item.id === itemId) {
          const existingVoteIndex = item.votes.findIndex((v) => v.memberId === '1');
          const newVotes = [...item.votes];

          if (existingVoteIndex >= 0) {
            newVotes[existingVoteIndex] = { memberId: '1', memberName: 'You', vote };
          } else {
            newVotes.push({ memberId: '1', memberName: 'You', vote });
          }

          return { ...item, votes: newVotes };
        }
        return item;
      })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleCreateVote = () => {
    if (!newVoteTitle.trim()) return;

    const newItem: VoteItem = {
      id: `vote-${Date.now()}`,
      title: newVoteTitle,
      description: newVoteDescription,
      category: newVoteCategory,
      votes: [],
      deadline: 'Jan 30',
      status: 'active',
      createdBy: '1',
    };

    setVoteItems([newItem, ...voteItems]);
    setNewVoteTitle('');
    setNewVoteDescription('');
    setShowCreateVoteModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAddExpense = () => {
    if (!newExpenseDescription.trim() || !newExpenseAmount) return;

    const newExpense: GroupExpense = {
      id: `expense-${Date.now()}`,
      description: newExpenseDescription,
      amount: parseFloat(newExpenseAmount),
      currency: 'EUR',
      category: newExpenseCategory,
      paidById: '1',
      paidByName: 'You',
      splitWith: newExpenseSplitWith,
      date: 'Today',
    };

    setExpenses([newExpense, ...expenses]);
    setNewExpenseDescription('');
    setNewExpenseAmount('');
    setNewExpenseCategory('food');
    setNewExpenseSplitWith(['1', '2', '3']);
    setShowAddExpenseModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleSplitMember = (memberId: string) => {
    if (newExpenseSplitWith.includes(memberId)) {
      if (newExpenseSplitWith.length > 1) {
        setNewExpenseSplitWith(newExpenseSplitWith.filter((id) => id !== memberId));
      }
    } else {
      setNewExpenseSplitWith([...newExpenseSplitWith, memberId]);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const calculateBalances = () => {
    const balances: { [key: string]: number } = {};

    acceptedMembers.forEach((member) => {
      balances[member.id] = 0;
    });

    expenses.forEach((expense) => {
      const splitCount = expense.splitWith.length;
      const sharePerPerson = expense.amount / splitCount;

      balances[expense.paidById] += expense.amount;

      expense.splitWith.forEach((memberId) => {
        balances[memberId] -= sharePerPerson;
      });
    });

    return balances;
  };

  const calculateSettlements = (): Settlement[] => {
    const balances = calculateBalances();
    const result: Settlement[] = [];

    const debtors: { id: string; name: string; amount: number }[] = [];
    const creditors: { id: string; name: string; amount: number }[] = [];

    Object.entries(balances).forEach(([id, balance]) => {
      const member = acceptedMembers.find((m) => m.id === id);
      if (!member) return;

      if (balance < -0.01) {
        debtors.push({ id, name: member.name, amount: Math.abs(balance) });
      } else if (balance > 0.01) {
        creditors.push({ id, name: member.name, amount: balance });
      }
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(debtor.amount, creditor.amount);

      if (amount > 0.01) {
        const existingSettlement = settlements.find(
          (s) => s.fromId === debtor.id && s.toId === creditor.id
        );
        result.push({
          fromId: debtor.id,
          fromName: debtor.name,
          toId: creditor.id,
          toName: creditor.name,
          amount: Math.round(amount * 100) / 100,
          settled: existingSettlement?.settled || false,
        });
      }

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return result;
  };

  const toggleSettlement = (fromId: string, toId: string) => {
    const updatedSettlements = [...settlements];
    const existingIndex = updatedSettlements.findIndex(
      (s) => s.fromId === fromId && s.toId === toId
    );

    if (existingIndex >= 0) {
      updatedSettlements[existingIndex].settled = !updatedSettlements[existingIndex].settled;
    } else {
      const calculated = calculateSettlements();
      const settlement = calculated.find((s) => s.fromId === fromId && s.toId === toId);
      if (settlement) {
        updatedSettlements.push({ ...settlement, settled: true });
      }
    }

    setSettlements(updatedSettlements);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const getExpenseCategoryIcon = (category: GroupExpense['category']) => {
    switch (category) {
      case 'food':
        return Utensils;
      case 'transport':
        return Car;
      case 'accommodation':
        return Home;
      case 'activities':
        return Sparkles;
      case 'shopping':
        return ShoppingBag;
      case 'flights':
        return Plane;
      default:
        return Receipt;
    }
  };

  const getExpenseCategoryColor = (category: GroupExpense['category']) => {
    switch (category) {
      case 'food':
        return colors.warning;
      case 'transport':
        return colors.primary;
      case 'accommodation':
        return colors.secondary;
      case 'activities':
        return colors.success;
      case 'shopping':
        return '#E91E63';
      case 'flights':
        return '#00BCD4';
      default:
        return colors.textSecondary;
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const myTotalPaid = expenses
    .filter((e) => e.paidById === '1')
    .reduce((sum, e) => sum + e.amount, 0);
  const myShare = expenses.reduce((sum, e) => {
    if (e.splitWith.includes('1')) {
      return sum + e.amount / e.splitWith.length;
    }
    return sum;
  }, 0);
  const myBalance = myTotalPaid - myShare;

  const getVoteCounts = (votes: VoteItem['votes']) => {
    return {
      yes: votes.filter((v) => v.vote === 'yes').length,
      no: votes.filter((v) => v.vote === 'no').length,
      maybe: votes.filter((v) => v.vote === 'maybe').length,
    };
  };

  const getUserVote = (votes: VoteItem['votes']) => {
    const userVote = votes.find((v) => v.memberId === '1');
    return userVote?.vote || null;
  };

  const getVoteCategoryIcon = (category: VoteItem['category']) => {
    switch (category) {
      case 'itinerary':
        return Calendar;
      case 'activity':
        return Sparkles;
      case 'restaurant':
        return MapPin;
      case 'accommodation':
        return MapPin;
      default:
        return Sparkles;
    }
  };

  const getVoteCategoryColor = (category: VoteItem['category']) => {
    switch (category) {
      case 'itinerary':
        return colors.primary;
      case 'activity':
        return colors.secondary;
      case 'restaurant':
        return colors.warning;
      case 'accommodation':
        return colors.success;
      default:
        return colors.primary;
    }
  };

  const handleStartPlanning = () => {
    router.push({
      pathname: '/plan-trip',
      params: { groupMode: 'true' },
    });
  };

  const acceptedMembers = members.filter((m) => m.hasAccepted);
  const pendingMembers = members.filter((m) => !m.hasAccepted);
  const completedTasks = tasks.filter((t) => t.completed).length;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'organizer':
        return colors.warning;
      case 'editor':
        return colors.primary;
      case 'viewer':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'organizer':
        return 'Organizer';
      case 'editor':
        return 'Can edit';
      case 'viewer':
        return 'View only';
      default:
        return role;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'booking':
        return colors.primary;
      case 'planning':
        return colors.secondary;
      case 'packing':
        return colors.warning;
      case 'research':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'members':
        return (
          <View style={styles.tabContent}>
            <View style={styles.onlineIndicator}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>
                {acceptedMembers.filter((m) => m.isOnline).length} online now
              </Text>
            </View>

            <View style={styles.membersList}>
              {acceptedMembers.map((member) => (
                <Pressable
                  key={member.id}
                  style={styles.memberCard}
                  onPress={() => {
                    if (member.role !== 'organizer') {
                      setSelectedMember(member);
                      setShowPermissionModal(true);
                    }
                  }}
                >
                  <View style={styles.avatarContainer}>
                    <Image
                      source={{ uri: member.avatar }}
                      style={styles.memberAvatar}
                      contentFit="cover"
                    />
                    {member.isOnline && <View style={styles.onlineBadge} />}
                  </View>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      {member.role === 'organizer' && <Crown size={14} color={colors.warning} />}
                    </View>
                    <View style={styles.memberMeta}>
                      <View
                        style={[
                          styles.roleBadge,
                          { backgroundColor: `${getRoleColor(member.role)}15` },
                        ]}
                      >
                        {member.role === 'editor' ? (
                          <Edit3 size={10} color={getRoleColor(member.role)} />
                        ) : member.role === 'viewer' ? (
                          <Eye size={10} color={getRoleColor(member.role)} />
                        ) : (
                          <Crown size={10} color={getRoleColor(member.role)} />
                        )}
                        <Text style={[styles.roleText, { color: getRoleColor(member.role) }]}>
                          {getRoleLabel(member.role)}
                        </Text>
                      </View>
                      {member.lastActive && !member.isOnline && (
                        <Text style={styles.lastActive}>{member.lastActive}</Text>
                      )}
                    </View>
                  </View>
                  {member.role !== 'organizer' && (
                    <MoreHorizontal size={20} color={colors.textTertiary} />
                  )}
                </Pressable>
              ))}

              {pendingMembers.length > 0 && (
                <>
                  <Text style={styles.pendingLabel}>Pending Invitations</Text>
                  {pendingMembers.map((member) => (
                    <View key={member.id} style={[styles.memberCard, styles.memberCardPending]}>
                      <Image
                        source={{ uri: member.avatar }}
                        style={[styles.memberAvatar, styles.memberAvatarPending]}
                        contentFit="cover"
                      />
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{member.email}</Text>
                        <View style={styles.memberMeta}>
                          <View
                            style={[
                              styles.roleBadge,
                              { backgroundColor: `${getRoleColor(member.role)}15` },
                            ]}
                          >
                            {member.role === 'editor' ? (
                              <Edit3 size={10} color={getRoleColor(member.role)} />
                            ) : (
                              <Eye size={10} color={getRoleColor(member.role)} />
                            )}
                            <Text style={[styles.roleText, { color: getRoleColor(member.role) }]}>
                              {getRoleLabel(member.role)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.pendingBadge}>
                        <Clock size={12} color={colors.warning} />
                        <Text style={styles.pendingText}>Pending</Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </View>
          </View>
        );

      case 'activity':
        return (
          <View style={styles.tabContent}>
            <View style={styles.activityList}>
              {activities.map((activity, index) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={styles.activityLeft}>
                    <Image
                      source={{ uri: activity.userAvatar }}
                      style={styles.activityAvatar}
                      contentFit="cover"
                    />
                    {index < activities.length - 1 && <View style={styles.activityLine} />}
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>
                      <Text style={styles.activityUser}>{activity.userName}</Text> {activity.action}{' '}
                      <Text style={styles.activityTarget}>{activity.target}</Text>
                    </Text>
                    <Text style={styles.activityTime}>{activity.timestamp}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        );

      case 'voting':
        return (
          <View style={styles.tabContent}>
            <View style={styles.votingHeader}>
              <View>
                <Text style={styles.votingTitle}>Group Decisions</Text>
                <Text style={styles.votingSubtitle}>
                  {voteItems.filter((v) => v.status === 'active').length} active votes
                </Text>
              </View>
              <Pressable
                style={styles.createVoteButton}
                onPress={() => setShowCreateVoteModal(true)}
              >
                <Plus size={18} color={colors.textLight} />
                <Text style={styles.createVoteText}>New Vote</Text>
              </Pressable>
            </View>

            <View style={styles.votesList}>
              {voteItems.map((item) => {
                const counts = getVoteCounts(item.votes);
                const userVote = getUserVote(item.votes);
                const totalVotes = counts.yes + counts.no + counts.maybe;
                const CategoryIcon = getVoteCategoryIcon(item.category);
                const categoryColor = getVoteCategoryColor(item.category);

                return (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.voteCard,
                      item.status === 'completed' && styles.voteCardCompleted,
                    ]}
                    onPress={() => {
                      setSelectedVoteItem(item);
                      setShowVoteModal(true);
                    }}
                  >
                    {item.image && (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.voteImage}
                        contentFit="cover"
                      />
                    )}
                    <View style={styles.voteCardContent}>
                      <View style={styles.voteCardHeader}>
                        <View
                          style={[
                            styles.voteCategoryBadge,
                            { backgroundColor: `${categoryColor}15` },
                          ]}
                        >
                          <CategoryIcon size={12} color={categoryColor} />
                          <Text style={[styles.voteCategoryText, { color: categoryColor }]}>
                            {item.category}
                          </Text>
                        </View>
                        {item.status === 'completed' ? (
                          <View style={styles.voteCompletedBadge}>
                            <CheckCircle2 size={12} color={colors.success} />
                            <Text style={styles.voteCompletedText}>Decided</Text>
                          </View>
                        ) : (
                          <View style={styles.voteDeadlineBadge}>
                            <Clock size={12} color={colors.textTertiary} />
                            <Text style={styles.voteDeadlineText}>Due {item.deadline}</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.voteItemTitle}>{item.title}</Text>
                      {item.date && <Text style={styles.voteItemDate}>{item.date}</Text>}

                      <View style={styles.voteProgress}>
                        <View style={styles.voteProgressBar}>
                          {totalVotes > 0 && (
                            <>
                              <View
                                style={[styles.voteProgressYes, { flex: counts.yes || 0.001 }]}
                              />
                              <View
                                style={[styles.voteProgressMaybe, { flex: counts.maybe || 0.001 }]}
                              />
                              <View style={[styles.voteProgressNo, { flex: counts.no || 0.001 }]} />
                            </>
                          )}
                        </View>
                        <View style={styles.voteStats}>
                          <View style={styles.voteStat}>
                            <ThumbsUp size={12} color={colors.success} />
                            <Text style={styles.voteStatText}>{counts.yes}</Text>
                          </View>
                          <View style={styles.voteStat}>
                            <HelpCircle size={12} color={colors.warning} />
                            <Text style={styles.voteStatText}>{counts.maybe}</Text>
                          </View>
                          <View style={styles.voteStat}>
                            <ThumbsDown size={12} color={colors.error} />
                            <Text style={styles.voteStatText}>{counts.no}</Text>
                          </View>
                        </View>
                      </View>

                      {item.status === 'active' && (
                        <View style={styles.quickVoteButtons}>
                          <Pressable
                            style={[
                              styles.quickVoteBtn,
                              styles.quickVoteBtnYes,
                              userVote === 'yes' && styles.quickVoteBtnYesActive,
                            ]}
                            onPress={() => handleVote(item.id, 'yes')}
                          >
                            <ThumbsUp
                              size={16}
                              color={userVote === 'yes' ? colors.textLight : colors.success}
                            />
                          </Pressable>
                          <Pressable
                            style={[
                              styles.quickVoteBtn,
                              styles.quickVoteBtnMaybe,
                              userVote === 'maybe' && styles.quickVoteBtnMaybeActive,
                            ]}
                            onPress={() => handleVote(item.id, 'maybe')}
                          >
                            <HelpCircle
                              size={16}
                              color={userVote === 'maybe' ? colors.textLight : colors.warning}
                            />
                          </Pressable>
                          <Pressable
                            style={[
                              styles.quickVoteBtn,
                              styles.quickVoteBtnNo,
                              userVote === 'no' && styles.quickVoteBtnNoActive,
                            ]}
                            onPress={() => handleVote(item.id, 'no')}
                          >
                            <ThumbsDown
                              size={16}
                              color={userVote === 'no' ? colors.textLight : colors.error}
                            />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );

      case 'tasks':
        return (
          <View style={styles.tabContent}>
            <View style={styles.taskProgress}>
              <View style={styles.taskProgressInfo}>
                <Text style={styles.taskProgressText}>
                  {completedTasks} of {tasks.length} tasks completed
                </Text>
              </View>
              <View style={styles.taskProgressBar}>
                <View
                  style={[
                    styles.taskProgressFill,
                    { width: `${(completedTasks / tasks.length) * 100}%` },
                  ]}
                />
              </View>
            </View>

            <View style={styles.tasksList}>
              {tasks.map((task) => (
                <Pressable
                  key={task.id}
                  style={styles.taskCard}
                  onPress={() => handleToggleTask(task.id)}
                >
                  <Pressable style={styles.taskCheck} onPress={() => handleToggleTask(task.id)}>
                    {task.completed ? (
                      <CheckCircle2 size={24} color={colors.success} />
                    ) : (
                      <Circle size={24} color={colors.border} />
                    )}
                  </Pressable>
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                      {task.title}
                    </Text>
                    <View style={styles.taskMeta}>
                      <View
                        style={[
                          styles.categoryTag,
                          { backgroundColor: `${getCategoryColor(task.category)}15` },
                        ]}
                      >
                        <Text
                          style={[styles.categoryText, { color: getCategoryColor(task.category) }]}
                        >
                          {task.category}
                        </Text>
                      </View>
                      <Text style={styles.taskAssignee}>
                        {task.assignedName} • {task.dueDate}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.addTaskButton} onPress={() => setShowAddTaskModal(true)}>
              <ListTodo size={18} color={colors.primary} />
              <Text style={styles.addTaskText}>Add New Task</Text>
            </Pressable>
          </View>
        );

      case 'expenses':
        return (
          <View style={styles.tabContent}>
            <View style={styles.expensesSummary}>
              <View style={styles.expenseSummaryCard}>
                <Text style={styles.expenseSummaryLabel}>Total Expenses</Text>
                <Text style={styles.expenseSummaryAmount}>€{totalExpenses.toFixed(2)}</Text>
              </View>
              <View style={styles.expenseSummaryRow}>
                <View style={[styles.expenseSummarySmall, { flex: 1 }]}>
                  <Text style={styles.expenseSmallLabel}>You Paid</Text>
                  <Text style={styles.expenseSmallAmount}>€{myTotalPaid.toFixed(2)}</Text>
                </View>
                <View style={[styles.expenseSummarySmall, { flex: 1 }]}>
                  <Text style={styles.expenseSmallLabel}>Your Share</Text>
                  <Text style={styles.expenseSmallAmount}>€{myShare.toFixed(2)}</Text>
                </View>
                <View style={[styles.expenseSummarySmall, { flex: 1 }]}>
                  <Text style={styles.expenseSmallLabel}>Balance</Text>
                  <Text
                    style={[
                      styles.expenseSmallAmount,
                      { color: myBalance >= 0 ? colors.success : colors.error },
                    ]}
                  >
                    {myBalance >= 0 ? '+' : ''}€{myBalance.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              style={styles.settlementsButton}
              onPress={() => setShowSettlementsModal(true)}
            >
              <ArrowRightLeft size={18} color={colors.primary} />
              <Text style={styles.settlementsButtonText}>View Settlements</Text>
              <View style={styles.settlementsBadge}>
                <Text style={styles.settlementsBadgeText}>
                  {calculateSettlements().filter((s) => !s.settled).length} pending
                </Text>
              </View>
            </Pressable>

            <View style={styles.expensesHeader}>
              <Text style={styles.expensesTitle}>Recent Expenses</Text>
              <Pressable style={styles.addExpenseBtn} onPress={() => setShowAddExpenseModal(true)}>
                <Plus size={16} color={colors.textLight} />
                <Text style={styles.addExpenseBtnText}>Add</Text>
              </Pressable>
            </View>

            <View style={styles.expensesList}>
              {expenses.map((expense) => {
                const CategoryIcon = getExpenseCategoryIcon(expense.category);
                const categoryColor = getExpenseCategoryColor(expense.category);
                const splitCount = expense.splitWith.length;
                const sharePerPerson = expense.amount / splitCount;

                return (
                  <View key={expense.id} style={styles.expenseCard}>
                    <View
                      style={[
                        styles.expenseIconContainer,
                        { backgroundColor: `${categoryColor}15` },
                      ]}
                    >
                      <CategoryIcon size={20} color={categoryColor} />
                    </View>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseDescription}>{expense.description}</Text>
                      <View style={styles.expenseMeta}>
                        <Text style={styles.expensePaidBy}>Paid by {expense.paidByName}</Text>
                        <Text style={styles.expenseDate}>{expense.date}</Text>
                      </View>
                      <View style={styles.expenseSplitInfo}>
                        <Users size={12} color={colors.textTertiary} />
                        <Text style={styles.expenseSplitText}>
                          Split {splitCount} ways • €{sharePerPerson.toFixed(2)}/person
                        </Text>
                      </View>
                    </View>
                    <View style={styles.expenseAmountContainer}>
                      <Text style={styles.expenseAmount}>€{expense.amount.toFixed(2)}</Text>
                      <View
                        style={[
                          styles.expenseCategoryTag,
                          { backgroundColor: `${categoryColor}15` },
                        ]}
                      >
                        <Text style={[styles.expenseCategoryText, { color: categoryColor }]}>
                          {expense.category}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );

      case 'comments':
        return (
          <View style={styles.tabContent}>
            <View style={styles.commentsList}>
              {comments.map((comment) => (
                <View key={comment.id} style={styles.commentCard}>
                  <Image
                    source={{ uri: comment.userAvatar }}
                    style={styles.commentAvatar}
                    contentFit="cover"
                  />
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentUser}>{comment.userName}</Text>
                      <Text style={styles.commentTime}>{comment.timestamp}</Text>
                    </View>
                    <Text style={styles.commentText}>{comment.text}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.commentInputContainer}>
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
                onPress={handleSendComment}
                disabled={!newComment.trim()}
              >
                <Send
                  size={20}
                  color={newComment.trim() ? colors.textLight : colors.textTertiary}
                />
              </Pressable>
            </View>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a5f4a', '#2d8a6e']} style={styles.headerGradient} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={22} color={colors.textLight} />
            </Pressable>
            <Pressable style={styles.shareButton} onPress={() => setShowShareModal(true)}>
              <Share2 size={20} color={colors.textLight} />
            </Pressable>
          </View>
          <View style={styles.headerContent}>
            <View style={styles.tripBadge}>
              <Users size={20} color={colors.textLight} />
              <Text style={styles.tripBadgeText}>Paris Adventure</Text>
            </View>
            <Text style={styles.headerTitle}>Trip Collaboration</Text>
            <Text style={styles.headerSubtitle}>
              {acceptedMembers.length} members • {completedTasks}/{tasks.length} tasks done
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.quickActions}>
            <Pressable style={styles.quickAction} onPress={() => setShowInviteModal(true)}>
              <View style={[styles.quickActionIcon, { backgroundColor: `${colors.primary}15` }]}>
                <UserPlus size={20} color={colors.primary} />
              </View>
              <Text style={styles.quickActionText}>Invite</Text>
            </Pressable>
            <Pressable style={styles.quickAction} onPress={() => setShowShareModal(true)}>
              <View style={[styles.quickActionIcon, { backgroundColor: `${colors.secondary}15` }]}>
                <Link size={20} color={colors.secondary} />
              </View>
              <Text style={styles.quickActionText}>Share Link</Text>
            </Pressable>
            <Pressable style={styles.quickAction} onPress={() => setActiveTab('voting')}>
              <View style={[styles.quickActionIcon, { backgroundColor: `${colors.success}15` }]}>
                <Vote size={20} color={colors.success} />
              </View>
              <Text style={styles.quickActionText}>Vote</Text>
            </Pressable>
            <Pressable style={styles.quickAction} onPress={() => setActiveTab('expenses')}>
              <View style={[styles.quickActionIcon, { backgroundColor: `${colors.warning}15` }]}>
                <DollarSign size={20} color={colors.warning} />
              </View>
              <Text style={styles.quickActionText}>Split</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabBar}
            contentContainerStyle={styles.tabBarContent}
          >
            {(['members', 'activity', 'tasks', 'voting', 'expenses', 'comments'] as TabType[]).map(
              (tab) => (
                <Pressable
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  {tab === 'members' && (
                    <Users
                      size={16}
                      color={activeTab === tab ? colors.primary : colors.textSecondary}
                    />
                  )}
                  {tab === 'activity' && (
                    <Activity
                      size={16}
                      color={activeTab === tab ? colors.primary : colors.textSecondary}
                    />
                  )}
                  {tab === 'tasks' && (
                    <ListTodo
                      size={16}
                      color={activeTab === tab ? colors.primary : colors.textSecondary}
                    />
                  )}
                  {tab === 'voting' && (
                    <Vote
                      size={16}
                      color={activeTab === tab ? colors.primary : colors.textSecondary}
                    />
                  )}
                  {tab === 'expenses' && (
                    <Receipt
                      size={16}
                      color={activeTab === tab ? colors.primary : colors.textSecondary}
                    />
                  )}
                  {tab === 'comments' && (
                    <MessageCircle
                      size={16}
                      color={activeTab === tab ? colors.primary : colors.textSecondary}
                    />
                  )}
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </Pressable>
              )
            )}
          </ScrollView>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {renderTabContent()}
            <View style={styles.spacer} />
          </ScrollView>
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.startButton} onPress={handleStartPlanning}>
            <Sparkles size={20} color={colors.textLight} />
            <Text style={styles.startButtonText}>Continue Planning</Text>
          </Pressable>
        </View>

        <Modal
          visible={showInviteModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowInviteModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowInviteModal(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Invite Member</Text>
                <Pressable onPress={() => setShowInviteModal(false)}>
                  <X size={24} color={colors.text} />
                </Pressable>
              </View>

              <View style={styles.inputContainer}>
                <Mail size={20} color={colors.textTertiary} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  placeholderTextColor={colors.textTertiary}
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.permissionLabel}>Permission Level</Text>
              <View style={styles.permissionOptions}>
                <Pressable
                  style={[
                    styles.permissionOption,
                    invitePermission === 'editor' && styles.permissionOptionActive,
                  ]}
                  onPress={() => setInvitePermission('editor')}
                >
                  <Edit3
                    size={18}
                    color={invitePermission === 'editor' ? colors.primary : colors.textSecondary}
                  />
                  <View style={styles.permissionInfo}>
                    <Text
                      style={[
                        styles.permissionTitle,
                        invitePermission === 'editor' && styles.permissionTitleActive,
                      ]}
                    >
                      Can Edit
                    </Text>
                    <Text style={styles.permissionDesc}>Add activities, make bookings</Text>
                  </View>
                  {invitePermission === 'editor' && <Check size={18} color={colors.primary} />}
                </Pressable>

                <Pressable
                  style={[
                    styles.permissionOption,
                    invitePermission === 'viewer' && styles.permissionOptionActive,
                  ]}
                  onPress={() => setInvitePermission('viewer')}
                >
                  <Eye
                    size={18}
                    color={invitePermission === 'viewer' ? colors.primary : colors.textSecondary}
                  />
                  <View style={styles.permissionInfo}>
                    <Text
                      style={[
                        styles.permissionTitle,
                        invitePermission === 'viewer' && styles.permissionTitleActive,
                      ]}
                    >
                      View Only
                    </Text>
                    <Text style={styles.permissionDesc}>Can view itinerary, comment</Text>
                  </View>
                  {invitePermission === 'viewer' && <Check size={18} color={colors.primary} />}
                </Pressable>
              </View>

              <Pressable
                style={[styles.inviteButton, !inviteEmail && styles.inviteButtonDisabled]}
                onPress={handleInvite}
                disabled={!inviteEmail}
              >
                <Text style={styles.inviteButtonText}>Send Invitation</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={showShareModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowShareModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowShareModal(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Share Trip</Text>
                <Pressable onPress={() => setShowShareModal(false)}>
                  <X size={24} color={colors.text} />
                </Pressable>
              </View>

              <View style={styles.shareOption}>
                <View style={styles.shareIconContainer}>
                  <Link size={22} color={colors.primary} />
                </View>
                <View style={styles.shareInfo}>
                  <Text style={styles.shareLabel}>Share Link</Text>
                  <Text style={styles.shareValue} numberOfLines={1}>
                    {shareLink}
                  </Text>
                </View>
                <Pressable style={styles.copyButton} onPress={handleCopyLink}>
                  <Copy size={18} color={colors.primary} />
                </Pressable>
              </View>

              <View style={styles.shareOption}>
                <View
                  style={[styles.shareIconContainer, { backgroundColor: `${colors.secondary}15` }]}
                >
                  <MessageSquare size={22} color={colors.secondary} />
                </View>
                <View style={styles.shareInfo}>
                  <Text style={styles.shareLabel}>Invite Code</Text>
                  <Text style={styles.shareCode}>{shareCode}</Text>
                </View>
                <Pressable style={styles.copyButton} onPress={handleCopyCode}>
                  <Copy size={18} color={colors.primary} />
                </Pressable>
              </View>

              <Pressable style={styles.nativeShareButton} onPress={handleNativeShare}>
                <Share2 size={20} color={colors.textLight} />
                <Text style={styles.nativeShareText}>Share via...</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={showPermissionModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPermissionModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowPermissionModal(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Member Settings</Text>
                <Pressable onPress={() => setShowPermissionModal(false)}>
                  <X size={24} color={colors.text} />
                </Pressable>
              </View>

              {selectedMember && (
                <>
                  <View style={styles.selectedMemberInfo}>
                    <Image
                      source={{ uri: selectedMember.avatar }}
                      style={styles.selectedMemberAvatar}
                      contentFit="cover"
                    />
                    <View>
                      <Text style={styles.selectedMemberName}>{selectedMember.name}</Text>
                      <Text style={styles.selectedMemberEmail}>{selectedMember.email}</Text>
                    </View>
                  </View>

                  <Text style={styles.permissionLabel}>Change Permission</Text>
                  <View style={styles.permissionOptions}>
                    <Pressable
                      style={[
                        styles.permissionOption,
                        selectedMember.role === 'editor' && styles.permissionOptionActive,
                      ]}
                      onPress={() => handleUpdatePermission(selectedMember.id, 'editor')}
                    >
                      <Edit3
                        size={18}
                        color={
                          selectedMember.role === 'editor' ? colors.primary : colors.textSecondary
                        }
                      />
                      <View style={styles.permissionInfo}>
                        <Text
                          style={[
                            styles.permissionTitle,
                            selectedMember.role === 'editor' && styles.permissionTitleActive,
                          ]}
                        >
                          Can Edit
                        </Text>
                      </View>
                      {selectedMember.role === 'editor' && (
                        <Check size={18} color={colors.primary} />
                      )}
                    </Pressable>

                    <Pressable
                      style={[
                        styles.permissionOption,
                        selectedMember.role === 'viewer' && styles.permissionOptionActive,
                      ]}
                      onPress={() => handleUpdatePermission(selectedMember.id, 'viewer')}
                    >
                      <Eye
                        size={18}
                        color={
                          selectedMember.role === 'viewer' ? colors.primary : colors.textSecondary
                        }
                      />
                      <View style={styles.permissionInfo}>
                        <Text
                          style={[
                            styles.permissionTitle,
                            selectedMember.role === 'viewer' && styles.permissionTitleActive,
                          ]}
                        >
                          View Only
                        </Text>
                      </View>
                      {selectedMember.role === 'viewer' && (
                        <Check size={18} color={colors.primary} />
                      )}
                    </Pressable>
                  </View>

                  <Pressable
                    style={styles.removeButton}
                    onPress={() => handleRemoveMember(selectedMember.id)}
                  >
                    <Trash2 size={18} color={colors.error} />
                    <Text style={styles.removeButtonText}>Remove from Trip</Text>
                  </Pressable>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={showAddTaskModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddTaskModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowAddTaskModal(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Task</Text>
                <Pressable onPress={() => setShowAddTaskModal(false)}>
                  <X size={24} color={colors.text} />
                </Pressable>
              </View>

              <View style={styles.inputContainer}>
                <ListTodo size={20} color={colors.textTertiary} />
                <TextInput
                  style={styles.input}
                  placeholder="What needs to be done?"
                  placeholderTextColor={colors.textTertiary}
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                />
              </View>

              <Text style={styles.permissionLabel}>Assign To</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.assigneeList}
              >
                {acceptedMembers.map((member) => (
                  <Pressable
                    key={member.id}
                    style={[
                      styles.assigneeOption,
                      newTaskAssignee === member.id && styles.assigneeOptionActive,
                    ]}
                    onPress={() => setNewTaskAssignee(member.id)}
                  >
                    <Image
                      source={{ uri: member.avatar }}
                      style={styles.assigneeAvatar}
                      contentFit="cover"
                    />
                    <Text
                      style={[
                        styles.assigneeName,
                        newTaskAssignee === member.id && styles.assigneeNameActive,
                      ]}
                    >
                      {member.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Pressable
                style={[styles.inviteButton, !newTaskTitle.trim() && styles.inviteButtonDisabled]}
                onPress={handleAddTask}
                disabled={!newTaskTitle.trim()}
              >
                <Text style={styles.inviteButtonText}>Add Task</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={showVoteModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowVoteModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowVoteModal(false)}>
            <Pressable style={styles.voteModalContent} onPress={(e) => e.stopPropagation()}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedVoteItem && (
                  <>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Vote Details</Text>
                      <Pressable onPress={() => setShowVoteModal(false)}>
                        <X size={24} color={colors.text} />
                      </Pressable>
                    </View>

                    {selectedVoteItem.image && (
                      <Image
                        source={{ uri: selectedVoteItem.image }}
                        style={styles.voteModalImage}
                        contentFit="cover"
                      />
                    )}

                    <Text style={styles.voteModalTitle}>{selectedVoteItem.title}</Text>
                    <Text style={styles.voteModalDescription}>{selectedVoteItem.description}</Text>

                    {selectedVoteItem.location && (
                      <View style={styles.voteModalInfo}>
                        <MapPin size={14} color={colors.textSecondary} />
                        <Text style={styles.voteModalInfoText}>{selectedVoteItem.location}</Text>
                      </View>
                    )}
                    {selectedVoteItem.date && (
                      <View style={styles.voteModalInfo}>
                        <Calendar size={14} color={colors.textSecondary} />
                        <Text style={styles.voteModalInfoText}>{selectedVoteItem.date}</Text>
                      </View>
                    )}

                    <View style={styles.voteResultsSection}>
                      <View style={styles.voteResultsHeader}>
                        <BarChart3 size={18} color={colors.text} />
                        <Text style={styles.voteResultsTitle}>Vote Results</Text>
                      </View>

                      {(() => {
                        const counts = getVoteCounts(selectedVoteItem.votes);
                        const total = Math.max(counts.yes + counts.no + counts.maybe, 1);
                        return (
                          <View style={styles.voteResultsBars}>
                            <View style={styles.voteResultRow}>
                              <View style={styles.voteResultLabel}>
                                <ThumbsUp size={14} color={colors.success} />
                                <Text style={styles.voteResultLabelText}>Yes</Text>
                              </View>
                              <View style={styles.voteResultBarContainer}>
                                <View
                                  style={[
                                    styles.voteResultBar,
                                    styles.voteResultBarYes,
                                    { width: `${(counts.yes / total) * 100}%` },
                                  ]}
                                />
                              </View>
                              <Text style={styles.voteResultCount}>{counts.yes}</Text>
                            </View>
                            <View style={styles.voteResultRow}>
                              <View style={styles.voteResultLabel}>
                                <HelpCircle size={14} color={colors.warning} />
                                <Text style={styles.voteResultLabelText}>Maybe</Text>
                              </View>
                              <View style={styles.voteResultBarContainer}>
                                <View
                                  style={[
                                    styles.voteResultBar,
                                    styles.voteResultBarMaybe,
                                    { width: `${(counts.maybe / total) * 100}%` },
                                  ]}
                                />
                              </View>
                              <Text style={styles.voteResultCount}>{counts.maybe}</Text>
                            </View>
                            <View style={styles.voteResultRow}>
                              <View style={styles.voteResultLabel}>
                                <ThumbsDown size={14} color={colors.error} />
                                <Text style={styles.voteResultLabelText}>No</Text>
                              </View>
                              <View style={styles.voteResultBarContainer}>
                                <View
                                  style={[
                                    styles.voteResultBar,
                                    styles.voteResultBarNo,
                                    { width: `${(counts.no / total) * 100}%` },
                                  ]}
                                />
                              </View>
                              <Text style={styles.voteResultCount}>{counts.no}</Text>
                            </View>
                          </View>
                        );
                      })()}
                    </View>

                    <View style={styles.votersSection}>
                      <Text style={styles.votersSectionTitle}>Who Voted</Text>
                      {selectedVoteItem.votes.map((vote) => (
                        <View key={vote.memberId} style={styles.voterRow}>
                          <View style={styles.voterInfo}>
                            <Image
                              source={{
                                uri:
                                  members.find((m) => m.id === vote.memberId)?.avatar ||
                                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
                              }}
                              style={styles.voterAvatar}
                              contentFit="cover"
                            />
                            <Text style={styles.voterName}>{vote.memberName}</Text>
                          </View>
                          <View
                            style={[
                              styles.voterBadge,
                              vote.vote === 'yes' && styles.voterBadgeYes,
                              vote.vote === 'maybe' && styles.voterBadgeMaybe,
                              vote.vote === 'no' && styles.voterBadgeNo,
                            ]}
                          >
                            {vote.vote === 'yes' && <ThumbsUp size={12} color={colors.success} />}
                            {vote.vote === 'maybe' && (
                              <HelpCircle size={12} color={colors.warning} />
                            )}
                            {vote.vote === 'no' && <ThumbsDown size={12} color={colors.error} />}
                            <Text
                              style={[
                                styles.voterBadgeText,
                                vote.vote === 'yes' && { color: colors.success },
                                vote.vote === 'maybe' && { color: colors.warning },
                                vote.vote === 'no' && { color: colors.error },
                              ]}
                            >
                              {vote.vote.charAt(0).toUpperCase() + vote.vote.slice(1)}
                            </Text>
                          </View>
                        </View>
                      ))}
                      {acceptedMembers.filter(
                        (m) => !selectedVoteItem.votes.find((v) => v.memberId === m.id)
                      ).length > 0 && (
                        <Text style={styles.notVotedText}>
                          {
                            acceptedMembers.filter(
                              (m) => !selectedVoteItem.votes.find((v) => v.memberId === m.id)
                            ).length
                          }{' '}
                          member(s) have not voted yet
                        </Text>
                      )}
                    </View>

                    {selectedVoteItem.status === 'active' && (
                      <View style={styles.modalVoteButtons}>
                        <Pressable
                          style={[
                            styles.modalVoteBtn,
                            styles.modalVoteBtnYes,
                            getUserVote(selectedVoteItem.votes) === 'yes' &&
                              styles.modalVoteBtnYesActive,
                          ]}
                          onPress={() => {
                            handleVote(selectedVoteItem.id, 'yes');
                            setSelectedVoteItem({
                              ...selectedVoteItem,
                              votes: selectedVoteItem.votes.some((v) => v.memberId === '1')
                                ? selectedVoteItem.votes.map((v) =>
                                    v.memberId === '1' ? { ...v, vote: 'yes' } : v
                                  )
                                : [
                                    ...selectedVoteItem.votes,
                                    { memberId: '1', memberName: 'You', vote: 'yes' },
                                  ],
                            });
                          }}
                        >
                          <ThumbsUp
                            size={20}
                            color={
                              getUserVote(selectedVoteItem.votes) === 'yes'
                                ? colors.textLight
                                : colors.success
                            }
                          />
                          <Text
                            style={[
                              styles.modalVoteBtnText,
                              {
                                color:
                                  getUserVote(selectedVoteItem.votes) === 'yes'
                                    ? colors.textLight
                                    : colors.success,
                              },
                            ]}
                          >
                            Yes
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[
                            styles.modalVoteBtn,
                            styles.modalVoteBtnMaybe,
                            getUserVote(selectedVoteItem.votes) === 'maybe' &&
                              styles.modalVoteBtnMaybeActive,
                          ]}
                          onPress={() => {
                            handleVote(selectedVoteItem.id, 'maybe');
                            setSelectedVoteItem({
                              ...selectedVoteItem,
                              votes: selectedVoteItem.votes.some((v) => v.memberId === '1')
                                ? selectedVoteItem.votes.map((v) =>
                                    v.memberId === '1' ? { ...v, vote: 'maybe' } : v
                                  )
                                : [
                                    ...selectedVoteItem.votes,
                                    { memberId: '1', memberName: 'You', vote: 'maybe' },
                                  ],
                            });
                          }}
                        >
                          <HelpCircle
                            size={20}
                            color={
                              getUserVote(selectedVoteItem.votes) === 'maybe'
                                ? colors.textLight
                                : colors.warning
                            }
                          />
                          <Text
                            style={[
                              styles.modalVoteBtnText,
                              {
                                color:
                                  getUserVote(selectedVoteItem.votes) === 'maybe'
                                    ? colors.textLight
                                    : colors.warning,
                              },
                            ]}
                          >
                            Maybe
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[
                            styles.modalVoteBtn,
                            styles.modalVoteBtnNo,
                            getUserVote(selectedVoteItem.votes) === 'no' &&
                              styles.modalVoteBtnNoActive,
                          ]}
                          onPress={() => {
                            handleVote(selectedVoteItem.id, 'no');
                            setSelectedVoteItem({
                              ...selectedVoteItem,
                              votes: selectedVoteItem.votes.some((v) => v.memberId === '1')
                                ? selectedVoteItem.votes.map((v) =>
                                    v.memberId === '1' ? { ...v, vote: 'no' } : v
                                  )
                                : [
                                    ...selectedVoteItem.votes,
                                    { memberId: '1', memberName: 'You', vote: 'no' },
                                  ],
                            });
                          }}
                        >
                          <ThumbsDown
                            size={20}
                            color={
                              getUserVote(selectedVoteItem.votes) === 'no'
                                ? colors.textLight
                                : colors.error
                            }
                          />
                          <Text
                            style={[
                              styles.modalVoteBtnText,
                              {
                                color:
                                  getUserVote(selectedVoteItem.votes) === 'no'
                                    ? colors.textLight
                                    : colors.error,
                              },
                            ]}
                          >
                            No
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={showCreateVoteModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCreateVoteModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowCreateVoteModal(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New Vote</Text>
                <Pressable onPress={() => setShowCreateVoteModal(false)}>
                  <X size={24} color={colors.text} />
                </Pressable>
              </View>

              <View style={styles.inputContainer}>
                <Vote size={20} color={colors.textTertiary} />
                <TextInput
                  style={styles.input}
                  placeholder="What should we vote on?"
                  placeholderTextColor={colors.textTertiary}
                  value={newVoteTitle}
                  onChangeText={setNewVoteTitle}
                />
              </View>

              <View
                style={[styles.inputContainer, { alignItems: 'flex-start', paddingVertical: 12 }]}
              >
                <Edit3 size={20} color={colors.textTertiary} style={{ marginTop: 2 }} />
                <TextInput
                  style={[styles.input, { minHeight: 60 }]}
                  placeholder="Add a description (optional)"
                  placeholderTextColor={colors.textTertiary}
                  value={newVoteDescription}
                  onChangeText={setNewVoteDescription}
                  multiline
                />
              </View>

              <Text style={styles.permissionLabel}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryList}
              >
                {(['activity', 'itinerary', 'restaurant', 'accommodation'] as const).map((cat) => (
                  <Pressable
                    key={cat}
                    style={[
                      styles.categoryOption,
                      newVoteCategory === cat && styles.categoryOptionActive,
                    ]}
                    onPress={() => setNewVoteCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        newVoteCategory === cat && styles.categoryOptionTextActive,
                      ]}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Pressable
                style={[styles.inviteButton, !newVoteTitle.trim() && styles.inviteButtonDisabled]}
                onPress={handleCreateVote}
                disabled={!newVoteTitle.trim()}
              >
                <Text style={styles.inviteButtonText}>Create Vote</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={showAddExpenseModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddExpenseModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowAddExpenseModal(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Expense</Text>
                <Pressable onPress={() => setShowAddExpenseModal(false)}>
                  <X size={24} color={colors.text} />
                </Pressable>
              </View>

              <View style={styles.inputContainer}>
                <Receipt size={20} color={colors.textTertiary} />
                <TextInput
                  style={styles.input}
                  placeholder="What did you pay for?"
                  placeholderTextColor={colors.textTertiary}
                  value={newExpenseDescription}
                  onChangeText={setNewExpenseDescription}
                />
              </View>

              <View style={styles.inputContainer}>
                <DollarSign size={20} color={colors.textTertiary} />
                <TextInput
                  style={styles.input}
                  placeholder="Amount (EUR)"
                  placeholderTextColor={colors.textTertiary}
                  value={newExpenseAmount}
                  onChangeText={setNewExpenseAmount}
                  keyboardType="decimal-pad"
                />
              </View>

              <Text style={styles.permissionLabel}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryList}
              >
                {(
                  [
                    'food',
                    'transport',
                    'accommodation',
                    'activities',
                    'shopping',
                    'flights',
                    'other',
                  ] as const
                ).map((cat) => {
                  const CatIcon = getExpenseCategoryIcon(cat);
                  const catColor = getExpenseCategoryColor(cat);
                  return (
                    <Pressable
                      key={cat}
                      style={[
                        styles.expenseCategoryOption,
                        newExpenseCategory === cat && {
                          borderColor: catColor,
                          backgroundColor: `${catColor}15`,
                        },
                      ]}
                      onPress={() => setNewExpenseCategory(cat)}
                    >
                      <CatIcon
                        size={16}
                        color={newExpenseCategory === cat ? catColor : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.categoryOptionText,
                          newExpenseCategory === cat && { color: catColor },
                        ]}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={styles.permissionLabel}>Split With</Text>
              <View style={styles.splitMembersList}>
                {acceptedMembers.map((member) => (
                  <Pressable
                    key={member.id}
                    style={[
                      styles.splitMemberOption,
                      newExpenseSplitWith.includes(member.id) && styles.splitMemberOptionActive,
                    ]}
                    onPress={() => toggleSplitMember(member.id)}
                  >
                    <Image
                      source={{ uri: member.avatar }}
                      style={styles.splitMemberAvatar}
                      contentFit="cover"
                    />
                    <Text
                      style={[
                        styles.splitMemberName,
                        newExpenseSplitWith.includes(member.id) && styles.splitMemberNameActive,
                      ]}
                    >
                      {member.name}
                    </Text>
                    {newExpenseSplitWith.includes(member.id) && (
                      <CheckCircle2 size={18} color={colors.primary} />
                    )}
                  </Pressable>
                ))}
              </View>

              {newExpenseSplitWith.length > 0 && newExpenseAmount && (
                <View style={styles.splitPreview}>
                  <Text style={styles.splitPreviewText}>
                    Each person pays: €
                    {(parseFloat(newExpenseAmount || '0') / newExpenseSplitWith.length).toFixed(2)}
                  </Text>
                </View>
              )}

              <Pressable
                style={[
                  styles.inviteButton,
                  (!newExpenseDescription.trim() || !newExpenseAmount) &&
                    styles.inviteButtonDisabled,
                ]}
                onPress={handleAddExpense}
                disabled={!newExpenseDescription.trim() || !newExpenseAmount}
              >
                <Text style={styles.inviteButtonText}>Add Expense</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={showSettlementsModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSettlementsModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowSettlementsModal(false)}>
            <Pressable style={styles.voteModalContent} onPress={(e) => e.stopPropagation()}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Settlements</Text>
                  <Pressable onPress={() => setShowSettlementsModal(false)}>
                    <X size={24} color={colors.text} />
                  </Pressable>
                </View>

                <View style={styles.settlementsSummary}>
                  <ArrowRightLeft size={24} color={colors.primary} />
                  <Text style={styles.settlementsSummaryText}>
                    Simplify debts between group members
                  </Text>
                </View>

                <View style={styles.balancesSection}>
                  <Text style={styles.balancesSectionTitle}>Member Balances</Text>
                  {acceptedMembers.map((member) => {
                    const balances = calculateBalances();
                    const balance = balances[member.id] || 0;
                    return (
                      <View key={member.id} style={styles.balanceRow}>
                        <View style={styles.balanceRowLeft}>
                          <Image
                            source={{ uri: member.avatar }}
                            style={styles.balanceAvatar}
                            contentFit="cover"
                          />
                          <Text style={styles.balanceName}>{member.name}</Text>
                        </View>
                        <Text
                          style={[
                            styles.balanceAmount,
                            { color: balance >= 0 ? colors.success : colors.error },
                          ]}
                        >
                          {balance >= 0 ? 'gets back' : 'owes'} €{Math.abs(balance).toFixed(2)}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <View style={styles.settlementsListSection}>
                  <Text style={styles.balancesSectionTitle}>Who Pays Whom</Text>
                  {calculateSettlements().length === 0 ? (
                    <View style={styles.noSettlements}>
                      <CheckCheck size={32} color={colors.success} />
                      <Text style={styles.noSettlementsText}>All settled up!</Text>
                    </View>
                  ) : (
                    calculateSettlements().map((settlement, index) => {
                      const isSettled =
                        settlements.find(
                          (s) => s.fromId === settlement.fromId && s.toId === settlement.toId
                        )?.settled || false;

                      return (
                        <View
                          key={index}
                          style={[styles.settlementRow, isSettled && styles.settlementRowSettled]}
                        >
                          <View style={styles.settlementInfo}>
                            <View style={styles.settlementParties}>
                              <Image
                                source={{
                                  uri: acceptedMembers.find((m) => m.id === settlement.fromId)
                                    ?.avatar,
                                }}
                                style={styles.settlementAvatar}
                                contentFit="cover"
                              />
                              <ArrowRightLeft size={16} color={colors.textTertiary} />
                              <Image
                                source={{
                                  uri: acceptedMembers.find((m) => m.id === settlement.toId)
                                    ?.avatar,
                                }}
                                style={styles.settlementAvatar}
                                contentFit="cover"
                              />
                            </View>
                            <View>
                              <Text style={styles.settlementText}>
                                <Text style={styles.settlementName}>{settlement.fromName}</Text>
                                {' pays '}
                                <Text style={styles.settlementName}>{settlement.toName}</Text>
                              </Text>
                              <Text style={styles.settlementAmount}>
                                €{settlement.amount.toFixed(2)}
                              </Text>
                            </View>
                          </View>
                          <Pressable
                            style={[styles.settleButton, isSettled && styles.settleButtonDone]}
                            onPress={() => toggleSettlement(settlement.fromId, settlement.toId)}
                          >
                            {isSettled ? (
                              <>
                                <CheckCircle2 size={16} color={colors.success} />
                                <Text style={styles.settleButtonTextDone}>Settled</Text>
                              </>
                            ) : (
                              <>
                                <CreditCard size={16} color={colors.textLight} />
                                <Text style={styles.settleButtonText}>Mark Paid</Text>
                              </>
                            )}
                          </Pressable>
                        </View>
                      );
                    })
                  )}
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
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
    height: 260,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  tripBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  tripBadgeText: {
    fontSize: 13,
    color: colors.textLight,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textLight,
  },
  headerSubtitle: {
    fontSize: 14,
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  quickAction: {
    alignItems: 'center',
    gap: 6,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tabBarContent: {
    paddingHorizontal: 16,
    gap: 4,
  },
  tab: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
  },
  scrollContent: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  onlineText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  membersList: {
    gap: 10,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  memberCardPending: {
    opacity: 0.7,
  },
  avatarContainer: {
    position: 'relative',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberAvatarPending: {
    opacity: 0.6,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  lastActive: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  pendingLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.warning}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '500',
  },
  activityList: {
    gap: 0,
  },
  activityItem: {
    flexDirection: 'row',
    gap: 12,
  },
  activityLeft: {
    alignItems: 'center',
  },
  activityAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  activityLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 8,
  },
  activityContent: {
    flex: 1,
    paddingBottom: 20,
  },
  activityText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  activityUser: {
    fontWeight: '600',
  },
  activityTarget: {
    color: colors.primary,
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  taskProgress: {
    marginBottom: 20,
  },
  taskProgressInfo: {
    marginBottom: 8,
  },
  taskProgressText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  taskProgressBar: {
    height: 6,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  taskProgressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  tasksList: {
    gap: 10,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  taskCheck: {
    padding: 2,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  taskTitleCompleted: {
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  taskAssignee: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: colors.accent,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addTaskText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
  commentsList: {
    gap: 16,
    marginBottom: 20,
  },
  commentCard: {
    flexDirection: 'row',
    gap: 12,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  commentContent: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  commentTime: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  commentText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 6,
    paddingLeft: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceSecondary,
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
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1a5f4a',
    paddingVertical: 16,
    borderRadius: 16,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  permissionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  permissionOptions: {
    gap: 10,
    marginBottom: 20,
  },
  permissionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  permissionOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.accent,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  permissionTitleActive: {
    color: colors.primary,
  },
  permissionDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inviteButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  inviteButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  inviteButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textLight,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  shareIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareInfo: {
    flex: 1,
  },
  shareLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  shareValue: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  shareCode: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
    letterSpacing: 1,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  nativeShareText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textLight,
  },
  selectedMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
  },
  selectedMemberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  selectedMemberName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  selectedMemberEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.error,
  },
  removeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
  },
  assigneeList: {
    marginBottom: 20,
  },
  assigneeOption: {
    alignItems: 'center',
    marginRight: 16,
    padding: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.borderLight,
    minWidth: 80,
  },
  assigneeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.accent,
  },
  assigneeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 8,
  },
  assigneeName: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  assigneeNameActive: {
    color: colors.primary,
  },
  votingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  votingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  votingSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  createVoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  createVoteText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  votesList: {
    gap: 14,
  },
  voteCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  voteCardCompleted: {
    opacity: 0.7,
  },
  voteImage: {
    width: '100%',
    height: 120,
  },
  voteCardContent: {
    padding: 14,
  },
  voteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  voteCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  voteCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  voteDeadlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voteDeadlineText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  voteCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  voteCompletedText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
  },
  voteItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  voteItemDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  voteProgress: {
    marginTop: 12,
  },
  voteProgressBar: {
    height: 6,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  voteProgressYes: {
    backgroundColor: colors.success,
  },
  voteProgressMaybe: {
    backgroundColor: colors.warning,
  },
  voteProgressNo: {
    backgroundColor: colors.error,
  },
  voteStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  voteStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voteStatText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  quickVoteButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  quickVoteBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  quickVoteBtnYes: {
    borderColor: colors.success,
    backgroundColor: `${colors.success}10`,
  },
  quickVoteBtnYesActive: {
    backgroundColor: colors.success,
  },
  quickVoteBtnMaybe: {
    borderColor: colors.warning,
    backgroundColor: `${colors.warning}10`,
  },
  quickVoteBtnMaybeActive: {
    backgroundColor: colors.warning,
  },
  quickVoteBtnNo: {
    borderColor: colors.error,
    backgroundColor: `${colors.error}10`,
  },
  quickVoteBtnNoActive: {
    backgroundColor: colors.error,
  },
  voteModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  voteModalImage: {
    width: '100%',
    height: 160,
    borderRadius: 14,
    marginBottom: 16,
  },
  voteModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  voteModalDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  voteModalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  voteModalInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  voteResultsSection: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
  },
  voteResultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  voteResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  voteResultsBars: {
    gap: 12,
  },
  voteResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  voteResultLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 70,
  },
  voteResultLabelText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  voteResultBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  voteResultBar: {
    height: '100%',
    borderRadius: 4,
  },
  voteResultBarYes: {
    backgroundColor: colors.success,
  },
  voteResultBarMaybe: {
    backgroundColor: colors.warning,
  },
  voteResultBarNo: {
    backgroundColor: colors.error,
  },
  voteResultCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    width: 20,
    textAlign: 'right',
  },
  votersSection: {
    marginTop: 20,
  },
  votersSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  voterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  voterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  voterAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  voterName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  voterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  voterBadgeYes: {
    backgroundColor: `${colors.success}15`,
  },
  voterBadgeMaybe: {
    backgroundColor: `${colors.warning}15`,
  },
  voterBadgeNo: {
    backgroundColor: `${colors.error}15`,
  },
  voterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notVotedText: {
    fontSize: 13,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: 12,
  },
  modalVoteButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalVoteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  modalVoteBtnYes: {
    borderColor: colors.success,
    backgroundColor: `${colors.success}10`,
  },
  modalVoteBtnYesActive: {
    backgroundColor: colors.success,
  },
  modalVoteBtnMaybe: {
    borderColor: colors.warning,
    backgroundColor: `${colors.warning}10`,
  },
  modalVoteBtnMaybeActive: {
    backgroundColor: colors.warning,
  },
  modalVoteBtnNo: {
    borderColor: colors.error,
    backgroundColor: `${colors.error}10`,
  },
  modalVoteBtnNoActive: {
    backgroundColor: colors.error,
  },
  modalVoteBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  categoryList: {
    marginBottom: 20,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    marginRight: 10,
  },
  categoryOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.accent,
  },
  categoryOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryOptionTextActive: {
    color: colors.primary,
  },
  expensesSummary: {
    marginBottom: 16,
  },
  expenseSummaryCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  expenseSummaryLabel: {
    fontSize: 13,
    color: colors.textLight,
    opacity: 0.8,
    marginBottom: 4,
  },
  expenseSummaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textLight,
  },
  expenseSummaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  expenseSummarySmall: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  expenseSmallLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  expenseSmallAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  settlementsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  settlementsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  settlementsBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  settlementsBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textLight,
  },
  expensesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  expensesTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  addExpenseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addExpenseBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
  },
  expensesList: {
    gap: 10,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  expenseIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  expenseDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  expenseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  expensePaidBy: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  expenseDate: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  expenseSplitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  expenseSplitText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  expenseCategoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  expenseCategoryText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  expenseCategoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    marginRight: 10,
  },
  splitMembersList: {
    gap: 8,
    marginBottom: 16,
  },
  splitMemberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  splitMemberOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.accent,
  },
  splitMemberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  splitMemberName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  splitMemberNameActive: {
    color: colors.primary,
  },
  splitPreview: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  splitPreviewText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  settlementsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  settlementsSummaryText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  balancesSection: {
    marginBottom: 24,
  },
  balancesSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  balanceRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  balanceAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  balanceName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  balanceAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  settlementsListSection: {
    marginBottom: 20,
  },
  noSettlements: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 10,
  },
  noSettlementsText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
  },
  settlementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  settlementRowSettled: {
    opacity: 0.6,
    backgroundColor: `${colors.success}10`,
  },
  settlementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settlementParties: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settlementAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  settlementText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  settlementName: {
    fontWeight: '600',
    color: colors.text,
  },
  settlementAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  settleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  settleButtonDone: {
    backgroundColor: `${colors.success}15`,
  },
  settleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  settleButtonTextDone: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
});
