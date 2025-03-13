import { 
    CREATE_TASK_SUCCESS, 
    CREATE_TASK_FAIL, 
    DELETE_TASK_SUCCESS, 
    DELETE_TASK_FAIL,
    EDIT_TASK_SUCCESS,
    EDIT_TASK_FAIL,
    FETCH_TASKS_SUCCESS,
    FETCH_TASKS_FAIL 
} from '../actions/types';

const initialState = {
    tasks: [],
    userTasks: [],
    teamTasks: [],
    error: null
};

function taskReducer(state = initialState, action) {
    const { type, payload } = action;

    switch (type) {
        case CREATE_TASK_SUCCESS:
            return {
                ...state,
                tasks: [...state.tasks, payload],
                error: null
            };
        case CREATE_TASK_FAIL:
            return {
                ...state,
                error: 'Failed to create task'
            };
        case DELETE_TASK_SUCCESS:
            return {
                ...state,
                tasks: state.tasks.filter(task => task.id !== payload),
                error: null
            };
        case DELETE_TASK_FAIL:
            return {
                ...state,
                error: 'Failed to delete task'
            };
        case EDIT_TASK_SUCCESS:
            return {
                ...state,
                tasks: state.tasks.map(task => task.id === payload.id ? payload : task),
                error: null
            };
        case EDIT_TASK_FAIL:
            return {
                ...state,
                error: 'Failed to edit task'
            };
        case FETCH_TASKS_SUCCESS:
            return {
                ...state,
                userTasks: payload.user_tasks,
                teamTasks: payload.team_tasks,
                error: null
            };
        case FETCH_TASKS_FAIL:
            return {
                ...state,
                error: 'Failed to fetch tasks'
            };
        default:
            return state;
    }
};

export default taskReducer;