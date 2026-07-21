/* eslint-disable max-lines -- tracked in #1 */
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
  Platform,
  Animated,
  Clipboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Languages,
  Camera,
  Type,
  MessageSquare,
  ArrowLeftRight,
  Copy,
  Volume2,
  History,
  X,
  ChevronDown,
  Scan,
  Mic,
  Send,
  Trash2,
  Check,
  RefreshCw,
} from 'lucide-react-native';
import colors from '@/constants/colors';

const { width, height } = Dimensions.get('window');

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

interface TranslationItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: Language;
  targetLanguage: Language;
  timestamp: string;
  mode: 'text' | 'camera' | 'conversation';
}

interface ConversationMessage {
  id: string;
  text: string;
  translatedText: string;
  isUser: boolean;
  language: Language;
  timestamp: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
];

const mockTranslations: Record<string, Record<string, string>> = {
  hello: { es: 'hola', fr: 'bonjour', de: 'hallo', it: 'ciao', ja: 'こんにちは', zh: '你好' },
  'thank you': {
    es: 'gracias',
    fr: 'merci',
    de: 'danke',
    it: 'grazie',
    ja: 'ありがとう',
    zh: '谢谢',
  },
  'where is': {
    es: 'dónde está',
    fr: 'où est',
    de: 'wo ist',
    it: "dov'è",
    ja: 'どこですか',
    zh: '在哪里',
  },
  'how much': {
    es: 'cuánto cuesta',
    fr: 'combien',
    de: 'wie viel',
    it: 'quanto costa',
    ja: 'いくらですか',
    zh: '多少钱',
  },
  menu: { es: 'menú', fr: 'menu', de: 'speisekarte', it: 'menù', ja: 'メニュー', zh: '菜单' },
  restaurant: {
    es: 'restaurante',
    fr: 'restaurant',
    de: 'restaurant',
    it: 'ristorante',
    ja: 'レストラン',
    zh: '餐厅',
  },
  hotel: { es: 'hotel', fr: 'hôtel', de: 'hotel', it: 'albergo', ja: 'ホテル', zh: '酒店' },
  bathroom: {
    es: 'baño',
    fr: 'toilettes',
    de: 'toilette',
    it: 'bagno',
    ja: 'トイレ',
    zh: '洗手间',
  },
  help: { es: 'ayuda', fr: 'aide', de: 'hilfe', it: 'aiuto', ja: '助けて', zh: '帮助' },
  water: { es: 'agua', fr: 'eau', de: 'wasser', it: 'acqua', ja: '水', zh: '水' },
};

type TranslationMode = 'text' | 'camera' | 'conversation';

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function TranslationScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<TranslationMode>('text');
  const [sourceLanguage, setSourceLanguage] = useState<Language>(languages[0]);
  const [targetLanguage, setTargetLanguage] = useState<Language>(languages[1]);
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState<'source' | 'target' | null>(null);
  const [history, setHistory] = useState<TranslationItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [conversationInput, setConversationInput] = useState('');
  const [isUserTurn, setIsUserTurn] = useState(true);
  const [copied, setCopied] = useState(false);
  const [cameraScanning, setCameraScanning] = useState(false);
  const [detectedText, setDetectedText] = useState('');

  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulseAnimation = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const simulateTranslation = useCallback((text: string, target: Language): string => {
    const lowerText = text.toLowerCase().trim();
    const targetCode = target.code;

    for (const [key, translations] of Object.entries(mockTranslations)) {
      if (lowerText.includes(key) && translations[targetCode]) {
        return text.replace(new RegExp(key, 'gi'), translations[targetCode]);
      }
    }

    const prefixes: Record<string, string> = {
      es: '(ES) ',
      fr: '(FR) ',
      de: '(DE) ',
      it: '(IT) ',
      ja: '(JA) ',
      zh: '(ZH) ',
      ko: '(KO) ',
      ar: '(AR) ',
      hi: '(HI) ',
      th: '(TH) ',
      vi: '(VI) ',
      ru: '(RU) ',
      tr: '(TR) ',
      nl: '(NL) ',
      el: '(EL) ',
      pl: '(PL) ',
      pt: '(PT) ',
    };

    return `${prefixes[targetCode] || ''}${text}`;
  }, []);

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) return;

    setIsTranslating(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    const result = simulateTranslation(inputText, targetLanguage);
    setTranslatedText(result);
    setIsTranslating(false);

    const newItem: TranslationItem = {
      id: Date.now().toString(),
      sourceText: inputText,
      translatedText: result,
      sourceLanguage,
      targetLanguage,
      timestamp: new Date().toISOString(),
      mode: 'text',
    };
    setHistory((prev) => [newItem, ...prev].slice(0, 50));
  }, [inputText, targetLanguage, sourceLanguage, simulateTranslation]);

  const handleSwapLanguages = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
    setInputText(translatedText);
    setTranslatedText(inputText);
  }, [sourceLanguage, targetLanguage, inputText, translatedText]);

  const handleCopy = useCallback(async (text: string) => {
    Clipboard.setString(text);
    setCopied(true);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleSpeak = useCallback((text: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert('Text-to-Speech', `Speaking: "${text}"`);
  }, []);

  const handleConversationSend = useCallback(async () => {
    if (!conversationInput.trim()) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const currentLang = isUserTurn ? sourceLanguage : targetLanguage;
    const translateTo = isUserTurn ? targetLanguage : sourceLanguage;

    const translated = simulateTranslation(conversationInput, translateTo);

    const newMessage: ConversationMessage = {
      id: Date.now().toString(),
      text: conversationInput,
      translatedText: translated,
      isUser: isUserTurn,
      language: currentLang,
      timestamp: new Date().toISOString(),
    };

    setConversationMessages((prev) => [...prev, newMessage]);
    setConversationInput('');
    setIsUserTurn(!isUserTurn);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [conversationInput, isUserTurn, sourceLanguage, targetLanguage, simulateTranslation]);

  const handleCameraCapture = useCallback(async () => {
    setCameraScanning(true);
    startPulseAnimation();

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const sampleTexts = [
      'Welcome to our restaurant',
      'Exit this way',
      'No smoking area',
      'Special menu today',
      'Open 24 hours',
    ];
    const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    setDetectedText(randomText);

    const translated = simulateTranslation(randomText, targetLanguage);
    setTranslatedText(translated);
    setCameraScanning(false);

    const newItem: TranslationItem = {
      id: Date.now().toString(),
      sourceText: randomText,
      translatedText: translated,
      sourceLanguage,
      targetLanguage,
      timestamp: new Date().toISOString(),
      mode: 'camera',
    };
    setHistory((prev) => [newItem, ...prev].slice(0, 50));
  }, [targetLanguage, sourceLanguage, simulateTranslation, startPulseAnimation]);

  const selectLanguage = useCallback(
    (lang: Language) => {
      if (showLanguagePicker === 'source') {
        setSourceLanguage(lang);
      } else {
        setTargetLanguage(lang);
      }
      setShowLanguagePicker(null);
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    },
    [showLanguagePicker]
  );

  const clearHistory = useCallback(() => {
    Alert.alert('Clear History', 'Are you sure you want to clear all translation history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setHistory([]);
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      },
    ]);
  }, []);

  const renderLanguagePicker = () => (
    <View style={styles.languagePickerOverlay}>
      <Pressable
        style={styles.languagePickerBackdrop}
        onPress={() => setShowLanguagePicker(null)}
      />
      <View style={styles.languagePickerContainer}>
        <View style={styles.languagePickerHeader}>
          <Text style={styles.languagePickerTitle}>
            Select {showLanguagePicker === 'source' ? 'Source' : 'Target'} Language
          </Text>
          <Pressable onPress={() => setShowLanguagePicker(null)}>
            <X size={24} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
          {languages.map((lang) => {
            const isSelected =
              showLanguagePicker === 'source'
                ? lang.code === sourceLanguage.code
                : lang.code === targetLanguage.code;
            return (
              <Pressable
                key={lang.code}
                style={[styles.languageItem, isSelected && styles.languageItemSelected]}
                onPress={() => selectLanguage(lang)}
              >
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <View style={styles.languageInfo}>
                  <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>
                    {lang.name}
                  </Text>
                  <Text style={styles.languageNative}>{lang.nativeName}</Text>
                </View>
                {isSelected && <Check size={20} color={colors.primary} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  const renderTextMode = () => (
    <ScrollView
      style={styles.modeContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.textModeContent}
    >
      <View style={styles.inputCard}>
        <View style={styles.inputHeader}>
          <Pressable style={styles.languageButton} onPress={() => setShowLanguagePicker('source')}>
            <Text style={styles.languageButtonFlag}>{sourceLanguage.flag}</Text>
            <Text style={styles.languageButtonText}>{sourceLanguage.name}</Text>
            <ChevronDown size={16} color={colors.textSecondary} />
          </Pressable>
        </View>
        <TextInput
          style={styles.textInput}
          placeholder="Enter text to translate..."
          placeholderTextColor={colors.textTertiary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          textAlignVertical="top"
        />
        {inputText.length > 0 && (
          <View style={styles.inputActions}>
            <Pressable style={styles.inputAction} onPress={() => setInputText('')}>
              <X size={18} color={colors.textTertiary} />
            </Pressable>
            <Text style={styles.charCount}>{inputText.length}/500</Text>
          </View>
        )}
      </View>

      <Pressable style={styles.swapButton} onPress={handleSwapLanguages}>
        <ArrowLeftRight size={20} color={colors.primary} />
      </Pressable>

      <View style={[styles.outputCard, !translatedText && styles.outputCardEmpty]}>
        <View style={styles.inputHeader}>
          <Pressable style={styles.languageButton} onPress={() => setShowLanguagePicker('target')}>
            <Text style={styles.languageButtonFlag}>{targetLanguage.flag}</Text>
            <Text style={styles.languageButtonText}>{targetLanguage.name}</Text>
            <ChevronDown size={16} color={colors.textSecondary} />
          </Pressable>
        </View>
        {isTranslating ? (
          <View style={styles.translatingContainer}>
            <RefreshCw size={24} color={colors.primary} />
            <Text style={styles.translatingText}>Translating...</Text>
          </View>
        ) : translatedText ? (
          <>
            <Text style={styles.translatedText}>{translatedText}</Text>
            <View style={styles.outputActions}>
              <Pressable style={styles.outputAction} onPress={() => handleCopy(translatedText)}>
                {copied ? (
                  <Check size={18} color={colors.success} />
                ) : (
                  <Copy size={18} color={colors.primary} />
                )}
                <Text style={[styles.outputActionText, copied && { color: colors.success }]}>
                  {copied ? 'Copied!' : 'Copy'}
                </Text>
              </Pressable>
              <Pressable style={styles.outputAction} onPress={() => handleSpeak(translatedText)}>
                <Volume2 size={18} color={colors.primary} />
                <Text style={styles.outputActionText}>Speak</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Text style={styles.placeholderText}>Translation will appear here</Text>
        )}
      </View>

      <Pressable
        style={[styles.translateButton, !inputText.trim() && styles.translateButtonDisabled]}
        onPress={handleTranslate}
        disabled={!inputText.trim() || isTranslating}
      >
        <LinearGradient
          colors={
            inputText.trim()
              ? [colors.primary, colors.primaryLight]
              : [colors.border, colors.border]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.translateButtonGradient}
        >
          <Languages size={20} color={colors.textLight} />
          <Text style={styles.translateButtonText}>Translate</Text>
        </LinearGradient>
      </Pressable>
    </ScrollView>
  );

  const renderCameraMode = () => {
    if (!permission?.granted) {
      return (
        <View style={styles.cameraPermission}>
          <Camera size={64} color={colors.textTertiary} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Allow camera access to translate signs, menus, and text in real-time
          </Text>
          <Pressable style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        {Platform.OS !== 'web' ? (
          <CameraView style={styles.camera} facing="back">
            <View style={styles.cameraOverlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.scanCorner, styles.scanCornerTL]} />
                <View style={[styles.scanCorner, styles.scanCornerTR]} />
                <View style={[styles.scanCorner, styles.scanCornerBL]} />
                <View style={[styles.scanCorner, styles.scanCornerBR]} />
                {cameraScanning && (
                  <Animated.View
                    style={[styles.scanningIndicator, { transform: [{ scale: pulseAnim }] }]}
                  >
                    <Scan size={32} color={colors.secondary} />
                  </Animated.View>
                )}
              </View>
              <Text style={styles.cameraHint}>
                {cameraScanning ? 'Scanning...' : 'Point camera at text to translate'}
              </Text>
            </View>
          </CameraView>
        ) : (
          <View style={styles.webCameraPlaceholder}>
            <Camera size={64} color={colors.textTertiary} />
            <Text style={styles.webCameraText}>
              Camera translation is available on mobile devices
            </Text>
          </View>
        )}

        <View style={styles.cameraControls}>
          <View style={styles.cameraLanguageRow}>
            <Pressable
              style={styles.cameraLanguageButton}
              onPress={() => setShowLanguagePicker('source')}
            >
              <Text style={styles.cameraLanguageFlag}>{sourceLanguage.flag}</Text>
              <Text style={styles.cameraLanguageText}>{sourceLanguage.name}</Text>
            </Pressable>
            <ArrowLeftRight size={20} color={colors.textSecondary} />
            <Pressable
              style={styles.cameraLanguageButton}
              onPress={() => setShowLanguagePicker('target')}
            >
              <Text style={styles.cameraLanguageFlag}>{targetLanguage.flag}</Text>
              <Text style={styles.cameraLanguageText}>{targetLanguage.name}</Text>
            </Pressable>
          </View>

          {detectedText && (
            <View style={styles.detectedTextCard}>
              <Text style={styles.detectedLabel}>Detected Text</Text>
              <Text style={styles.detectedTextContent}>{detectedText}</Text>
              <View style={styles.detectedDivider} />
              <Text style={styles.translatedLabel}>Translation</Text>
              <Text style={styles.translatedTextContent}>{translatedText}</Text>
              <View style={styles.detectedActions}>
                <Pressable style={styles.detectedAction} onPress={() => handleCopy(translatedText)}>
                  <Copy size={16} color={colors.primary} />
                  <Text style={styles.detectedActionText}>Copy</Text>
                </Pressable>
                <Pressable
                  style={styles.detectedAction}
                  onPress={() => handleSpeak(translatedText)}
                >
                  <Volume2 size={16} color={colors.primary} />
                  <Text style={styles.detectedActionText}>Speak</Text>
                </Pressable>
              </View>
            </View>
          )}

          <Pressable
            style={[styles.captureButton, cameraScanning && styles.captureButtonScanning]}
            onPress={handleCameraCapture}
            disabled={cameraScanning}
          >
            <View style={styles.captureButtonInner}>
              <Scan size={28} color={colors.textLight} />
            </View>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderConversationMode = () => (
    <View style={styles.conversationContainer}>
      <View style={styles.conversationHeader}>
        <Pressable
          style={[styles.conversationSide, isUserTurn && styles.conversationSideActive]}
          onPress={() => setIsUserTurn(true)}
        >
          <Text style={styles.conversationSideFlag}>{sourceLanguage.flag}</Text>
          <Text
            style={[styles.conversationSideText, isUserTurn && styles.conversationSideTextActive]}
          >
            {sourceLanguage.name}
          </Text>
        </Pressable>
        <View style={styles.conversationDivider}>
          <MessageSquare size={20} color={colors.textTertiary} />
        </View>
        <Pressable
          style={[styles.conversationSide, !isUserTurn && styles.conversationSideActive]}
          onPress={() => setIsUserTurn(false)}
        >
          <Text style={styles.conversationSideFlag}>{targetLanguage.flag}</Text>
          <Text
            style={[styles.conversationSideText, !isUserTurn && styles.conversationSideTextActive]}
          >
            {targetLanguage.name}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.conversationMessages}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.conversationMessagesContent}
      >
        {conversationMessages.length === 0 ? (
          <View style={styles.conversationEmpty}>
            <MessageSquare size={48} color={colors.textTertiary} />
            <Text style={styles.conversationEmptyTitle}>Start a Conversation</Text>
            <Text style={styles.conversationEmptyText}>
              Tap the speaker icon to switch between languages and have a real-time translated
              conversation
            </Text>
          </View>
        ) : (
          conversationMessages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.isUser ? styles.messageBubbleUser : styles.messageBubbleOther,
              ]}
            >
              <View style={styles.messageHeader}>
                <Text style={styles.messageFlag}>{msg.language.flag}</Text>
                <Text style={styles.messageLanguage}>{msg.language.name}</Text>
              </View>
              <Text style={[styles.messageOriginal, !msg.isUser && styles.messageOriginalOther]}>
                {msg.text}
              </Text>
              <View style={styles.messageTranslation}>
                <Text style={styles.messageTranslationText}>{msg.translatedText}</Text>
              </View>
              <Pressable
                style={styles.messageSpeakButton}
                onPress={() => handleSpeak(msg.translatedText)}
              >
                <Volume2
                  size={14}
                  color={msg.isUser ? colors.primaryLight : colors.textSecondary}
                />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.conversationInputContainer}>
        <View
          style={[
            styles.conversationInputWrapper,
            isUserTurn ? styles.conversationInputUser : styles.conversationInputOther,
          ]}
        >
          <Text style={styles.conversationInputFlag}>
            {isUserTurn ? sourceLanguage.flag : targetLanguage.flag}
          </Text>
          <TextInput
            style={styles.conversationInput}
            placeholder={`Speak in ${isUserTurn ? sourceLanguage.name : targetLanguage.name}...`}
            placeholderTextColor={colors.textTertiary}
            value={conversationInput}
            onChangeText={setConversationInput}
          />
          <Pressable style={styles.micButton}>
            <Mic size={20} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            style={[styles.sendButton, !conversationInput.trim() && styles.sendButtonDisabled]}
            onPress={handleConversationSend}
            disabled={!conversationInput.trim()}
          >
            <Send
              size={18}
              color={conversationInput.trim() ? colors.textLight : colors.textTertiary}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );

  const renderHistory = () => (
    <View style={styles.historyOverlay}>
      <View style={styles.historyContainer}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Translation History</Text>
          <View style={styles.historyActions}>
            {history.length > 0 && (
              <Pressable onPress={clearHistory} style={styles.historyAction}>
                <Trash2 size={20} color={colors.error} />
              </Pressable>
            )}
            <Pressable onPress={() => setShowHistory(false)} style={styles.historyAction}>
              <X size={24} color={colors.text} />
            </Pressable>
          </View>
        </View>
        <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
          {history.length === 0 ? (
            <View style={styles.historyEmpty}>
              <History size={48} color={colors.textTertiary} />
              <Text style={styles.historyEmptyText}>No translation history yet</Text>
            </View>
          ) : (
            history.map((item) => (
              <Pressable
                key={item.id}
                style={styles.historyItem}
                onPress={() => {
                  setInputText(item.sourceText);
                  setTranslatedText(item.translatedText);
                  setSourceLanguage(item.sourceLanguage);
                  setTargetLanguage(item.targetLanguage);
                  setShowHistory(false);
                  setMode('text');
                }}
              >
                <View style={styles.historyItemHeader}>
                  <View style={styles.historyLanguages}>
                    <Text style={styles.historyFlag}>{item.sourceLanguage.flag}</Text>
                    <ArrowLeftRight size={12} color={colors.textTertiary} />
                    <Text style={styles.historyFlag}>{item.targetLanguage.flag}</Text>
                  </View>
                  <View
                    style={[
                      styles.historyModeBadge,
                      item.mode === 'camera' && styles.historyModeBadgeCamera,
                    ]}
                  >
                    {item.mode === 'camera' ? (
                      <Camera size={10} color={colors.secondary} />
                    ) : (
                      <Type size={10} color={colors.primary} />
                    )}
                  </View>
                </View>
                <Text style={styles.historySource} numberOfLines={1}>
                  {item.sourceText}
                </Text>
                <Text style={styles.historyTranslated} numberOfLines={1}>
                  {item.translatedText}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.headerGradient}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.textLight} />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Languages size={24} color={colors.textLight} />
            <Text style={styles.headerTitle}>Live Translation</Text>
          </View>
          <Pressable style={styles.historyButton} onPress={() => setShowHistory(true)}>
            <History size={22} color={colors.textLight} />
          </Pressable>
        </View>

        <View style={styles.modeSelector}>
          <Pressable
            style={[styles.modeTab, mode === 'text' && styles.modeTabActive]}
            onPress={() => setMode('text')}
          >
            <Type size={18} color={mode === 'text' ? colors.primary : colors.textLight} />
            <Text style={[styles.modeTabText, mode === 'text' && styles.modeTabTextActive]}>
              Text
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeTab, mode === 'camera' && styles.modeTabActive]}
            onPress={() => setMode('camera')}
          >
            <Camera size={18} color={mode === 'camera' ? colors.primary : colors.textLight} />
            <Text style={[styles.modeTabText, mode === 'camera' && styles.modeTabTextActive]}>
              Camera
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeTab, mode === 'conversation' && styles.modeTabActive]}
            onPress={() => setMode('conversation')}
          >
            <MessageSquare
              size={18}
              color={mode === 'conversation' ? colors.primary : colors.textLight}
            />
            <Text style={[styles.modeTabText, mode === 'conversation' && styles.modeTabTextActive]}>
              Conversation
            </Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          {mode === 'text' && renderTextMode()}
          {mode === 'camera' && renderCameraMode()}
          {mode === 'conversation' && renderConversationMode()}
        </View>
      </SafeAreaView>

      {showLanguagePicker && renderLanguagePicker()}
      {showHistory && renderHistory()}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textLight,
  },
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderRadius: 12,
  },
  modeTabActive: {
    backgroundColor: colors.surface,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  modeTabTextActive: {
    color: colors.primary,
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  modeContent: {
    flex: 1,
  },
  textModeContent: {
    padding: 16,
  },
  inputCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    minHeight: 150,
  },
  inputHeader: {
    marginBottom: 12,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  languageButtonFlag: {
    fontSize: 18,
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  textInput: {
    fontSize: 18,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  inputAction: {
    padding: 4,
  },
  charCount: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  swapButton: {
    alignSelf: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: -16,
    zIndex: 10,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 3,
    borderColor: colors.background,
  },
  outputCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    minHeight: 150,
  },
  outputCardEmpty: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  translatingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  translatingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  translatedText: {
    fontSize: 18,
    color: colors.text,
    lineHeight: 26,
  },
  placeholderText: {
    fontSize: 16,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 24,
  },
  outputActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  outputAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
  },
  outputActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  translateButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  translateButtonDisabled: {
    opacity: 0.6,
  },
  translateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  translateButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textLight,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scanFrame: {
    width: width - 80,
    height: 200,
    borderWidth: 0,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.secondary,
    borderWidth: 3,
  },
  scanCornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  scanCornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  scanCornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  scanCornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  scanningIndicator: {
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 50,
  },
  cameraHint: {
    marginTop: 24,
    fontSize: 16,
    color: colors.textLight,
    fontWeight: '500',
  },
  webCameraPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    gap: 16,
    padding: 40,
  },
  webCameraText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cameraControls: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },
  cameraLanguageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  cameraLanguageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
  },
  cameraLanguageFlag: {
    fontSize: 18,
  },
  cameraLanguageText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  detectedTextCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 16,
  },
  detectedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detectedTextContent: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  detectedDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  translatedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  translatedTextContent: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600',
  },
  detectedActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  detectedAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detectedActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
  },
  captureButton: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  captureButtonScanning: {
    backgroundColor: colors.secondary,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cameraPermission: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
  conversationContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  conversationSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  conversationSideActive: {
    backgroundColor: colors.accent,
  },
  conversationSideFlag: {
    fontSize: 20,
  },
  conversationSideText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  conversationSideTextActive: {
    color: colors.primary,
  },
  conversationDivider: {
    paddingHorizontal: 12,
  },
  conversationMessages: {
    flex: 1,
  },
  conversationMessagesContent: {
    padding: 16,
    gap: 12,
  },
  conversationEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  conversationEmptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  conversationEmptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 18,
    position: 'relative',
  },
  messageBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceSecondary,
    borderBottomLeftRadius: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  messageFlag: {
    fontSize: 14,
  },
  messageLanguage: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  messageOriginal: {
    fontSize: 16,
    color: colors.textLight,
    fontWeight: '500',
  },
  messageOriginalOther: {
    color: colors.text,
  },
  messageTranslation: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  messageTranslationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontStyle: 'italic',
  },
  messageSpeakButton: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    padding: 4,
  },
  conversationInputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  conversationInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  conversationInputUser: {
    borderColor: colors.primary,
  },
  conversationInputOther: {
    borderColor: colors.secondary,
  },
  conversationInputFlag: {
    fontSize: 20,
  },
  conversationInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 8,
  },
  micButton: {
    padding: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  languagePickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  languagePickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  languagePickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.7,
  },
  languagePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  languagePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  languageList: {
    padding: 16,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  languageItemSelected: {
    backgroundColor: colors.accent,
  },
  languageFlag: {
    fontSize: 28,
    marginRight: 14,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  languageNameSelected: {
    color: colors.primary,
  },
  languageNative: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  historyContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.8,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  historyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyAction: {
    padding: 4,
  },
  historyList: {
    padding: 16,
  },
  historyEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  historyEmptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  historyItem: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyLanguages: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyFlag: {
    fontSize: 18,
  },
  historyModeBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyModeBadgeCamera: {
    backgroundColor: `${colors.secondary}20`,
  },
  historySource: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  historyTranslated: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
});
