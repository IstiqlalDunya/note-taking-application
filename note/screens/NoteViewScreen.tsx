import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Alert,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { FloatingAction } from 'react-native-floating-action';
import Icons from 'react-native-vector-icons/Ionicons';
import { FormattedText, Colors } from '../components/UI';
import Config from '../Config';

const NoteViewScreen = ({ route, navigation }: any) => {
  const { noteId, refresh, socket } = route.params;
  const [note, setNote] = useState<any>(null);

  useEffect(() => { loadNote(); }, [noteId]);

  const loadNote = () => {
    fetch(`${Config.settings.serverPath}/api/notes/detail/${noteId}`)
      .then((r) => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
      .then((data) => { setNote(data); navigation.setOptions({ title:  'Note' , headerTitleStyle: { fontSize: 24 } }); })
      .catch(console.error);
  };

  const handleDelete = () => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          fetch(`${Config.settings.serverPath}/api/notes/${noteId}`, { method: 'DELETE' })
            .then((r) => r.json())
            .then(() => {
              if (socket) socket.emit('note_deleted', { id: noteId });
              refresh();
              navigation.goBack();
            })
            .catch(console.error),
      },
    ]);
  };

  const actions = [
    { text: 'Edit', color: Colors.primary, icon: require('../icons/edit_icon.png'), name: 'edit', position: 2 },
    { text: 'Delete', color: Colors.danger, icon: require('../icons/delete_icon.png'), name: 'delete', position: 1 },
  ];

  if (!note) return (
    <View style={styles.loadingContainer}>
      <Icons name="document-text-outline" size={48} color={Colors.border} />
    </View>
  );

  const fmtDate = (d: string) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return d; }
  };

  const fmtDateTime = (d: string) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' }); }
    catch { return d; }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header card */}
        <View style={styles.headerCard}>
          <Text style={styles.noteTitle}>{note.title}</Text>
          <View style={styles.metaRow}>
            <Icons name="calendar-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>{fmtDate(note.note_date)}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentCard}>
          <Text style={styles.sectionLabel}>CONTENT</Text>
          {note.content ? (
            <FormattedText content={note.content} />
          ) : (
            <Text style={styles.emptyContent}>No content.</Text>
          )}
        </View>

        {/* Meta info */}
        <View style={styles.metaCard}>
          <View style={styles.metaItem}>
            <Icons name="time-outline" size={15} color={Colors.textMuted} />
            <View style={styles.metaItemText}>
              <Text style={styles.metaItemLabel}>Created</Text>
              <Text style={styles.metaItemValue}>{fmtDateTime(note.created_at)}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.metaItem}>
            <Icons name="create-outline" size={15} color={Colors.textMuted} />
            <View style={styles.metaItemText}>
              <Text style={styles.metaItemLabel}>Last Modified</Text>
              <Text style={styles.metaItemValue}>{fmtDateTime(note.updated_at)}</Text>
            </View>
          </View>
        </View>

        {/* Quick action buttons */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.primaryLight, borderColor: Colors.primary }]}
            onPress={() => navigation.navigate('NoteEdit', { noteId, refresh: () => { loadNote(); refresh(); }, socket })}
          >
            <Icons name="create-outline" size={20} color={Colors.primary} />
            <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#FEF2F2', borderColor: Colors.danger }]}
            onPress={handleDelete}
          >
            <Icons name="trash-outline" size={20} color={Colors.danger} />
            <Text style={[styles.actionBtnText, { color: Colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  headerCard: {
    backgroundColor: Colors.primary,
    padding: 24,
    paddingBottom: 28,
  },
  noteTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 32,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  contentCard: {
    backgroundColor: Colors.surface,
    margin: 16,
    borderRadius: 14,
    padding: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.9,
    marginBottom: 12,
  },
  emptyContent: {
    fontStyle: 'italic',
    color: Colors.textMuted,
    fontSize: 15,
  },
  metaCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  metaItemText: { flex: 1 },
  metaItemLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaItemValue: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  actionBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
});

export default NoteViewScreen;
