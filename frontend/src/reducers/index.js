import { combineReducers } from 'redux';
import auth from './auth';
import team from './team';
import task from './task';
import googledrive from './googledrive';

export default combineReducers({
    auth,
    team,
    task,
    googledrive
});