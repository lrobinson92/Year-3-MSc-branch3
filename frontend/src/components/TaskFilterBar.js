import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { fetchTasks } from '../actions/task';
import axiosInstance from '../utils/axiosConfig';

const TaskFilterBar = () => {
    const dispatch = useDispatch();
    const [status, setStatus] = useState('');
    const [team, setTeam] = useState('');
    const [teams, setTeams] = useState([]);

    useEffect(() => {
        axiosInstance.get('/api/teams/').then(res => {
            setTeams(res.data);
        });
    }, []);

    const handleFilter = () => {
        dispatch(fetchTasks({ status, team }));
    };

    return (
        <div className="d-flex flex-wrap gap-3 mb-3 align-items-end">
            <div>
                <label>Status</label>
                <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="">All</option>
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="complete">Complete</option>
                </select>
            </div>
            <div>
                <label>Team</label>
                <select className="form-select" value={team} onChange={e => setTeam(e.target.value)}>
                    <option value="">All</option>
                    {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                </select>
            </div>
            <div>
                <button onClick={handleFilter} className="btn btn-primary">Apply Filters</button>
            </div>
        </div>
    );
};

export default TaskFilterBar;
