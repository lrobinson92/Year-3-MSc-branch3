import React from 'react';
import { connect } from 'react-redux';
import { Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ApiPathDebugger from '../components/ApiPathDebugger';

const ApiDebug = ({ isAuthenticated }) => {
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return (
        <div className="d-flex">
            <Sidebar />
            <div className="main-content">
                <div className="container py-4">
                    <h1 className="mb-4">API Debugging</h1>
                    <ApiPathDebugger />
                </div>
            </div>
        </div>
    );
};

const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated
});

export default connect(mapStateToProps)(ApiDebug);