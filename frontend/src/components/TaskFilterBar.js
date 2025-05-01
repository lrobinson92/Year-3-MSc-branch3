import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { fetchTasks } from '../actions/task';
import axiosInstance from '../utils/axiosConfig';

/**
 * TaskFilterBar Component
 * 
 * Provides filtering controls for tasks based on status and team.
 * Fetches team data for the team filter dropdown and dispatches filtered task requests to Redux.
 */
const TaskFilterBar = () => {
    // Access Redux dispatch function
    const dispatch = useDispatch();
    
    // Filter state
    const [status, setStatus] = useState('');  // Task status filter (not_started, in_progress, complete)
    const [team, setTeam] = useState('');      // Team ID filter
    const [teams, setTeams] = useState([]);    // Available teams for dropdown
    
    /**
     * Fetch teams on component mount
     * Populates the team filter dropdown with user's available teams
     */
    useEffect(() => {
        // Get teams the user belongs to
        axiosInstance.get('/api/teams/')
            .then(res => {
                setTeams(res.data);
            })
            .catch(err => {
                console.error('Failed to fetch teams:', err);
            });
    }, []);
    
    /**
     * Apply selected filters to task list
     * Dispatches fetchTasks action with current filter values
     */
    const handleFilter = () => {
        dispatch(fetchTasks({ 
            status, // Only include if not empty 
            team    // Only include if not empty
        }));
    };

    return (
        <div className="d-flex flex-wrap gap-3 mb-3 align-items-end">
            {/* Status filter dropdown */}
            <div>
                <label>Status</label>
                <select 
                    className="form-select" 
                    value={status} 
                    onChange={e => setStatus(e.target.value)}
                    aria-label="Filter tasks by status"
                >
                    <option value="">All</option>
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="complete">Complete</option>
                </select>
            </div>
            
            {/* Team filter dropdown */}
            <div>
                <label>Team</label>
                <select 
                    className="form-select" 
                    value={team} 
                    onChange={e => setTeam(e.target.value)}
                    aria-label="Filter tasks by team"
                >
                    <option value="">All</option>
                    {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                </select>
            </div>
            
            {/* Apply filters button */}
            <div>
                <button 
                    onClick={handleFilter} 
                    className="btn btn-primary"
                    aria-label="Apply task filters"
                >
                    Apply Filters
                </button>
            </div>
        </div>
    );
};

export default TaskFilterBar;
