import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from 'redux';
import { BrowserRouter as Router } from 'react-router-dom';
import CreateTask from '../../containers/CreateTask';
import rootReducer from '../../reducers';

const store = configureStore

(rootReducer);

describe('CreateTask Page', () => {
    test('renders create task form', () => {
        render(
            <Provider store={store}>
                <Router>
                    <CreateTask />
                </Router>
            </Provider>
        );

        expect(screen.getByPlaceholderText('Description')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Due Date')).toBeInTheDocument();
        expect(screen.getByText('Create Task')).toBeInTheDocument();
    });

    test('handles form submission', () => {
        const mockCreateTask = jest.fn();
        render(
            <Provider store={store}>
                <Router>
                    <CreateTask createTask={mockCreateTask} />
                </Router>
            </Provider>
        );

        fireEvent.change(screen.getByPlaceholderText('Description'), { target: { value: 'Test Task' } });
        fireEvent.change(screen.getByPlaceholderText('Due Date'), { target: { value: '2023-10-01' } });
        fireEvent.click(screen.getByText('Create Task'));

        expect(mockCreateTask).toHaveBeenCalledWith({
            description: 'Test Task',
            due_date: '2023-10-01',
            // Add other fields as necessary
        });
    });
});