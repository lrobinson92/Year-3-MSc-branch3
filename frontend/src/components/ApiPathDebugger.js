import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApiPathDebugger = () => {
    const [endpoints, setEndpoints] = useState([
        { name: 'Tasks List', path: '/api/tasks/', tested: false, success: false, error: null },
        { name: 'User and Team Tasks', path: '/api/tasks/user-and-team-tasks/', tested: false, success: false, error: null },
        { name: 'Sample Task Detail', path: '/api/tasks/1/', tested: false, success: false, error: null },
    ]);
    const [baseUrl, setBaseUrl] = useState(process.env.REACT_APP_API_URL || 'http://localhost:8000');
    const [isTestingAll, setIsTestingAll] = useState(false);

    const testEndpoint = async (index) => {
        const endpoint = endpoints[index];
        const newEndpoints = [...endpoints];
        
        try {
            // Track testing state
            newEndpoints[index] = { 
                ...endpoint, 
                tested: true, 
                testing: true,
                success: false,
                error: null
            };
            setEndpoints(newEndpoints);
            
            // Make the actual request
            await axios.get(`${baseUrl}${endpoint.path}`, { 
                withCredentials: true,
                timeout: 5000 // 5 second timeout
            });
            
            // Update state on success
            newEndpoints[index] = { 
                ...endpoint, 
                tested: true, 
                testing: false,
                success: true,
                error: null
            };
        } catch (err) {
            // Update state on failure
            newEndpoints[index] = { 
                ...endpoint, 
                tested: true, 
                testing: false,
                success: false,
                error: err.response ? 
                    `${err.response.status} ${err.response.statusText}` : 
                    (err.message || 'Network error')
            };
        }
        
        setEndpoints(newEndpoints);
    };

    const testAllEndpoints = async () => {
        setIsTestingAll(true);
        for (let i = 0; i < endpoints.length; i++) {
            await testEndpoint(i);
        }
        setIsTestingAll(false);
    };

    const addCustomEndpoint = () => {
        setEndpoints([
            ...endpoints, 
            { 
                name: 'Custom Endpoint', 
                path: '/api/custom/', 
                tested: false, 
                success: false, 
                error: null,
                isCustom: true
            }
        ]);
    };

    const updateEndpoint = (index, key, value) => {
        const newEndpoints = [...endpoints];
        newEndpoints[index] = {
            ...newEndpoints[index],
            [key]: value
        };
        setEndpoints(newEndpoints);
    };

    return (
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">API Path Debugger</h5>
                <button 
                    className="btn btn-sm btn-primary"
                    onClick={testAllEndpoints}
                    disabled={isTestingAll}
                >
                    {isTestingAll ? 'Testing...' : 'Test All Endpoints'}
                </button>
            </div>
            <div className="card-body">
                <div className="mb-3">
                    <label className="form-label">Base URL</label>
                    <input
                        type="text"
                        className="form-control"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                    />
                    <div className="form-text">
                        This should match the REACT_APP_API_URL in your environment
                    </div>
                </div>
                
                <table className="table table-bordered">
                    <thead>
                        <tr>
                            <th>Endpoint</th>
                            <th>Path</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {endpoints.map((endpoint, index) => (
                            <tr key={index}>
                                <td>
                                    {endpoint.isCustom ? (
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={endpoint.name}
                                            onChange={(e) => updateEndpoint(index, 'name', e.target.value)}
                                        />
                                    ) : (
                                        endpoint.name
                                    )}
                                </td>
                                <td>
                                    {endpoint.isCustom ? (
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={endpoint.path}
                                            onChange={(e) => updateEndpoint(index, 'path', e.target.value)}
                                        />
                                    ) : (
                                        endpoint.path
                                    )}
                                </td>
                                <td>
                                    {endpoint.testing ? (
                                        <span className="badge bg-info">Testing...</span>
                                    ) : endpoint.tested ? (
                                        endpoint.success ? (
                                            <span className="badge bg-success">Success</span>
                                        ) : (
                                            <span className="badge bg-danger" title={endpoint.error}>
                                                {endpoint.error}
                                            </span>
                                        )
                                    ) : (
                                        <span className="badge bg-secondary">Not Tested</span>
                                    )}
                                </td>
                                <td>
                                    <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => testEndpoint(index)}
                                        disabled={endpoint.testing}
                                    >
                                        Test
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={addCustomEndpoint}
                >
                    Add Custom Endpoint
                </button>
                
                <div className="mt-3">
                    <h6>Debug Notes:</h6>
                    <ul>
                        <li>Ensure your backend server is running</li>
                        <li>Check that the API paths match your Django URL configuration</li>
                        <li>Verify CORS is properly configured on your backend</li>
                        <li>Make sure authentication tokens are valid if required</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ApiPathDebugger;