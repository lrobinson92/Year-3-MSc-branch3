import { combineReducers } from 'redux';
import auth from './auth';
import team from './team';
import task from './task';
import onedrive from './onedrive';

export default combineReducers({
    auth,
    team,
    task,
    onedrive
});