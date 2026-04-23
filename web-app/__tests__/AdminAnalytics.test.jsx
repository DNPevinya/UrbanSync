import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AdminAnalytics from '../src/pages/AdminAnalytics';

// We don't need to actually render Chart.js canvases in our tests,
// so we just replace the Bar chart with a simple div we can look for.
vi.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="mock-bar-chart" />
}));

// Stub out the layout components to keep the DOM clean and focus strictly on the analytics logic.
vi.mock('../src/components/Sidebar', () => ({ default: () => <div data-testid="sidebar" /> }));
vi.mock('../src/components/Header', () => ({ default: () => <header data-testid="header" /> }));
vi.mock('../src/components/Footer', () => ({ default: () => <footer data-testid="footer" /> }));

// Intercept API calls to our backend
global.fetch = vi.fn();

describe('AdminAnalytics Component', () => {

  // A solid chunk of dummy data that matches the shape of our real API response
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
    // Start fresh before every test so state doesn't leak
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Unmount everything after each test
    cleanup();
  });

  it('renders the initial loading state correctly', () => {
    // Force the fetch promise to hang forever so we can catch the loading UI in action
    global.fetch.mockReturnValue(new Promise(() => {})); 
    
    render(<AdminAnalytics />);
    
    expect(screen.getByText('Statistical Insights')).toBeTruthy();
    expect(screen.getByText('Calculating national statistics...')).toBeTruthy();
  });

  it('fetches and displays the analytics KPIs and data successfully', async () => {
    // Feed our dummy data into the component
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockAnalyticsData })
    });

    render(<AdminAnalytics />);

    // Wait for the UI to update with the fetched data
    await waitFor(() => {
      // Verify the top-level KPI cards populated correctly
      expect(screen.getByText('3.0 Days')).toBeTruthy();
      expect(screen.getByText('85%')).toBeTruthy();
      expect(screen.getByText('120')).toBeTruthy(); 
      
      // Ensure our fake Chart component made it to the screen
      expect(screen.getByTestId('mock-bar-chart')).toBeTruthy();

      // Verify the breakdown by district
      expect(screen.getByText('Colombo')).toBeTruthy();
      expect(screen.getByText('50')).toBeTruthy();

      // Verify the specific authority performance table
      expect(screen.getByText('Water Board')).toBeTruthy();
      expect(screen.getByText('200')).toBeTruthy();
      expect(screen.getByText('90% Resolved')).toBeTruthy();
    });
  });

  it('handles API failure gracefully by showing an error message', async () => {
    // Force a network crash
    global.fetch.mockRejectedValue(new Error("Network Error"));

    render(<AdminAnalytics />);

    // Ensure the component catches it and informs the user
    await waitFor(() => {
      expect(screen.getByText('Failed to load data.')).toBeTruthy();
    });
  });

  it('triggers the CSV Export logic when the Export button is clicked', async () => {
    // Downloading files in React Testing Library is tricky. We can't actually download a file,
    // so we spy on the DOM methods React uses to trigger the download under the hood.
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const removeSpy = vi.spyOn(HTMLAnchorElement.prototype, 'remove').mockImplementation(() => {});
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    
    // We track setAttribute to make sure it's generating the correct filename and data payload
    const setAttributeSpy = vi.spyOn(HTMLAnchorElement.prototype, 'setAttribute');

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockAnalyticsData })
    });

    render(<AdminAnalytics />);

    // Wait for the dashboard to finish loading its data
    await waitFor(() => {
      expect(screen.getByText('3.0 Days')).toBeTruthy();
    });

    // Find and click the export button
    const exportBtn = screen.getByRole('button', { name: /Export CSV/i });
    fireEvent.click(exportBtn);

    // Verify it tried to create a file named UrbanSync_Authority_Performance.csv
    expect(setAttributeSpy).toHaveBeenCalledWith('download', 'UrbanSync_Authority_Performance.csv');
    
    // Verify the data payload actually contains our mocked data (like 'Water Board')
    expect(setAttributeSpy).toHaveBeenCalledWith(
      'href', 
      expect.stringContaining('Water%20Board')
    );
    
    // Verify the anchor tag lifecycle executed completely
    expect(appendChildSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();

    // Clean up our spies so they don't mess with other test files
    clickSpy.mockRestore();
    removeSpy.mockRestore();
    appendChildSpy.mockRestore();
    setAttributeSpy.mockRestore();
  });

});