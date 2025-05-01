import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { reset_password_confirm } from '../actions/auth';

/**
 * ResetPasswordConfirm Component
 * 
 * Allows users to set a new password after clicking the reset link in their email.
 * Validates the reset token from the URL and submits the new password to the backend.
 * Redirects to the login page after successful password reset.
 */
const ResetPasswordConfirm = ({ reset_password_confirm }) => {
    // Extract uid and token from URL parameters
    const { uid, token } = useParams();
    
    // State to track if reset request has been submitted
    const [requestSent, setRequestSent] = useState(false);
    
    // State to manage form input values
    const [formData, setFormData] = useState({
        new_password: '',
        re_new_password: ''
    });

    // Destructure password fields from form data for easier access
    const { new_password, re_new_password } = formData;

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
     * Sends password reset confirmation to API with user ID, token, and new passwords
     */
    const onSubmit = e => {
        e.preventDefault();
        reset_password_confirm(uid, token, new_password, re_new_password);
        setRequestSent(true);
    };

    // Redirect to home page after password has been reset
    if (requestSent) {
        return <Navigate to='/' />
    }

    return (
        <div className='container mt-5 entry-container'>
            <div className="card p-4 mx-auto" style={{ maxWidth: '400px' }}>
                {/* Form header */}
                <h1 className="text-center mb-4">Set New Password</h1>
                
                {/* Password reset form */}
                <form onSubmit={onSubmit}>
                    {/* New password input field */}
                    <div className='form-group mb-3'>
                        <input
                            className='form-control'
                            type='password'
                            placeholder='New Password'
                            name='new_password'
                            value={new_password}
                            onChange={onChange}
                            minLength='8'
                            required
                        />
                    </div>
                    
                    {/* Confirm password input field */}
                    <div className='form-group mb-4'>
                        <input
                            className='form-control'
                            type='password'
                            placeholder='Confirm New Password'
                            name='re_new_password'
                            value={re_new_password}
                            onChange={onChange}
                            minLength='8'
                            required
                        />
                    </div>
                    
                    {/* Submit button */}
                    <button className='btn btn-primary w-100' type='submit'>
                        Reset Password
                    </button>
                </form>
            </div>
        </div>
    );
};

/**
 * Connect component to Redux store
 * Maps the reset_password_confirm action for dispatching
 */
export default connect(null, { reset_password_confirm })(ResetPasswordConfirm);