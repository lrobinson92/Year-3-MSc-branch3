import taskReducer from '../../reducers/task';
import * as types from '../../actions/types';

describe('Task Reducer', () => {
    const initialState = {
        tasks: [],
        userTasks: [],
        teamTasks: [],
        currentTask: null,
        loading: false,
        error: null
    };

    test('should return the initial state', () => {
        expect(taskReducer(undefined, {})).toEqual(initialState);
    });

    test('should handle SET_TASK_LOADING', () => {
        expect(
            taskReducer(initialState, {
                type: types.SET_TASK_LOADING
            })
        ).toEqual({
            ...initialState,
            loading: true
        });
    });

    test('should handle TASK_LIST_SUCCESS with array payload', () => {
        const mockTasks = [
            { id: 1, description: 'Task 1' },
            { id: 2, description: 'Task 2' }
        ];
        
        expect(
            taskReducer(initialState, {
                type: types.TASK_LIST_SUCCESS,
                payload: mockTasks
            })
        ).toEqual({
            ...initialState,
            tasks: mockTasks,
            loading: false
        });
    });

    test('should handle TASK_LIST_SUCCESS with separated user/team tasks', () => {
        const userTasks = [{ id: 1, description: 'User Task' }];
        const teamTasks = [{ id: 2, description: 'Team Task' }];
        
        expect(
            taskReducer(initialState, {
                type: types.TASK_LIST_SUCCESS,
                payload: { userTasks, teamTasks }
            })
        ).toEqual({
            ...initialState,
            userTasks,
            teamTasks,
            tasks: [...userTasks, ...teamTasks],
            loading: false
        });
    });

    test('should handle TASK_DETAILS_SUCCESS', () => {
        const task = { id: 1, description: 'Task Details' };
        
        expect(
            taskReducer(initialState, {
                type: types.TASK_DETAILS_SUCCESS,
                payload: task
            })
        ).toEqual({
            ...initialState,
            currentTask: task,
            loading: false
        });
    });

    test('should handle TASK_CREATE_SUCCESS', () => {
        const newTask = { id: 3, description: 'New Task' };
        const startState = {
            ...initialState,
            tasks: [{ id: 1, description: 'Existing Task' }]
        };
        
        expect(
            taskReducer(startState, {
                type: types.TASK_CREATE_SUCCESS,
                payload: newTask
            })
        ).toEqual({
            ...startState,
            tasks: [newTask, ...startState.tasks],
            loading: false
        });
    });

    test('should handle TASK_UPDATE_SUCCESS', () => {
        const updatedTask = { id: 1, description: 'Updated Task' };
        const startState = {
            ...initialState,
            tasks: [
                { id: 1, description: 'Original Task' },
                { id: 2, description: 'Another Task' }
            ],
            userTasks: [{ id: 1, description: 'Original Task' }],
            teamTasks: [{ id: 2, description: 'Another Task' }]
        };
        
        expect(
            taskReducer(startState, {
                type: types.TASK_UPDATE_SUCCESS,
                payload: updatedTask
            })
        ).toEqual({
            ...startState,
            tasks: [updatedTask, { id: 2, description: 'Another Task' }],
            userTasks: [updatedTask],
            teamTasks: [{ id: 2, description: 'Another Task' }],
            currentTask: updatedTask,
            loading: false
        });
    });

    test('should handle TASK_DELETE_SUCCESS', () => {
        const startState = {
            ...initialState,
            tasks: [
                { id: 1, description: 'Task to Delete' },
                { id: 2, description: 'Keep this Task' }
            ],
            userTasks: [{ id: 1, description: 'Task to Delete' }],
            teamTasks: [{ id: 2, description: 'Keep this Task' }]
        };
        
        expect(
            taskReducer(startState, {
                type: types.TASK_DELETE_SUCCESS,
                payload: 1 // task ID to delete
            })
        ).toEqual({
            ...startState,
            tasks: [{ id: 2, description: 'Keep this Task' }],
            userTasks: [],
            teamTasks: [{ id: 2, description: 'Keep this Task' }],
            loading: false
        });
    });

    test('should handle error cases', () => {
        const error = 'Something went wrong';
        
        const errorActions = [
            types.TASK_LIST_FAIL,
            types.TASK_DETAILS_FAIL,
            types.TASK_CREATE_FAIL,
            types.TASK_UPDATE_FAIL,
            types.TASK_DELETE_FAIL
        ];
        
        errorActions.forEach(type => {
            expect(
                taskReducer(initialState, {
                    type,
                    payload: error
                })
            ).toEqual({
                ...initialState,
                error,
                loading: false
            });
        });
    });
});