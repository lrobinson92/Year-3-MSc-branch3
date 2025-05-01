import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { reset_password } from '../actions/auth';

/**
 * ResetPassword Component
 * 
 * Provides functionality for users to request a password reset by email.
 * After submission, the user is redirected to the home page and will receive
 * a password reset link by email if the account exists.
 */
const ResetPassword = ({ reset_password }) => {
    // State to track if reset request has been submitted
    const [requestSent, setRequestSent] = useState(false);
    
    // State to manage form input values
    const [formData, setFormData] = useState({
        email: ''
    });

    // Destructure email from form data for easier access
    const { email } = formData;

    /**
     * Update form state when input values change
     * Uses computed property name to update the specific field
     */
    const onChange = e => setFormData({ 
        ...formData, 
        [e.target.name]: e.target.value 
    });

    /**
     * Handle form submission
     * Dispatches reset_password action and updates requestSent state
     */
    const onSubmit = e => {
        e.preventDefault();
        reset_password(email);
        setRequestSent(true);
    };

    // Redirect to home page after request is sent
    if (requestSent) {
        return <Navigate to='/' />
    }

    return (
        <div className="container mt-5 entry-container">
            <div className="card p-4 mx-auto" style={{ maxWidth: '400px' }}>
                {/* Form header */}
                <h1 className="text-center mb-4">Request Password Reset</h1>
                
                {/* Password reset request form */}
                <form onSubmit={onSubmit}>
                    {/* Email input field */}
                    <div className='form-group mb-3'>
                        <input
                            className='form-control'
                            type='email'
                            placeholder='Email'
                            name='email'
                            autoComplete='email'
                            value={email}
                            onChange={onChange}
                            required
                        />
                    </div>
                    
                    {/* Submit button */}
                    <button className="btn btn-primary mt-4 w-100" type="submit">
                        Reset Password
                    </button>
                </form>
            </div>
        </div>
    );
};

/**
 * Connect component to Redux store
 * Maps the reset_password action for dispatching
 */
export default connect(null, { reset_password })(ResetPassword);