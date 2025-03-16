import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import axiosInstance from '../utils/axiosConfig';

const CreateDocument = ({ isAuthenticated }) => {


    return (
        <div className="container mt-5 entry-container">
            <h2>Create New Document</h2>

        </div>
    );
};

const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
});

export default connect(mapStateToProps)(CreateDocument);