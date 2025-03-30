import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import Sidebar from '../components/Sidebar';
import TaskTable from '../components/TaskTable';
import { fetchTasks } from '../actions/task';
import { fetchTeams } from '../actions/team';

const ViewTasks = ({ isAuthenticated, userTasks, teamTasks, fetchTasks, fetchTeams }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filteredUserTasks, setFilteredUserTasks] = useState([]);
    const [filteredTeamTasks, setFilteredTeamTasks] = useState([]);
    
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
    
    // Filter tasks when userTasks or teamTasks change
    useEffect(() => {
        // Filter out tasks that are both complete AND past due date
        const today = new Date();
        
        const filterTasks = (tasks) => {
            if (!tasks) return [];
            
            return tasks.filter(task => {
                // If task is not complete, include it
                if (task.status !== 'complete') return true;
                
                // If task is complete, include only if due date is in the future
                const dueDate = new Date(task.due_date);
                return dueDate > today;
            });
        };
        
        if (userTasks) {
            setFilteredUserTasks(filterTasks(userTasks));
        }
        
        if (teamTasks) {
            setFilteredTeamTasks(filterTasks(teamTasks));
        }
    }, [userTasks, teamTasks]);

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
                            tasks={filteredUserTasks} 
                            emptyMessage="You have no active tasks" 
                        />

                        <h2 className="mt-5">Team Tasks</h2>
                        <TaskTable 
                            tasks={filteredTeamTasks} 
                            emptyMessage="Your teams have no active tasks" 
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
