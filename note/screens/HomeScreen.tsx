import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  Text,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { FloatingAction } from 'react-native-floating-action';
import Icons from 'react-native-vector-icons/Ionicons';
import { NoteCard, Colors } from '../components/UI';
import { useAuth } from '../AuthContext';
import Config from '../Config';
import io from 'socket.io-client';

type SortOption = 'date_created' | 'date_modified' | 'alphabetical';

const HomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date_created');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadNotes = useCallback(() => {
    if (!user) return;
    setIsFetching(true);
    fetch(`${Config.settings.serverPath}/api/notes/${user.id}`)
      .then((r) => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
      .then((data) => { setNotes(data); setIsFetching(false); })
      .catch((e) => { console.error(e); setIsFetching(false); });
  }, [user]);

  useEffect(() => {
    loadNotes();
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [loadNotes]);

  useEffect(() => {
    const newSocket = io(`${Config.settings.wsPath}/notes`, { transports: ['websocket'] });
    newSocket.on('connect', () => newSocket.emit('client_connected', { username: user?.username }));
    newSocket.on('note_sync', (data: any) => { if (data.note?.user_id === user?.id) loadNotes(); });
    newSocket.on('error', console.error);
    setSocket(newSocket);
    return () => {newSocket.disconnect();};
  }, [user]);

  // ── Filter & Sort ──────────────────────────────────────────────────────────
  const filteredAndSorted = () => {
    let result = [...notes];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title?.toLowerCase().includes(q) ||
          n.content?.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'alphabetical':
        result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'date_modified':
        result.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
        break;
      case 'date_created':
      default:
        result.sort((a, b) => new Date(b.note_date || b.created_at || 0).getTime() - new Date(a.note_date || a.created_at || 0).getTime());
        break;
    }

    return result;
  };

  const sortLabels: Record<SortOption, string> = {
    date_created: 'Date Created',
    date_modified: 'Last Modified',
    alphabetical: 'A → Z',
  };

  const sortIcons: Record<SortOption, string> = {
    date_created: 'calendar-outline',
    date_modified: 'time-outline',
    alphabetical: 'text-outline',
  };

  const actions = [
    { text: 'Add Note', icon: require('../icons/add_icon.png'), name: 'add_note', position: 1, color: Colors.primary },
  ];

  const displayNotes = filteredAndSorted();

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icons name="document-text-outline" size={64} color={Colors.border} />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No notes match your search' : 'No notes yet'}
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery ? 'Try different keywords' : 'Tap the + button to create your first note'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Icons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes…"
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Sort Button */}
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => setShowSortMenu(!showSortMenu)}
          activeOpacity={0.75}
        >
          <Icons name={sortIcons[sortBy]} size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Sort Dropdown */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          {(['date_created', 'date_modified', 'alphabetical'] as SortOption[]).map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.sortMenuItem, sortBy === opt && styles.sortMenuItemActive]}
              onPress={() => { setSortBy(opt); setShowSortMenu(false); }}
            >
              <Icons
                name={sortIcons[opt]}
                size={16}
                color={sortBy === opt ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[styles.sortMenuText, sortBy === opt && styles.sortMenuTextActive]}>
                {sortLabels[opt]}
              </Text>
              {sortBy === opt && <Icons name="checkmark" size={16} color={Colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Notes count + sort label */}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          {displayNotes.length} {displayNotes.length === 1 ? 'note' : 'notes'}
        </Text>
        <Text style={styles.sortLabel}>↕ {sortLabels[sortBy]}</Text>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <FlatList
          data={displayNotes}
          renderItem={({ item }) => (
            <NoteCard
              title={item.title}
              note_date={item.note_date}
              content={item.content}
              onPress={() => navigation.navigate('NoteView', { noteId: item.id, refresh: loadNotes, socket })}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={loadNotes} colors={[Colors.primary]} />}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={displayNotes.length === 0 ? styles.emptyList : { paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>

      <FloatingAction
        actions={actions}
        color={Colors.primary}
        onPressItem={() => navigation.navigate('NoteCreate', { refresh: loadNotes, socket })}
        overlayColor="rgba(79, 70, 229, 0.12)"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  sortBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  sortMenu: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 100,
  },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sortMenuItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  sortMenuText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  sortMenuTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  statsText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sortLabel: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyList: { flexGrow: 1 },
});

export default HomeScreen;
