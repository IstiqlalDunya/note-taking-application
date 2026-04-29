import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

// ─── Design Tokens ─────
export const Colors = {
  primary: '#4F46E5',
  primaryDark: '#3730A3',
  primaryLight: '#EEF2FF',
  accent: '#F59E0B',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  bg: '#F8F7FF',
  surface: '#FFFFFF',
  surfaceAlt: '#F3F4F6',
  border: '#E5E7EB',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
};

// ─── InputWithLabel ──────
export const InputWithLabel = (props: any) => {
  const orientationDirection = props.orientation === 'horizontal' ? 'row' : 'column';
  return (
    <View style={[inputStyles.container, { flexDirection: orientationDirection }]}>
      <Text style={[inputStyles.label, props.textLabelStyle]}>{props.label}</Text>
      <TextInput
        style={[inputStyles.input, props.textInputStyle, props.style]}
        placeholderTextColor={Colors.textMuted}
        {...props}
      />
    </View>
  );
};

// ─── AppButton ──────
export const AppButton = (props: any) => {
  let bg = Colors.primary;
  if (props.theme === 'success') bg = Colors.success;
  else if (props.theme === 'danger') bg = Colors.danger;
  else if (props.theme === 'warning') bg = Colors.warning;

  return (
    <TouchableOpacity
      onPress={props.onPress}
      activeOpacity={0.82}
      style={[buttonStyles.button, { backgroundColor: bg }, props.style]}
    >
      <Text style={buttonStyles.buttonText}>{props.title}</Text>
    </TouchableOpacity>
  );
};

// ─── NoteCard ─────
export const NoteCard = (props: any) => {
  const stripFormatting = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^• /gm, '')
      .trim();
  };

  const cleanPreview = stripFormatting(props.content);
  const dateStr = props.note_date ? String(props.note_date).split('T')[0] : '';

  const accents = ['#4F46E5', '#7C3AED', '#DB2777', '#059669', '#D97706'];
  const accentIdx = (props.title?.charCodeAt(0) || 0) % accents.length;
  const accent = accents[accentIdx];

  return (
    <TouchableOpacity onPress={props.onPress} activeOpacity={0.88} style={cardStyles.card}>
      <View style={[cardStyles.accentBar, { backgroundColor: accent }]} />
      <View style={cardStyles.cardContent}>
        <Text style={cardStyles.title} numberOfLines={1}>{props.title}</Text>
        <Text style={cardStyles.date}>{dateStr}</Text>
        {cleanPreview ? (
          <Text style={cardStyles.preview} numberOfLines={2}>{cleanPreview}</Text>
        ) : (
          <Text style={[cardStyles.preview, { fontStyle: 'italic' }]}>No content yet…</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};



// ─── FormattedText (for NoteView) ───────
type InlinePart = { text: string; bold: boolean; italic: boolean };

function parseInline(text: string): InlinePart[] {
  const result: InlinePart[] = [];
  const regex = /\*\*(.*?)\*\*|\*(.*?)\*/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) result.push({ text: text.slice(last, match.index), bold: false, italic: false });
    if (match[1] !== undefined) result.push({ text: match[1], bold: true, italic: false });
    else if (match[2] !== undefined) result.push({ text: match[2], bold: false, italic: true });
    last = regex.lastIndex;
  }
  if (last < text.length) result.push({ text: text.slice(last), bold: false, italic: false });
  return result.length > 0 ? result : [{ text, bold: false, italic: false }];
}

export const FormattedText = ({ content }: { content: string }) => {
  if (!content) return null;
  const lines = content.split('\n');
  return (
    <View>
      {lines.map((line, idx) => {
        const isBullet = line.startsWith('• ');
        const text = isBullet ? line.slice(2) : line;
        const parts = parseInline(text);
        return (
          <View key={idx} style={isBullet ? ftStyles.bulletRow : ftStyles.lineRow}>
            {isBullet && <Text style={ftStyles.bullet}>•</Text>}
            <Text style={ftStyles.line}>
              {parts.map((part, pi) => {
                if (part.bold) return <Text key={pi} style={ftStyles.bold}>{part.text}</Text>;
                if (part.italic) return <Text key={pi} style={ftStyles.italic}>{part.text}</Text>;
                return <Text key={pi}>{part.text}</Text>;
              })}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

// ─── Styles ───
const buttonStyles = StyleSheet.create({
  button: {
    marginVertical: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

const inputStyles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: Colors.surface,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    flexDirection: 'row',
    elevation: 3,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  accentBar: { width: 5 },
  cardContent: { flex: 1, padding: 14 },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  date: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 3,
    fontWeight: '500',
  },
  preview: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 7,
    lineHeight: 18,
  },
});

const toolbarStyles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
    gap: 6,
  },
  toolBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 1,
  },
  toolBtnBold: { fontSize: 15, fontWeight: '900', color: Colors.primary },
  toolBtnItalic: { fontSize: 15, fontStyle: 'italic', fontWeight: '700', color: Colors.primary },
  toolBtnText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  hintText: { fontSize: 10, color: Colors.textMuted, fontStyle: 'italic' },
});

const ftStyles = StyleSheet.create({
  lineRow: { marginBottom: 2 },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 16,
    color: Colors.primary,
    marginRight: 8,
    marginTop: 1,
    lineHeight: 22,
  },
  line: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
    flex: 1,
  },
  bold: { fontWeight: '800' },
  italic: { fontStyle: 'italic', color: Colors.textSecondary },
});
