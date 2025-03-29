import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import Sidebar from '../components/Sidebar';
import TaskTable from '../components/TaskTable'; // Import the new component
import { fetchTasks } from '../actions/task';
import { fetchTeams } from '../actions/team';

const ViewTasks = ({ isAuthenticated, userTasks, teamTasks, fetchTasks, fetchTeams }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch both tasks and teams data
                await Promise.all([fetchTasks(), fetchTeams()]);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [fetchTasks, fetchTeams]);

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <div className="d-flex">
                <Sidebar />
                <div className="main-content">
                    <div className="recent-items-card">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2>My Tasks</h2>
                            <Link to="/create-task" className="btn btn-primary create-new-link">
                                + Create New Task
                            </Link>
                        </div>  
                        <TaskTable 
                            tasks={userTasks} 
                            emptyMessage="You have no tasks" 
                        />

                        <h2 className="mt-5">Team Tasks</h2>
                        <TaskTable 
                            tasks={teamTasks} 
                            emptyMessage="Your teams have no tasks" 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    userTasks: state.task.userTasks,
    teamTasks: state.task.teamTasks
});

export default connect(
    mapStateToProps, 
    { fetchTasks, fetchTeams }
)(ViewTasks);
