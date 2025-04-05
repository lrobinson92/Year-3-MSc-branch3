import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { createTask } from '../actions/task';
import axiosInstance from '../utils/axiosConfig';
import { FaArrowLeft } from 'react-icons/fa';

const CreateTask = ({ createTask, isAuthenticated, user }) => {
    const [formData, setFormData] = useState({
        description: '',
        assigned_to: user ? user.id : '',
        team: '',
        due_date: '',
        status: 'not_started',
    });
    const [teams, setTeams] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);

    const { description, assigned_to, team, due_date, status } = formData;
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch teams on initial render
        const fetchTeams = async () => {
            try {
                const teamsRes = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/teams/`, { withCredentials: true });
                setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : []);
            } catch (err) {
                console.error('Failed to fetch teams:', err);
            }
        };

        fetchTeams();
    }, []);

    useEffect(() => {
        // Fetch users based on the selected team
        const fetchUsers = async () => {
            if (team) {
                try {
                    const usersRes = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/teams/${team}/users-in-same-team/`, { withCredentials: true });
                    console.log('Fetched users:', usersRes.data); // Debugging log
                    
                    if (Array.isArray(usersRes.data)) {
                        const isOwner = usersRes.data.some(member => member.user === user.id && member.role === 'owner');
                        
                        const visibleUsers = isOwner
                            ? usersRes.data // show all if owner
                            : usersRes.data.filter(member => member.user === user.id); // show only self otherwise

                        setFilteredUsers(visibleUsers);
                    } else {
                        setFilteredUsers([]);
                    }
                } catch (err) {
                    console.error('Failed to fetch users:', err);
                    setFilteredUsers([]);
                }
            } else {
                // For personal tasks, only show the current user
                setFilteredUsers(user ? [user] : []);
            }
        };

        fetchUsers();
    }, [team, user]);

    useEffect(() => {
        if (user) {
            setFormData(prevFormData => ({
                ...prevFormData,
                assigned_to: user.id
            }));
        }
    }, [user]);

    const onChange = (e) => {
        const { name, value } = e.target;
        
        // If team field is changed
        if (name === 'team') {
            setFormData({ 
                ...formData, 
                [name]: value,
                // Reset assigned_to when team changes
                assigned_to: value ? '' : (user ? user.id : '')
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            await createTask({ description, assigned_to, team, due_date, status });
            alert("Task created successfully!");
            navigate('/view/tasks');
        } catch (error) {
            alert("Failed to create task. Please try again.");
        }
    };

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    const handleGoBack = () => {
        navigate(-1); // This navigates back one step in history
    };

    return (
        <div className="container mt-5 entry-container">
            <FaArrowLeft 
                                        className="back-arrow" 
                                        onClick={handleGoBack} 
                                        style={{ cursor: 'pointer' }}
                                        title="Go back to previous page" 
                                    />
            <div className="card p-4 mx-auto" style={{ maxWidth: '400px' }}>
                <h1 className="text-center mb-4">Create Task</h1>
                <form onSubmit={onSubmit}>
                    <div className="form-group mb-3">
                        <label>Description</label>
                        <textarea
                            className="form-control"
                            placeholder="Description"
                            name="description"
                            value={description}
                            onChange={onChange}
                            required
                        />
                    </div>
                    <div className="form-group mb-3">
                        <label>Team (Optional)</label>
                        <select
                            className="form-control"
                            name="team"
                            value={team}
                            onChange={onChange}
                        >
                            <option value="">Personal Task</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group mb-3">
                        <label>Assigned To</label>
                        <select
                            className="form-control"
                            name="assigned_to"
                            value={assigned_to}
                            onChange={onChange}
                            required
                        >
                            <option value="">Select Member</option>
                            {!team && user && (
                                <option value={user.id}>{user.name}</option>
                            )}
                            {filteredUsers.map(user => (
                                <option key={user.user} value={user.user}>
                                    {user.user_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group mb-3">
                        <label>Due Date</label>
                        <input
                            type="date"
                            className="form-control"
                            name="due_date"
                            value={due_date}
                            onChange={onChange}
                            required
                        />
                    </div>
                    <div className="form-group mb-3">
                        <label>Status</label>
                        <select
                            className="form-control"
                            name="status"
                            value={status}
                            onChange={onChange}
                        >
                            <option value="not_started">Not Started</option>
                            <option value="in_progress">In Progress</option>
                            <option value="complete">Complete</option>
                        </select>
                    </div>
                    <button className="btn btn-primary w-100" type="submit">
                        Create Task
                    </button>
                </form>
            </div>
        </div>
    );
};

const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    user: state.auth.user,
});

export default connect(mapStateToProps, { createTask })(CreateTask);