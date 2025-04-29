import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { verify } from '../actions/auth';

// This component handles account activation when a user clicks the link in their verification email
const Activate = ({ verify }) => {
    // Track whether the account has been verified
    const [verified, setVerified] = useState(false);
    // Get activation parameters from the URL
    const { uid, token } = useParams()

    // Function that runs when user clicks the verification button
    const verify_account = () => {
        // Send verification request to the server
        verify(uid, token); 
        // Mark account as verified
        setVerified(true); 
    };

    // If account is verified, redirect to login page
    if (verified) {
        return <Navigate to='/login' />;
    }

    // Show verification page with button
    return (
        <div className='container mt-5'>
            <h1>Account Activation</h1>
            <p>Click the button below to verify your account.</p>
                <button
                    onClick={verify_account}
                    type='button'
                    className='btn btn-primary mt-4'
                >
                    Verify
                </button>
        </div>
    );
};

// Connect component to Redux state management
export default connect(null, { verify })(Activate);
