import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import Sidebar from '../components/Sidebar';
import TaskTable from '../components/TaskTable';
import { fetchTasks } from '../actions/task';
import { fetchTeams } from '../actions/team';
import { FaPlus, FaFilter } from 'react-icons/fa';
import TaskFilterBar from '../components/TaskFilterBar';

const ViewTasks = ({ isAuthenticated, userTasks, teamTasks, fetchTasks, fetchTeams, loading }) => {
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                await Promise.all([fetchTasks(), fetchTeams()]);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch data');
            }
        };

        fetchData();
    }, [fetchTasks, fetchTeams]);

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return (
        <div>
            <div className="d-flex">
                <Sidebar />
                <div className="main-content">
                    <div className="container-fluid pt-2 pb-1">
                        <div className="d-flex justify-content-end">
                            <button
                                className="btn btn-outline-secondary me-2"
                                data-bs-toggle="collapse"
                                data-bs-target="#filterCollapse"
                                aria-expanded="false"
                                aria-controls="filterCollapse"
                            >
                                <FaFilter className="me-1" /> Filters
                            </button>
                            <Link to="/create-task" className="btn btn-primary">
                                <FaPlus className="me-1" /> Create New Task
                            </Link>
                        </div>

                        <div className="collapse mb-3" id="filterCollapse">
                            <div className="card card-body">
                                <TaskFilterBar />
                            </div>
                        </div>

                        {error && <div className="alert alert-danger">{error}</div>}

                        {loading ? (
                            <div className="d-flex justify-content-center my-5">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="card mb-3">
                                    <div className="card-header bg-white">
                                        <h5 className="mb-0">My Tasks</h5>
                                    </div>
                                    <div className="card-body">
                                        <TaskTable 
                                            tasks={userTasks} 
                                            emptyMessage="You have no tasks that match the selected filters" 
                                            showColumns={{ 
                                                status: true, 
                                                assignedTo: false, 
                                                teamName: true,
                                                dueDate: true, 
                                                actions: true 
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-header bg-white">
                                        <h5 className="mb-0">Team Tasks</h5>
                                    </div>
                                    <div className="card-body">
                                        <TaskTable 
                                            tasks={teamTasks} 
                                            emptyMessage="Your teams have no tasks that match the selected filters" 
                                            showColumns={{ 
                                                status: true, 
                                                assignedTo: true, 
                                                teamName: true,
                                                dueDate: true, 
                                                actions: true 
                                            }}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    userTasks: state.task.userTasks,
    teamTasks: state.task.teamTasks,
    loading: state.task.loading
});

export default connect(
    mapStateToProps, 
    { fetchTasks, fetchTeams }
)(ViewTasks);
