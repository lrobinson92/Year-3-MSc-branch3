import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit'; // Import from @reduxjs/toolkit, not redux
import { BrowserRouter as Router } from 'react-router-dom';
import CreateTask from '../../containers/CreateTask';
import rootReducer from '../../reducers';
import axiosInstance from '../../utils/axiosConfig';
import userEvent from '@testing-library/user-event';

// Mock axios
jest.mock('../../utils/axiosConfig');

// Mock the navigate function from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock process.env
process.env.REACT_APP_API_URL = 'http://localhost:8000';

// Add this helper function for finding form elements:

// Helper function to find form control via a more flexible approach
const getFormControlByText = (labelText) => {
  // Try to find the label - first with htmlFor
  const label = screen.getByText(labelText);
  
  // Look for an id in the label's htmlFor
  if (label.htmlFor) {
    return document.getElementById(label.htmlFor);
  }
  
  // Otherwise find the closest form group and get the input inside
  const formGroup = label.closest('.form-group');
  if (formGroup) {
    return formGroup.querySelector('input, select, textarea');
  }
  
  // If all else fails, try by name attribute
  return screen.getByRole('textbox', { name: labelText }) || 
         screen.getByRole('combobox', { name: labelText });
};

describe('CreateTask Page', () => {
  let store;
  
  beforeEach(() => {
    // Create a fresh store for each test
    store = configureStore({
      reducer: rootReducer,
      preloadedState: {
        auth: {
          isAuthenticated: true,
          user: { 
            id: 1, 
            name: 'Test User',
            email: 'user@example.com'
          }
        }
      }
    });
    
    // Mock API responses - make this more specific to avoid confusion
    axiosInstance.get.mockImplementation((url) => {
      console.log('Mock API call to:', url);
      
      // For team listing endpoint
      if (url.includes('/api/teams/') && !url.includes('/users-in-same-team/')) {
        return Promise.resolve({ 
          data: [
            { id: 1, name: 'Team 1' },
            { id: 2, name: 'Team 2' }
          ]
        });
      }
      
      // For team members endpoint
      if (url.includes('/users-in-same-team/')) {
        return Promise.resolve({
          data: [
            { user: 1, user_name: 'Test User', role: 'member' }
          ]
        });
      }
            return Promise.resolve({ data: [] });
    });

    // Reset navigate mock
    mockNavigate.mockReset();
  });

  test('renders create task form', async () => {
    render(
      <Provider store={store}>
        <Router>
          <CreateTask />
        </Router>
      </Provider>
    );

    // Wait for the component to load data
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Create Task/i })).toBeInTheDocument();
    });

    // Check that the form elements are rendered using text content
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Due Date')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Task/i })).toBeInTheDocument();
    
    // Check that form controls exist
    expect(document.getElementById('description')).toBeInTheDocument();
    // Use querySelector for other elements that might not have IDs
    expect(document.querySelector('input[type="date"]')).toBeInTheDocument();
    expect(document.querySelector('select[name="status"]')).toBeInTheDocument();
  });

  test('handles form submission', async () => {
    // Mock the createTask action's response
    const mockTaskData = {
      id: 1,
      description: 'Test Task',
      due_date: '2023-10-01',
      assigned_to: 1,
      team: '',
      status: 'not_started'
    };
    
    axiosInstance.post.mockResolvedValueOnce({ data: mockTaskData });

    render(
      <Provider store={store}>
        <Router>
          <CreateTask />
        </Router>
      </Provider>
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Create Task/i })).toBeInTheDocument();
    });

    // Fill out the form using ID selectors
    const descriptionInput = document.getElementById('description') || 
                             document.querySelector('textarea[name="description"]');
    fireEvent.change(descriptionInput, { 
      target: { value: 'Test Task' } 
    });
    
    const dueDateInput = document.querySelector('input[name="due_date"]');
    fireEvent.change(dueDateInput, { 
      target: { value: '2023-10-01' } 
    });
    
    const statusSelect = document.querySelector('select[name="status"]');
    fireEvent.change(statusSelect, { target: { value: 'not_started' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Create Task/i }));

    // Check that the API was called correctly
    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/tasks/'),
        expect.objectContaining({
          description: 'Test Task',
          due_date: '2023-10-01',
          status: 'not_started'
        })
      );
      
      // Check that navigation occurred
      expect(mockNavigate).toHaveBeenCalledWith('/view/tasks');
    });
  });

  test('loads appropriate members when team is selected', async () => {
    // Customize axiosInstance.get for teams and users as needed
    axiosInstance.get.mockReset();
    axiosInstance.get.mockImplementation((url) => {
      if (url.includes('/api/teams/')) {
        if (url.includes('/users-in-same-team/')) {
          return Promise.resolve({
            data: [
              { user: 1, user_name: 'Test User', role: 'owner' },
              { user: 2, user_name: 'Team Member', role: 'member' }
            ]
          });
        } else {
          // For teams list
          return Promise.resolve({
            data: [
              { id: 1, name: 'Team 1' },
              { id: 2, name: 'Team 2' }
            ]
          });
        }
      }
      return Promise.resolve({ data: [] });
    });
  
    render(
      <Provider store={store}>
        <Router>
          <CreateTask />
        </Router>
      </Provider>
    );
  
    // Wait for the teams to be loaded (Team 1 should appear)
    await waitFor(() => expect(screen.getByText('Team 1')).toBeInTheDocument());
  
    // Use getByLabelText to get the team select element
    const teamSelect = screen.getByLabelText(/Team \(Optional\)/i);
  
    // Use userEvent.selectOptions to select the option with value "1"
    userEvent.selectOptions(teamSelect, '1');
  
    // Assert that the team select value is updated
    await waitFor(() => {
      expect(teamSelect.value).toBe('1');
    });
  });

  test('loads appropriate members when team is selected - as owner', async () => {
    // Reset mock implementation to ensure clean state
    axiosInstance.get.mockReset();
    
    // Customize mock for this test - set current user as OWNER
    axiosInstance.get.mockImplementation((url) => {
      // Log the URL being called to help debug
      console.log('API call to URL:', url);
      
      if (url.includes('/api/teams/')) {
        if (url.includes('/users-in-same-team/')) {
          // Match the exact API pattern from your component
          return Promise.resolve({
            data: [
              { user: 1, user_name: 'Test User', role: 'owner' }, // Current user as owner
              { user: 2, user_name: 'Team Member', role: 'member' }
            ]
          });
        } else {
          // For teams list
          return Promise.resolve({ 
            data: [
              { id: 1, name: 'Team 1' },
              { id: 2, name: 'Team 2' }
            ]
          });
        }
      }
      return Promise.resolve({ data: [] });
    });

    // Clear localStorage to prevent state persistence between tests
    localStorage.clear();

    // Render the component
    const { container } = render(
      <Provider store={store}>
        <Router>
          <CreateTask />
        </Router>
      </Provider>
    );

    // Wait for initial component to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Create Task/i })).toBeInTheDocument();
    });

    // IMPORTANT: Wait for the team options to be loaded
    await waitFor(() => {
      const teamOptions = screen.getAllByRole('option', { name: /Team \d/ });
      expect(teamOptions.length).toBeGreaterThan(0);
    });

    // Now select a team using userEvent
    const teamSelect = document.querySelector('select[name="team"]');
    
    // First check that the team options exist
    const options = Array.from(teamSelect.querySelectorAll('option'));
    console.log('Team options available:', options.map(opt => ({
      value: opt.value,
      text: opt.textContent
    })));
    
    // Find the option with value "1"
    const teamOption = options.find(opt => opt.value === '1');
    expect(teamOption).toBeTruthy(); // Make sure it exists
    
    // Now select it
    await userEvent.selectOptions(teamSelect, '1');
    
    // Give the component's useEffect time to run
    await waitFor(() => {
      expect(teamSelect.value).toBe('1');
    });
    
    // Check what's in the assigned_to dropdown
    const assignedSelect = document.querySelector('select[name="assigned_to"]');
    
    // Log the options for debugging - USE A DIFFERENT VARIABLE NAME HERE
    const assignedOptions = Array.from(assignedSelect.querySelectorAll('option'));
    console.log('Current options:', assignedOptions.map(opt => ({
      value: opt.value,
      text: opt.textContent
    })));
    
    // Use a more reliable approach checking for specific options
    const hasSelectMember = assignedOptions.some(opt => opt.textContent === 'Select Member');
    const hasTestUser = assignedOptions.some(opt => opt.textContent === 'Test User');
    const hasTeamMember = assignedOptions.some(opt => opt.textContent === 'Team Member');
    
    expect(hasSelectMember).toBe(true);
    expect(hasTestUser).toBe(true);
    expect(hasTeamMember).toBe(true);
  });

  // Add a test for non-owner behavior:

  test('loads only current user when team is selected - as non-owner', async () => {
    // Reset mock implementation to ensure clean state
    axiosInstance.get.mockReset();
    
    // Customize mock for this test - set current user as regular member
    axiosInstance.get.mockImplementation((url) => {
      if (url.includes('/api/teams/')) {
        if (url.includes('/users-in-same-team/')) {
          // Match the exact API pattern from your component
          return Promise.resolve({
            data: [
              { user: 1, user_name: 'Test User', role: 'member' }, // Current user as member
              { user: 2, user_name: 'Team Member', role: 'member' }
            ]
          });
        } else {
          // For teams list
          return Promise.resolve({ 
            data: [
              { id: 1, name: 'Team 1' },
              { id: 2, name: 'Team 2' }
            ]
          });
        }
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <Provider store={store}>
        <Router>
          <CreateTask />
        </Router>
      </Provider>
    );

    // Wait for initial component to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Create Task/i })).toBeInTheDocument();
    });

    // IMPORTANT: Wait for the team options to be loaded
    await waitFor(() => {
      const teamOptions = screen.getAllByRole('option', { name: /Team \d/ });
      expect(teamOptions.length).toBeGreaterThan(0);
    });

    // Now select a team using userEvent
    const teamSelect = document.querySelector('select[name="team"]');
    await userEvent.selectOptions(teamSelect, '1');

    // Continue with the rest of the test...
    
    await waitFor(() => {
        expect(axiosInstance.get).toHaveBeenCalled();
    });
    
    // Since user is NOT owner, should only see current user
    await waitFor(() => {
      const assignedSelect = document.querySelector('select[name="assigned_to"]');
      const options = Array.from(assignedSelect.querySelectorAll('option'));
      
      // Filter out any empty options for a more reliable test
      const nonEmptyOptions = options.filter(opt => opt.textContent.trim() !== '');
      
      // Should have "Select Member" and "Test User" only - FIX THE SYNTAX ERROR
      expect(nonEmptyOptions.length).toBe(2);
      
      // Should not find team member option
      const teamMemberOption = options.find(opt => 
        opt.textContent.includes('Team Member'));
      expect(teamMemberOption).toBeUndefined();
      
      // First option should be Select Member
      expect(nonEmptyOptions[0].textContent).toBe('Select Member');
      
      // Second option should be Test User
      expect(nonEmptyOptions[1].textContent).toBe('Test User');
    });
  });

  // Update the test with more debugging:

  test('DEBUG - API calls for team selection', async () => {
    // Reset mock implementation 
    axiosInstance.get.mockReset();
    
    // Customize mock for this test
    axiosInstance.get.mockImplementation((url) => {
      console.log('API call with URL:', url);
      
      if (url.includes('/api/teams/')) {
        if (url.includes('/users-in-same-team/')) {
          return Promise.resolve({
            data: [
              { user: 1, user_name: 'Test User', role: 'owner' },
              { user: 2, user_name: 'Team Member', role: 'member' }
            ]
          });
        } else {
          return Promise.resolve({ 
            data: [
              { id: 1, name: 'Team 1' },
              { id: 2, name: 'Team 2' }
            ]
          });
        }
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <Provider store={store}>
        <Router>
          <CreateTask />
        </Router>
      </Provider>
    );

    // Wait for teams to load
    await waitFor(() => {
      const teamOptions = screen.getAllByRole('option', { name: /Team \d/ });
      expect(teamOptions.length).toBeGreaterThan(0);
    });

    // Log initial API calls
    console.log('API calls before team selection:', 
      axiosInstance.get.mock.calls.map(call => call[0]));
    
    // Select a team using userEvent
    const teamSelect = document.querySelector('select[name="team"]');
    
    // Log available options
    const options = Array.from(teamSelect.querySelectorAll('option'));
    console.log('Team options available:', options.map(opt => ({
      value: opt.value,
      text: opt.textContent
    })));
    
    // Now select a team
    await userEvent.selectOptions(teamSelect, '1');
    
    // Continue with the rest of the test...
  });
});