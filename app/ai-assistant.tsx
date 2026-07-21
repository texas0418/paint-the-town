import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  Send,
  Bot,
  User,
  MapPin,
  Languages,
  Lightbulb,
  Utensils,
  Plane,
  HelpCircle,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import React from 'react';

// =============================================================================
// AI INTEGRATION GUIDE
// =============================================================================
// This file has been modified to work without the Rork AI SDK.
// To add your own AI integration:
//
// 1. OpenAI Integration:
//    - Install: npm install openai
//    - Add your API key to environment variables
//    - Replace the sendMessageToAI function below
//
// 2. Anthropic/Claude Integration:
//    - Install: npm install @anthropic-ai/sdk
//    - Add your API key to environment variables
//    - Replace the sendMessageToAI function below
//
// 3. Custom Backend:
//    - Create an API endpoint that handles chat messages
//    - Update sendMessageToAI to call your endpoint
//
// Example OpenAI integration (uncomment and configure):
// import OpenAI from 'openai';
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// =============================================================================

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuickPrompt {
  id: string;
  icon: React.ReactNode;
  label: string;
  prompt: string;
}

const quickPrompts: QuickPrompt[] = [
  {
    id: 'destination',
    icon: <MapPin size={18} color={colors.primary} />,
    label: 'Find destinations',
    prompt: 'What are the best travel destinations for someone who loves ',
  },
  {
    id: 'translate',
    icon: <Languages size={18} color={colors.secondary} />,
    label: 'Translate phrase',
    prompt: 'How do I say the following in ',
  },
  {
    id: 'tips',
    icon: <Lightbulb size={18} color={colors.warning} />,
    label: 'Travel tips',
    prompt: 'What are the top travel tips for visiting ',
  },
  {
    id: 'food',
    icon: <Utensils size={18} color={colors.success} />,
    label: 'Local cuisine',
    prompt: 'What are must-try local foods in ',
  },
  {
    id: 'itinerary',
    icon: <Plane size={18} color={colors.accentDark} />,
    label: 'Quick itinerary',
    prompt: 'Create a 3-day itinerary for ',
  },
  {
    id: 'help',
    icon: <HelpCircle size={18} color={colors.textSecondary} />,
    label: 'General help',
    prompt: 'I need help with ',
  },
];

// Placeholder AI response function - Replace with your preferred AI service
async function sendMessageToAI(
  message: string,
  conversationHistory: Message[],
  userContext: { name: string; travelStyle: string; budgetRange: string }
): Promise<string> {
  // ==========================================================================
  // TODO: Replace this with your AI integration
  // ==========================================================================

  // Example: OpenAI integration
  // const response = await openai.chat.completions.create({
  //   model: "gpt-4",
  //   messages: [
  //     {
  //       role: "system",
  //       content: `You are a friendly travel assistant. The user's name is ${userContext.name}.`
  //     },
  //     ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
  //     { role: "user", content: message }
  //   ],
  // });
  // return response.choices[0].message.content;

  // Placeholder response for demo purposes
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay

  const responses = [
    `Great question! I'd love to help you with that. Since you prefer a ${userContext.budgetRange} budget and ${userContext.travelStyle} travel style, here are some thoughts...\n\n**Note:** This is a placeholder response. To enable real AI responses, integrate your preferred AI service (OpenAI, Anthropic, etc.) in the \`sendMessageToAI\` function in \`app/ai-assistant.tsx\`.`,
    `That's an interesting travel topic! Let me think about this...\n\n**Setup Required:** This demo response is a placeholder. Edit \`app/ai-assistant.tsx\` to connect your own AI API for personalized travel recommendations.`,
    `I understand you're looking for travel advice. Based on your preferences...\n\n**Coming Soon:** Replace the placeholder \`sendMessageToAI\` function with your AI provider of choice to get real recommendations!`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

export default function AIAssistantScreen() {
  const { user } = useApp();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await sendMessageToAI(userMessage.content, messages, {
        name: user.name,
        travelStyle: user.travelStyle,
        budgetRange: user.budgetRange,
      });

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content:
          'Sorry, I encountered an error. Please check your AI integration configuration and try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [input, isLoading, messages, user]);

  const handleQuickPrompt = useCallback((prompt: string) => {
    setInput(prompt);
  }, []);

  const renderMessage = useCallback((message: Message) => {
    const isUser = message.role === 'user';

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        {!isUser && (
          <View style={styles.avatarContainer}>
            <View style={styles.botAvatar}>
              <Bot size={18} color={colors.textLight} />
            </View>
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {message.content}
          </Text>
        </View>
        {isUser && (
          <View style={styles.avatarContainer}>
            <View style={styles.userAvatar}>
              <User size={18} color={colors.textLight} />
            </View>
          </View>
        )}
      </View>
    );
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'AI Travel Assistant',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.textLight,
          headerTitleStyle: { fontWeight: '600' },
        }}
      />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeIconContainer}>
                <Bot size={48} color={colors.primary} />
              </View>
              <Text style={styles.welcomeTitle}>Hi {user.name}! 👋</Text>
              <Text style={styles.welcomeSubtitle}>
                I&apos;m your AI travel assistant. Ask me anything about destinations, translations,
                local tips, or help planning your next adventure!
              </Text>

              <Text style={styles.quickPromptsTitle}>Quick Actions</Text>
              <View style={styles.quickPromptsGrid}>
                {quickPrompts.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.quickPromptCard}
                    onPress={() => handleQuickPrompt(item.prompt)}
                  >
                    <View style={styles.quickPromptIcon}>{item.icon}</View>
                    <Text style={styles.quickPromptLabel}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            messages.map(renderMessage)
          )}

          {isLoading && messages.length > 0 && (
            <View style={[styles.messageContainer, styles.assistantMessageContainer]}>
              <View style={styles.avatarContainer}>
                <View style={styles.botAvatar}>
                  <Bot size={18} color={colors.textLight} />
                </View>
              </View>
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <View style={styles.typingIndicator}>
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={styles.inputSafeArea}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask me anything about travel..."
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={1000}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              editable={!isLoading}
            />
            <Pressable
              style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.textLight} />
              ) : (
                <Send size={20} color={colors.textLight} />
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  welcomeIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  quickPromptsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  quickPromptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  quickPromptCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  quickPromptIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickPromptLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginHorizontal: 8,
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '70%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: colors.textLight,
  },
  assistantText: {
    color: colors.text,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textTertiary,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 0.8,
  },
  inputSafeArea: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingRight: 16,
    fontSize: 15,
    color: colors.text,
    maxHeight: 120,
    minHeight: 48,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
});
