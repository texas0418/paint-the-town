import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Shield,
  MapPin,
  Heart,
  AlertTriangle,
  ChevronRight,
  Plus,
  X,
  User,
  Trash2,
  Globe,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { EmergencyContact } from '@/types';

const emergencyServices = [
  {
    id: 'police',
    name: 'Local Police',
    number: '911',
    icon: Shield,
    color: colors.primary,
  },
  {
    id: 'ambulance',
    name: 'Ambulance',
    number: '911',
    icon: Heart,
    color: colors.error,
  },
  {
    id: 'fire',
    name: 'Fire Department',
    number: '911',
    icon: AlertTriangle,
    color: colors.warning,
  },
  {
    id: 'embassy',
    name: 'US Embassy',
    number: '+1-202-501-4444',
    icon: Globe,
    color: colors.success,
  },
];

export default function EmergencyScreen() {
  const router = useRouter();
  const { user, addEmergencyContact, removeEmergencyContact } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: '',
  });

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone) {
      Alert.alert('Missing Information', 'Please enter name and phone number');
      return;
    }

    const contact: EmergencyContact = {
      id: `contact-${Date.now()}`,
      name: newContact.name,
      phone: newContact.phone,
      relationship: newContact.relationship || 'Emergency Contact',
    };

    addEmergencyContact(contact);
    setShowAddModal(false);
    setNewContact({ name: '', phone: '', relationship: '' });
  };

  const handleRemoveContact = (contactId: string) => {
    Alert.alert('Remove Contact', 'Are you sure you want to remove this emergency contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeEmergencyContact(contactId),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Emergency Support</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.alertBanner}>
            <AlertTriangle size={24} color={colors.error} />
            <Text style={styles.alertText}>
              In case of a life-threatening emergency, call local emergency services immediately.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Services</Text>
            <View style={styles.servicesGrid}>
              {emergencyServices.map((service) => (
                <Pressable
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() => handleCall(service.number)}
                >
                  <View style={[styles.serviceIcon, { backgroundColor: `${service.color}15` }]}>
                    <service.icon size={24} color={service.color} />
                  </View>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceNumber}>{service.number}</Text>
                  <View style={styles.callButton}>
                    <Phone size={16} color={colors.textLight} />
                    <Text style={styles.callText}>Call</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Emergency Contacts</Text>
              <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
                <Plus size={18} color={colors.primary} />
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>

            {(user.emergencyContacts || []).length > 0 ? (
              <View style={styles.contactsList}>
                {(user.emergencyContacts || []).map((contact) => (
                  <View key={contact.id} style={styles.contactCard}>
                    <View style={styles.contactAvatar}>
                      <User size={20} color={colors.textSecondary} />
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      <Text style={styles.contactRelation}>{contact.relationship}</Text>
                      <Text style={styles.contactPhone}>{contact.phone}</Text>
                    </View>
                    <View style={styles.contactActions}>
                      <Pressable
                        style={styles.contactCallBtn}
                        onPress={() => handleCall(contact.phone)}
                      >
                        <Phone size={18} color={colors.textLight} />
                      </Pressable>
                      <Pressable
                        style={styles.contactDeleteBtn}
                        onPress={() => handleRemoveContact(contact.id)}
                      >
                        <Trash2 size={18} color={colors.error} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContacts}>
                <User size={40} color={colors.textTertiary} />
                <Text style={styles.emptyText}>No emergency contacts added</Text>
                <Text style={styles.emptySubtext}>
                  Add contacts who should be notified in case of emergency
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>24/7 Support</Text>
            <View style={styles.supportCard}>
              <View style={styles.supportHeader}>
                <MessageSquare size={24} color={colors.primary} />
                <View style={styles.supportInfo}>
                  <Text style={styles.supportTitle}>Paint the Town Support</Text>
                  <Text style={styles.supportAvailable}>Available 24/7</Text>
                </View>
              </View>
              <Text style={styles.supportDescription}>
                Our support team can help with booking issues, rebooking, lost items, and travel
                emergencies.
              </Text>
              <View style={styles.supportActions}>
                <Pressable style={styles.supportButton}>
                  <Phone size={18} color={colors.textLight} />
                  <Text style={styles.supportButtonText}>Call Support</Text>
                </Pressable>
                <Pressable style={[styles.supportButton, styles.supportButtonSecondary]}>
                  <MessageSquare size={18} color={colors.primary} />
                  <Text style={[styles.supportButtonText, styles.supportButtonTextSecondary]}>
                    Live Chat
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Travel Insurance</Text>
            {user.subscriptionTier === 'premium' || user.subscriptionTier === 'family' ? (
              <View style={styles.insuranceCard}>
                <Shield size={24} color={colors.success} />
                <View style={styles.insuranceInfo}>
                  <Text style={styles.insuranceTitle}>Coverage Active</Text>
                  <Text style={styles.insuranceDescription}>
                    Your premium plan includes comprehensive travel insurance.
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textTertiary} />
              </View>
            ) : (
              <View style={styles.insuranceCard}>
                <Shield size={24} color={colors.textTertiary} />
                <View style={styles.insuranceInfo}>
                  <Text style={styles.insuranceTitle}>No Insurance</Text>
                  <Text style={styles.insuranceDescription}>
                    Upgrade to Premium for included travel insurance.
                  </Text>
                </View>
                <Pressable style={styles.upgradeBtn}>
                  <Text style={styles.upgradeBtnText}>Upgrade</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.tipsSection}>
            <Text style={styles.sectionTitle}>Safety Tips</Text>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>
                  Keep copies of important documents in a secure location
                </Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>Share your itinerary with family or friends</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>
                  Know the location of the nearest hospital and embassy
                </Text>
              </View>
              <View style={styles.tipItem}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>
                  Register with your country&apos;s travel advisory service
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <Modal
          visible={showAddModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Emergency Contact</Text>
                <Pressable onPress={() => setShowAddModal(false)}>
                  <X size={24} color={colors.text} />
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Contact name"
                placeholderTextColor={colors.textTertiary}
                value={newContact.name}
                onChangeText={(text) => setNewContact({ ...newContact, name: text })}
              />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor={colors.textTertiary}
                value={newContact.phone}
                onChangeText={(text) => setNewContact({ ...newContact, phone: text })}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Relationship</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Spouse, Parent, Friend"
                placeholderTextColor={colors.textTertiary}
                value={newContact.relationship}
                onChangeText={(text) => setNewContact({ ...newContact, relationship: text })}
              />

              <Pressable
                style={[
                  styles.saveButton,
                  (!newContact.name || !newContact.phone) && styles.saveButtonDisabled,
                ]}
                onPress={handleAddContact}
                disabled={!newContact.name || !newContact.phone}
              >
                <Text style={styles.saveButtonText}>Add Contact</Text>
              </Pressable>
            </View>
          </View>
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
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    margin: 20,
    padding: 16,
    backgroundColor: `${colors.error}10`,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.error,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: colors.error,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.accent,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  serviceNumber: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 12,
  },
  callText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  contactsList: {
    gap: 10,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  contactRelation: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  contactPhone: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 4,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  contactCallBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactDeleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.error}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContacts: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  supportCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  supportInfo: {},
  supportTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  supportAvailable: {
    fontSize: 13,
    color: colors.success,
    marginTop: 2,
  },
  supportDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  supportActions: {
    flexDirection: 'row',
    gap: 12,
  },
  supportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  supportButtonSecondary: {
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  supportButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textLight,
  },
  supportButtonTextSecondary: {
    color: colors.primary,
  },
  insuranceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  insuranceInfo: {
    flex: 1,
  },
  insuranceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  insuranceDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  upgradeBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  upgradeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  tipsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tipsList: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textLight,
  },
});
