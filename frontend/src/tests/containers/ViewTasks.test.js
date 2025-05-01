import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter as Router } from 'react-router-dom';
import ViewTasks from '../../containers/ViewTasks';
import rootReducer from '../../reducers';
import axiosInstance from '../../utils/axiosConfig';
// Import the formatDate function
import { formatDate } from '../../utils/utils';

// Mock axios
jest.mock('../../utils/axiosConfig');

describe('ViewTasks Component', () => {
  let store;
  
  beforeEach(() => {
    // Setup store
    store = configureStore({
      reducer: rootReducer,
      preloadedState: {
        auth: {
          isAuthenticated: true,
          user: { id: 1, name: 'Test User' }
        }
      }
    });
    
    // More accurate mock based on your API:
    axiosInstance.get.mockImplementation((url) => {
      console.log('API call to:', url);
      
      // For the main user_and_team_tasks endpoint
      if (url.includes('/api/tasks/user-and-team-tasks')) {
        return Promise.resolve({
          data: {
            user_tasks: [
              { 
                id: 1, 
                description: 'Sample Task 1', 
                due_date: '2023-10-15',
                status: 'not_started',
                assigned_to: 1,
                assigned_to_name: 'Test User'
              }
            ],
            team_tasks: [
              { 
                id: 2, 
                description: 'Sample Task 2', 
                due_date: '2023-10-20',
                status: 'in_progress',
                assigned_to: 1,
                assigned_to_name: 'Test User'
              }
            ]
          }
        });
      }
      
      // For regular tasks endpoint
      else if (url.includes('/api/tasks')) {
        return Promise.resolve({
          data: [
            { 
              id: 1, 
              description: 'Sample Task 1', 
              due_date: '2023-10-15',
              status: 'not_started',
              assigned_to: 1,
              assigned_to_name: 'Test User'
            },
            { 
              id: 2, 
              description: 'Sample Task 2', 
              due_date: '2023-10-20',
              status: 'in_progress',
              assigned_to: 1,
              assigned_to_name: 'Test User'
            }
          ]
        });
      }
      
      // Default case
      return Promise.resolve({ data: [] });
    });
  });
  
  // Update the status check in your test:

  test('renders task list when data is loaded', async () => {
    const { container } = render(
      <Provider store={store}>
        <Router>
          <ViewTasks />
        </Router>
      </Provider>
    );
    
    // Wait for tasks to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Sample Task 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Sample Task 2/i)).toBeInTheDocument();
    });
    
    // Check for status badges specifically
    const statusBadges = container.querySelectorAll('span.badge');
    expect(statusBadges.length).toBeGreaterThanOrEqual(2); // At least 2 badges for our tasks
    
    // Check that badges contain the expected statuses
    const badgeTexts = Array.from(statusBadges).map(badge => badge.textContent.toLowerCase());
    expect(badgeTexts.some(text => text.includes('not started'))).toBe(true);
    expect(badgeTexts.some(text => text.includes('in progress'))).toBe(true);
    
    // Check due dates
    const formattedDate1 = formatDate('2023-10-15');
    const formattedDate2 = formatDate('2023-10-20');

    expect(screen.getByText((content) => content.includes(formattedDate1))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes(formattedDate2))).toBeInTheDocument();
  });
  
  test('shows loading state before tasks arrive', async () => {
    // Delay the API response
    axiosInstance.get.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => 
        resolve({ data: [] }), 100))
    );
    
    render(
      <Provider store={store}>
        <Router>
          <ViewTasks />
        </Router>
      </Provider>
    );
    
    // Check for loading indicator
    expect(screen.getByText(/loading/i) || 
           screen.getByRole('progressbar') ||
           screen.getByTestId('loading-indicator')
    ).toBeInTheDocument();
  });


  // In your "no tasks" test:

  test('shows "no tasks" message when no tasks match filters', async () => {
    // Override the mock to return empty data specifically for this test
    axiosInstance.get.mockImplementation((url) => {
      console.log('API call in "no tasks" test to:', url);
      
      // Return empty data for all API calls in this test
      return Promise.resolve({ data: [] });
    });
    
    render(
      <Provider store={store}>
        <Router>
          <ViewTasks />
        </Router>
      </Provider>
    );
    
    // Wait for the "no tasks" message to appear
    await waitFor(() => {
      expect(screen.getByText(/You have no tasks that match the selected filters/i)).toBeInTheDocument();
    });
    
    // Also check that filter options are rendered
    expect(screen.getByText(/Status/i)).toBeInTheDocument();
    expect(screen.getByText(/Not Started/i)).toBeInTheDocument();
    expect(screen.getByText(/In Progress/i)).toBeInTheDocument();
    expect(screen.getByText(/Complete/i)).toBeInTheDocument();
    
  });
});