import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Alert,
  View,
  TouchableOpacity,
  Text,
  TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppButton, Colors } from '../components/UI';
import { useAuth } from '../AuthContext';
import Config from '../Config';
import Icons from 'react-native-vector-icons/Ionicons';

const NoteCreateScreen = ({ route, navigation }: any) => {
  const { user } = useAuth();
  const { refresh, socket } = route.params;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteDate, setNoteDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const contentRef = useRef<TextInput>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  useEffect(() => { navigation.setOptions({ title: 'New Note' }); }, []);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  // ── Formatting helpers ─────
  const wrapSelection = (prefix: string, suffix: string) => {
    const { start, end } = selection;
    const selected = content.slice(start, end);
    const newContent =
      content.slice(0, start) + prefix + selected + suffix + content.slice(end);
    setContent(newContent);
  };



  const handleSave = () => {
    if (!title.trim()) { Alert.alert('Validation Error', 'Title is required'); return; }

    fetch(`${Config.settings.serverPath}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        user_id: user?.id,
        title: title.trim(),
        content: content.trim(),
        note_date: formatDate(noteDate),
      }),
    })
      .then((r) => { if (!r.ok) throw new Error('Failed to create note'); return r.json(); })
      .then((data) => {
        if (socket) socket.emit('note_created', data);
        Alert.alert('Success', 'Note created!');
        refresh();
        navigation.goBack();
      })
      .catch((e) => Alert.alert('Error', e.message));
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Title */}
      <View style={styles.section}>
        <Text style={styles.fieldLabel}>TITLE</Text>
        <TextInput
          style={styles.titleInput}
          placeholder="Note title…"
          placeholderTextColor={Colors.textMuted}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      {/* Date */}
      <View style={styles.section}>
        <Text style={styles.fieldLabel}>DATE</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
          <Icons name="calendar-outline" size={16} color={Colors.primary} />
          <Text style={styles.dateBtnText}>{formatDate(noteDate)}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={noteDate}
            mode="date"
            display="default"
            onChange={(_, d) => { setShowDatePicker(false); if (d) setNoteDate(d); }}
          />
        )}
      </View>

      {/* Content*/}
      <View style={styles.section}>
        <Text style={styles.fieldLabel}>CONTENT</Text>
        <TextInput
          ref={contentRef}
          style={styles.contentInput}
          placeholder="Start writing…"
          placeholderTextColor={Colors.textMuted}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
        />
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <AppButton title="Cancel" onPress={() => navigation.goBack()} theme="danger" style={styles.halfBtn} />
        <AppButton title="Save Note" onPress={handleSave} style={styles.halfBtn} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    padding: 16,
  },
  section: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.9,
    marginBottom: 7,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateBtnText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  contentInput: {
    minHeight: 220,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: Colors.surface,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 40,
  },
  halfBtn: { flex: 1 },
});

export default NoteCreateScreen;
