import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { verify } from '../actions/auth';

/**
 * Activate Component
 * 
 * Handles account activation when a user clicks the link in their verification email.
 * Displays a card with verification instructions and a button to complete activation.
 */
const Activate = ({ verify }) => {
    // Track whether the account has been verified
    const [verified, setVerified] = useState(false);
    
    // Get activation parameters from the URL
    const { uid, token } = useParams();

    /**
     * Send verification request to the server
     * Marks account as verified on success
     */
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

    // Show verification page with button in a card container
    return (
        <div className='container mt-5 entry-container'>
            <div className="card p-4 shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
                <div className="text-center mb-4">
                    <h1 className="h3 mb-3 fw-normal">Account Activation</h1>
                    <p className="text-muted">
                        Thank you for registering with SOPify. 
                        Click the button below to activate your account.
                    </p>
                </div>
                
                <div className="d-grid gap-2">
                    <button
                        onClick={verify_account}
                        type='button'
                        className='btn btn-primary btn-lg'
                    >
                        Activate Account
                    </button>
                </div>
                
                <div className="text-center mt-4">
                    <p className="text-muted small">
                        After activation, you'll be redirected to the login page.
                    </p>
                </div>
            </div>
        </div>
    );
};

// Connect component to Redux state management
export default connect(null, { verify })(Activate);
