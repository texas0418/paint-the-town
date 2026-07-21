// Paint the Town Multi-Currency - Currency Badge Component

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { CurrencyCode, Money } from '../types/currency';
import { CURRENCIES } from '../mocks/mockCurrencyData';

interface CurrencyBadgeProps {
  money: Money;
  showFlag?: boolean;
  showCode?: boolean;
  showConversion?: boolean;
  convertedAmount?: number;
  convertedCurrency?: CurrencyCode;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'positive' | 'negative' | 'muted';
  compact?: boolean;
  onPress?: () => void;
}

const CurrencyBadge: React.FC<CurrencyBadgeProps> = ({
  money,
  showFlag = true,
  showCode = false,
  showConversion = false,
  convertedAmount,
  convertedCurrency,
  size = 'medium',
  variant = 'default',
  compact = false,
  onPress,
}) => {
  const currency = CURRENCIES.find(c => c.code === money.currency);
  
  const formatAmount = (amount: number, code: CurrencyCode): string => {
    const curr = CURRENCIES.find(c => c.code === code);
    if (!curr) return `${amount.toFixed(2)} ${code}`;
    
    let formatted: string;
    
    if (compact && Math.abs(amount) >= 1000) {
      if (Math.abs(amount) >= 1000000000) {
        formatted = (amount / 1000000000).toFixed(1) + 'B';
      } else if (Math.abs(amount) >= 1000000) {
        formatted = (amount / 1000000).toFixed(1) + 'M';
      } else {
        formatted = (amount / 1000).toFixed(1) + 'K';
      }
    } else {
      formatted = amount.toLocaleString('en-US', {
        minimumFractionDigits: curr.decimalPlaces,
        maximumFractionDigits: curr.decimalPlaces,
      });
    }
    
    if (curr.symbolPosition === 'before') {
      return `${curr.symbol}${formatted}`;
    } else {
      return `${formatted}${curr.symbol}`;
    }
  };

  const sizeStyles = {
    small: {
      container: styles.containerSmall,
      flag: styles.flagSmall,
      amount: styles.amountSmall,
      code: styles.codeSmall,
      converted: styles.convertedSmall,
    },
    medium: {
      container: styles.containerMedium,
      flag: styles.flagMedium,
      amount: styles.amountMedium,
      code: styles.codeMedium,
      converted: styles.convertedMedium,
    },
    large: {
      container: styles.containerLarge,
      flag: styles.flagLarge,
      amount: styles.amountLarge,
      code: styles.codeLarge,
      converted: styles.convertedLarge,
    },
  };

  const variantStyles = {
    default: {
      amount: styles.amountDefault,
    },
    positive: {
      amount: styles.amountPositive,
    },
    negative: {
      amount: styles.amountNegative,
    },
    muted: {
      amount: styles.amountMuted,
    },
  };

  const content = (
    <View style={[styles.container, sizeStyles[size].container]}>
      <View style={styles.mainAmount}>
        {showFlag && currency && (
          <Text style={sizeStyles[size].flag}>{currency.flag}</Text>
        )}
        <Text style={[
          styles.amount,
          sizeStyles[size].amount,
          variantStyles[variant].amount,
        ]}>
          {formatAmount(money.amount, money.currency)}
        </Text>
        {showCode && (
          <Text style={[styles.code, sizeStyles[size].code]}>
            {money.currency}
          </Text>
        )}
      </View>
      
      {showConversion && convertedAmount !== undefined && convertedCurrency && (
        <Text style={[styles.converted, sizeStyles[size].converted]}>
          ≈ {formatAmount(convertedAmount, convertedCurrency)}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  containerSmall: {},
  containerMedium: {},
  containerLarge: {},
  mainAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amount: {
    fontWeight: '600',
  },
  amountDefault: {
    color: '#1a1a1a',
  },
  amountPositive: {
    color: '#34C759',
  },
  amountNegative: {
    color: '#FF3B30',
  },
  amountMuted: {
    color: '#888',
  },
  // Small size
  flagSmall: {
    fontSize: 14,
    marginRight: 4,
  },
  amountSmall: {
    fontSize: 14,
  },
  codeSmall: {
    fontSize: 11,
    color: '#888',
    marginLeft: 4,
  },
  convertedSmall: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
  },
  // Medium size
  flagMedium: {
    fontSize: 16,
    marginRight: 6,
  },
  amountMedium: {
    fontSize: 16,
  },
  codeMedium: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
  convertedMedium: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  // Large size
  flagLarge: {
    fontSize: 24,
    marginRight: 8,
  },
  amountLarge: {
    fontSize: 28,
  },
  codeLarge: {
    fontSize: 14,
    color: '#888',
    marginLeft: 6,
  },
  convertedLarge: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  code: {
    fontWeight: '500',
  },
  converted: {},
});

export default CurrencyBadge;
