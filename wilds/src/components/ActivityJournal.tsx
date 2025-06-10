import { useState, useEffect } from 'react';
import type { AppState } from '../types';
import { removePairedClicks } from '../utils/mergeUtils';
import '../styles/ActivityJournal.css';

interface ActivityJournalProps {
  appState: AppState;
  onClose: () => void;
}

interface JournalEntry {
  timestamp: number;
  date: string;
  screenName: string;
  buttonName: string;
  action: 'increment' | 'decrement';
}

export default function ActivityJournal({ appState, onClose }: ActivityJournalProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null
  });

  useEffect(() => {
    const journalEntries: JournalEntry[] = [];

    // Process all screens and buttons to extract click records
    appState.screens.forEach(screen => {
      screen.buttons.forEach(button => {
        if (button.clicks && button.clicks.length > 0) {
          // Process clicks for this button to remove paired increment/decrement pairs
          const processedClicks = removePairedClicks(button.clicks);

          // Create journal entries only for unpaired clicks
          processedClicks.forEach((click) => {
            journalEntries.push({
              timestamp: click.timestamp,
              date: click.date,
              screenName: screen.name,
              buttonName: button.text,
              action: 'increment' // Only increments remain after pairing
            });
          });
        }
      });
    });

    // Sort by timestamp, newest first
    journalEntries.sort((a, b) => b.timestamp - a.timestamp);
    setEntries(journalEntries);
  }, [appState]);

  // Filter entries based on date range (no need for action filter since only increments remain)
  const filteredEntries = entries.filter(entry => {
    // Filter by date range if set
    if (dateRange.start && new Date(entry.date) < new Date(dateRange.start)) {
      return false;
    }
    if (dateRange.end && new Date(entry.date) > new Date(dateRange.end)) {
      return false;
    }

    return true;
  });

  // Get unique dates for the date picker
  const uniqueDates = [...new Set(entries.map(entry => entry.date))].sort();

  // Format date for display
  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  // Format time for display
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="journal-overlay">
      <div className="journal-modal">
        <header className="journal-header">
          <h2>Activity Journal</h2>
          <button className="journal-close-button" onClick={onClose}>×</button>
        </header>

        <div className="journal-filters">
          <div className="journal-filter-group">
            <label htmlFor="date-start">Start date:</label>
            <select
              id="date-start"
              value={dateRange.start || ''}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value || null })}
              className="journal-filter-select"
            >
              <option value="">All Time</option>
              {uniqueDates.map(date => (
                <option key={date} value={date}>{formatDate(date)}</option>
              ))}
            </select>
          </div>

          <div className="journal-filter-group">
            <label htmlFor="date-end">End date:</label>
            <select
              id="date-end"
              value={dateRange.end || ''}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value || null })}
              className="journal-filter-select"
            >
              <option value="">Current</option>
              {uniqueDates.map(date => (
                <option key={date} value={date}>{formatDate(date)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="journal-content">
          {filteredEntries.length > 0 ? (
            <ul className="journal-entries">
              {filteredEntries.map((entry, index) => (
                <li key={index} className="journal-entry">
                  <div className="journal-entry-header">
                    <span className="journal-entry-time">{formatTime(entry.timestamp)}</span>
                    <span className="journal-entry-date">{formatDate(entry.date)}</span>
                  </div>
                  <div className="journal-entry-body">
                    <div className="journal-entry-action">
                      <span className="journal-action-increment">+1</span>
                    </div>
                    <div className="journal-entry-details">
                      <span className="journal-entry-button">{entry.buttonName}</span>
                      <span className="journal-entry-screen">{entry.screenName}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="journal-empty">
              <p>No activity records found matching your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}