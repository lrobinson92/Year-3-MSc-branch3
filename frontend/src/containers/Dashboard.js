import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { resetFirstLogin } from '../actions/auth';
import { connect } from 'react-redux';
import axiosInstance from '../utils/axiosConfig';

const Dashboard = ({ isAuthenticated, firstLogin, resetFirstLogin, user }) => {
    const [tasks, setTasks] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();


    useEffect(() => {
        if (firstLogin) {
            resetFirstLogin(); // Reset firstLogin state after visiting dashboard
        }
    }, [firstLogin, resetFirstLogin]);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/tasks/user-and-team-tasks/`, { withCredentials: true });
                const userTasks = res.data.user_tasks;
                const filteredTasks = userTasks.filter(task => task.status !== 'complete');
                const sortedTasks = filteredTasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
                setTasks(sortedTasks.slice(0, 3)); // Get the three tasks due the soonest
            } catch (err) {
                console.error('Failed to fetch tasks:', err);
            }
        };

        const fetchTeams = async () => {
            try {
                const res = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/teams/`, { withCredentials: true });
                const userTeams = res.data;
                const sortedTeams = userTeams.sort((a, b) => {
                    const roleOrder = { owner: 1, admin: 2, member: 3 };
                    return roleOrder[a.role] - roleOrder[b.role];
                });
                setTeams(sortedTeams.slice(0, 3));
            } catch (err) {
                console.error('Failed to fetch teams:', err);
            }
        };

        Promise.all([fetchTasks(), fetchTeams()]).then(() => setLoading(false));
    }, [user]);

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (loading) {
        return <div>Loading...</div>;
    }

    const getStatusText = (status) => {
        switch (status) {
            case 'in_progress':
                return 'In progress';
            case 'not_started':
                return 'Not started';
            default:
                return status;
        }
    };

    const handleTaskClick = (taskId) => {
        navigate(`/view/tasks`);
    };

    const handleTeamClick = (teamId) => {
        navigate(`/view/teams`);
    };

    return (
        <div>
            {/* Sidebar and Main Content */}
            <div className="d-flex">
                <Sidebar />
                <div className="main-content">
                <div className="recent-items-card">
                        {/* Recent Items */}
                        <div className="row mb-4">
                            <h3>Recent Items</h3>
                            <div className="col-md-4 mb-3">
                                <div className="card p-3">
                                    <h5>Item 1</h5>
                                    <p>Details about recent item 1.</p>
                                </div>
                            </div>
                            <div className="col-md-4 mb-3">
                                <div className="card p-3">
                                    <h5>Item 2</h5>
                                    <p>Details about recent item 2.</p>
                                </div>
                            </div>
                            <div className="col-md-4 mb-3">
                                <div className="card p-3">
                                    <h5>Item 3</h5>
                                    <p>Details about recent item 3.</p>
                                </div>
                            </div>
                        </div>
    
                        {/* Tasks */}
                        <div className="row mb-4">
                            <h3>Tasks</h3>
                            {tasks.map((task, index) => (
                                <div key={index} className="col-md-4 mb-3">
                                    <div className="card p-3" onClick={() => handleTaskClick(task.id)} style={{ cursor: 'pointer' }}>
                                        <h5>{task.description}</h5>
                                        <p>Status: {getStatusText(task.status)}</p>
                                        <p>Due Date: {new Date(task.due_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Teams */}
                        <div className="row">
                            <h3>Teams</h3>
                            {teams.map((team) => (
                                <div className="col-md-4 mb-3" key={team.id}>
                                    <div className="card p-3" onClick={() => handleTeamClick(team.id)} style={{ cursor: 'pointer' }}>
                                        <h5>{team.name}</h5>
                                        <ul className="member-list">
                                            {team.members.map((member) => (
                                                <li key={member.id}>
                                                    <span
                                                        className="member-initial"
                                                        data-fullname={member.user_name}
                                                    >
                                                        {member.user_name.charAt(0).toUpperCase()}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    firstLogin: state.auth.firstLogin,
    user: state.auth.user,
});

export default connect(mapStateToProps, { resetFirstLogin })(Dashboard);