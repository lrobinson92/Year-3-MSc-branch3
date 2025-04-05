import {
    SET_TASK_LOADING,
    TASK_LIST_SUCCESS,
    TASK_LIST_FAIL,
    TASK_DETAILS_SUCCESS,
    TASK_DETAILS_FAIL,
    TASK_CREATE_SUCCESS,
    TASK_CREATE_FAIL,
    TASK_UPDATE_SUCCESS,
    TASK_UPDATE_FAIL,
    TASK_DELETE_SUCCESS,
    TASK_DELETE_FAIL,
    FETCH_TASKS_SUCCESS,
    FETCH_TASKS_FAIL,
    CREATE_TASK_SUCCESS,
    CREATE_TASK_FAIL,
    EDIT_TASK_SUCCESS,
    EDIT_TASK_FAIL,
    DELETE_TASK_SUCCESS,
    DELETE_TASK_FAIL
} from '../actions/types';

const initialState = {
    tasks: [],
    userTasks: [],
    teamTasks: [],
    currentTask: null,
    loading: false,
    error: null
};

// Named function to avoid ESLint warning
function taskReducer(state = initialState, action) {
    const { type, payload } = action;
    
    switch(type) {
        case SET_TASK_LOADING:
            return {
                ...state,
                loading: true
            };
            
        case TASK_LIST_SUCCESS:
        case FETCH_TASKS_SUCCESS:
            // Handle both formats: array of tasks or separated user/team tasks
            if (Array.isArray(payload)) {
                return {
                    ...state,
                    tasks: payload,
                    loading: false,
                    error: null
                };
            } else if (payload.userTasks !== undefined && payload.teamTasks !== undefined) {
                return {
                    ...state,
                    userTasks: payload.userTasks || [],
                    teamTasks: payload.teamTasks || [],
                    tasks: [...(payload.userTasks || []), ...(payload.teamTasks || [])],
                    loading: false,
                    error: null
                };
            } else {
                return {
                    ...state,
                    tasks: payload,
                    loading: false,
                    error: null
                };
            }
            
        case TASK_LIST_FAIL:
        case FETCH_TASKS_FAIL:
            return {
                ...state,
                loading: false,
                error: payload
            };
            
        case TASK_DETAILS_SUCCESS:
            return {
                ...state,
                currentTask: payload,
                loading: false,
                error: null
            };
            
        case TASK_CREATE_SUCCESS:
        case CREATE_TASK_SUCCESS:
            return {
                ...state,
                tasks: [payload, ...state.tasks],
                loading: false,
                error: null
            };
            
        case TASK_UPDATE_SUCCESS:
        case EDIT_TASK_SUCCESS:
            return {
                ...state,
                tasks: state.tasks.map(task => 
                    task.id === payload.id ? payload : task
                ),
                userTasks: state.userTasks.map(task => 
                    task.id === payload.id ? payload : task
                ),
                teamTasks: state.teamTasks.map(task => 
                    task.id === payload.id ? payload : task
                ),
                currentTask: payload,
                loading: false,
                error: null
            };
            
        case TASK_DELETE_SUCCESS:
        case DELETE_TASK_SUCCESS:
            return {
                ...state,
                tasks: state.tasks.filter(task => task.id !== payload),
                userTasks: state.userTasks.filter(task => task.id !== payload),
                teamTasks: state.teamTasks.filter(task => task.id !== payload),
                loading: false,
                error: null
            };
            
        case TASK_DETAILS_FAIL:
        case TASK_CREATE_FAIL:
        case TASK_UPDATE_FAIL:
        case TASK_DELETE_FAIL:
        case CREATE_TASK_FAIL:
        case EDIT_TASK_FAIL:
        case DELETE_TASK_FAIL:
            return {
                ...state,
                loading: false,
                error: payload
            };
            
        default:
            return state;
    }
}

export default taskReducer;