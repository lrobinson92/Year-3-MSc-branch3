import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import axiosInstance from '../utils/axiosConfig';
import { fetchTasks } from '../actions/task';

const TaskFilterBar = () => {
    const dispatch = useDispatch();
    
    // Filter state
    const [status, setStatus] = useState('');
    const [team, setTeam] = useState('');
    const [teams, setTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Fetch teams on component mount
    useEffect(() => {
        const getTeams = async () => {
            try {
                const res = await axiosInstance.get('/api/teams/');
                setTeams(res.data);
            } catch (err) {
                console.error('Failed to fetch teams:', err);
            }
        };
        
        getTeams();
    }, []);
    
    // Apply filters when status or team changes
    useEffect(() => {
        // Only apply filters if component has mounted fully
        if (teams.length > 0) {
            handleFilter();
        }
    }, [status, team]);
    
    // Handle filter application
    const handleFilter = async () => {
        setIsLoading(true);
        
        try {
            // Create filters object with only non-empty values
            const filters = {};
            if (status) filters.status = status;
            if (team) filters.team = team;
            
            // Debug log to verify filters
            console.log("Applying filters:", filters);
            
            await dispatch(fetchTasks(filters));
        } catch (error) {
            console.error("Error applying filters:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Clear all filters
    const clearFilters = () => {
        setStatus('');
        setTeam('');
        dispatch(fetchTasks({}));
    };
    
    return (
        <div className="d-flex flex-wrap gap-3 mb-3 align-items-end">
            {/* Status filter dropdown */}
            <div>
                <label className="form-label">Status</label>
                <select 
                    className="form-select" 
                    value={status} 
                    onChange={e => setStatus(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="complete">Complete</option>
                </select>
            </div>
            
            {/* Team filter dropdown */}
            <div>
                <label className="form-label">Team</label>
                <select 
                    className="form-select" 
                    value={team} 
                    onChange={e => setTeam(e.target.value)}
                >
                    <option value="">All Teams</option>
                    {/* Add option for personal tasks */}
                    <option value="personal">Personal Tasks</option>
                    {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                </select>
            </div>
            
            {/* Action buttons */}
            <div className="d-flex gap-2">
                <button 
                    onClick={handleFilter}
                    className="btn btn-primary"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-1"></span>
                            Filtering...
                        </>
                    ) : (
                        'Apply Filters'
                    )}
                </button>
                <button 
                    onClick={clearFilters} 
                    className="btn btn-outline-secondary"
                >
                    Clear
                </button>
            </div>
        </div>
    );
};

export default TaskFilterBar;
