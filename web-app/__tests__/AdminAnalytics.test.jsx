import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AdminAnalytics from '../src/pages/AdminAnalytics';

// Mock Chart.js to avoid rendering real canvases
vi.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="mock-bar-chart" />
}));

// Mock layout components to focus on testing analytics logic
vi.mock('../src/components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock('../src/components/Header', () => ({ default: () => <header data-testid="header" /> }));
vi.mock('../src/components/Footer', () => ({ default: () => <footer data-testid="footer" /> }));

// Mock API calls
global.fetch = vi.fn();

describe('AdminAnalytics Component', () => {

  // Mock data matching the API response structure
  const mockAnalyticsData = {
    kpis: {
      avgResolution: "3.0",
      completionRate: 85,
      active: 120
    },
    trends: [
      { month_name: "Jan", received: 100, resolved: 80 },
      { month_name: "Feb", received: 120, resolved: 90 }
    ],
    districts: [
      { district: "Colombo", count: 50 },
      { district: "Kandy", count: 30 }
    ],
    authorities: [
      { authority_name: "Water Board", total_handled: 200, resolved_count: 180, rate: 90 },
      { authority_name: "Road Dev", total_handled: 150, resolved_count: 60, rate: 40 }
    ]
  };

  beforeEach(() => {
    // Clear mock data before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up rendered components after each test
    cleanup();
  });

  it('renders the initial loading state correctly', () => {
    // Simulate a pending API request to test loading state
    global.fetch.mockReturnValue(new Promise(() => {})); 
    
    render(<AdminAnalytics />);
    
    expect(screen.getByText('Statistical Insights')).toBeTruthy();
    expect(screen.getByText('Calculating national statistics...')).toBeTruthy();
  });

  it('fetches and displays the analytics KPIs and data successfully', async () => {
    // Simulate a successful API response with mock data
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockAnalyticsData })
    });

    render(<AdminAnalytics />);

    // Wait for the data to be rendered
    await waitFor(() => {
      // Check if KPI cards are populated
      expect(screen.getByText('3.0 Days')).toBeTruthy();
      expect(screen.getByText('85%')).toBeTruthy();
      expect(screen.getByText('120')).toBeTruthy(); 
      
      // Check if the mock chart is rendered
      expect(screen.getByTestId('mock-bar-chart')).toBeTruthy();

      // Check district statistics
      expect(screen.getByText('Colombo')).toBeTruthy();
      expect(screen.getByText('50')).toBeTruthy();

      // Check authority performance statistics
      expect(screen.getByText('Water Board')).toBeTruthy();
      expect(screen.getByText('200')).toBeTruthy();
      expect(screen.getByText('90% Resolved')).toBeTruthy();
    });
  });

  it('handles API failure gracefully by showing an error message', async () => {
    // Simulate an API network error
    global.fetch.mockRejectedValue(new Error("Network Error"));

    render(<AdminAnalytics />);

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to load data.')).toBeTruthy();
    });
  });

  it('triggers the CSV Export logic when the Export button is clicked', async () => {
    // Mock DOM methods used for triggering file downloads
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const removeSpy = vi.spyOn(HTMLAnchorElement.prototype, 'remove').mockImplementation(() => {});
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    
    // Spy on setAttribute to verify file name and content
    const setAttributeSpy = vi.spyOn(HTMLAnchorElement.prototype, 'setAttribute');

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockAnalyticsData })
    });

    render(<AdminAnalytics />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('3.0 Days')).toBeTruthy();
    });

    // Simulate clicking the export button
    const exportBtn = screen.getByRole('button', { name: /Export CSV/i });
    fireEvent.click(exportBtn);

    // Check if the correct file name was set for download
    expect(setAttributeSpy).toHaveBeenCalledWith('download', 'UrbanSync_Authority_Performance.csv');
    
    // Check if the downloaded file contains the correct data
    expect(setAttributeSpy).toHaveBeenCalledWith(
      'href', 
      expect.stringContaining('Water%20Board')
    );
    
    // Check if the download was triggered correctly
    expect(appendChildSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();

    // Restore mocked functions
    clickSpy.mockRestore();
    removeSpy.mockRestore();
    appendChildSpy.mockRestore();
    setAttributeSpy.mockRestore();
  });

});