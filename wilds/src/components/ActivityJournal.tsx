import { useState, useEffect } from 'react';
import type { AppState, ButtonData, Screen, ClickRecord } from '../types';
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
  const [filter, setFilter] = useState<string>('all');
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
          // For each click, create a journal entry
          button.clicks.forEach((click) => {
            // Determine if this was an increment or decrement based on the isDecrement property
            const action = click.isDecrement ? 'decrement' : 'increment';
            
            journalEntries.push({
              timestamp: click.timestamp,
              date: click.date,
              screenName: screen.name,
              buttonName: button.text,
              action
            });
          });
        }
      });
    });
    
    // Sort by timestamp, newest first
    journalEntries.sort((a, b) => b.timestamp - a.timestamp);
    setEntries(journalEntries);
  }, [appState]);

  // Filter entries based on selected filter and date range
  const filteredEntries = entries.filter(entry => {
    // Filter by date range if set
    if (dateRange.start && new Date(entry.date) < new Date(dateRange.start)) {
      return false;
    }
    if (dateRange.end && new Date(entry.date) > new Date(dateRange.end)) {
      return false;
    }
    
    // Filter by action type
    if (filter === 'increments' && entry.action !== 'increment') {
      return false;
    }
    if (filter === 'decrements' && entry.action !== 'decrement') {
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
    return date.toLocaleTimeString();
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
            <label htmlFor="action-filter">Filter by action:</label>
            <select 
              id="action-filter" 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="journal-filter-select"
            >
              <option value="all">All Actions</option>
              <option value="increments">Increments Only</option>
              <option value="decrements">Decrements Only</option>
            </select>
          </div>
          
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
                      {entry.action === 'increment' ? (
                        <span className="journal-action-increment">+1</span>
                      ) : (
                        <span className="journal-action-decrement">-1</span>
                      )}
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