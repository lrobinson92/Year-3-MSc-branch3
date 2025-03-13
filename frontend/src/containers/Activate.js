import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { verify } from '../actions/auth';

const Activate = ({ verify }) => {
    const [verified, setVerified] = useState(false);
    const { uid, token } = useParams() // Call useParams here

    const verify_account = () => {
        verify(uid, token); 
        setVerified(true); 
    };

    if (verified) {
        return <Navigate to='/login' />;
    }

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

export default connect(null, { verify })(Activate);
