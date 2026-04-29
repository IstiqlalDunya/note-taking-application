import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  RefreshControl,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { NoteCard } from '../components/UI';
import { useAuth } from '../AuthContext';
import Config from '../Config';

const CalendarScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});

  const loadNotesByDate = useCallback(
    (date: string) => {
      if (!user) return;

      setIsFetching(true);
      fetch(
        `${Config.settings.serverPath}/api/notes/${user.id}?date=${date}`
      )
        .then((response) => {
          if (!response.ok) throw new Error('Failed to fetch notes');
          return response.json();
        })
        .then((data) => {
          setNotes(data);
          setIsFetching(false);
        })
        .catch((error) => {
          console.error(error);
          setIsFetching(false);
        });
    },
    [user]
  );

  const loadAllDates = useCallback(() => {
    if (!user) return;

    fetch(`${Config.settings.serverPath}/api/notes/${user.id}`)
      .then((response) => response.json())
      .then((data) => {
        const marked: any = {};
        data.forEach((note: any) => {
          marked[note.note_date] = {
            marked: true,
            dotColor: '#6200ee',
          };
        });
        if (selectedDate) {
          marked[selectedDate] = {
            ...marked[selectedDate],
            selected: true,
            selectedColor: '#6200ee',
          };
        }
        setMarkedDates(marked);
      })
      .catch((error) => console.error(error));
  }, [user, selectedDate]);

  useEffect(() => {
    loadAllDates();
  }, [loadAllDates]);

  useEffect(() => {
    loadNotesByDate(selectedDate);
  }, [selectedDate, loadNotesByDate]);

  const handleDateSelect = (date: any) => {
    setSelectedDate(date.dateString);
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        No notes for {selectedDate}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={handleDateSelect}
        markedDates={markedDates}
        theme={{
          selectedDayBackgroundColor: '#6200ee',
          todayTextColor: '#6200ee',
          arrowColor: '#6200ee',
        }}
        style={styles.calendar}
      />
      <View style={styles.notesSection}>
        <Text style={styles.sectionTitle}>
          Notes for {selectedDate}
        </Text>
        <FlatList
          data={notes}
          renderItem={({ item }) => (
            <NoteCard
              title={item.title}
              note_date={item.note_date}
              content={item.content}
              onPress={() =>
                navigation.navigate('NoteView', {
                  noteId: item.id,
                  refresh: () => loadNotesByDate(selectedDate),
                })
              }
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={() => loadNotesByDate(selectedDate)}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 10,
  },
  notesSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
  },
});

export default CalendarScreen;