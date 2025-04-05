import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

// Import components
import Home from './containers/Home';
import Login from './containers/Login';
import Signup from './containers/Signup';
import Activate from './containers/Activate';
import ResetPassword from './containers/ResetPassword';
import ResetPasswordConfirm from './containers/ResetPasswordConfirm';
import Dashboard from "./containers/Dashboard";
import ViewDocuments from "./containers/ViewDocuments";
import ViewTeams from "./containers/ViewTeams";
import ViewTasks from "./containers/ViewTasks";
import ViewSOP from "./containers/ViewSOP";
import CreateTeam from "./containers/CreateTeam";
import EditTeam from "./containers/EditTeam";
import InviteMember from "./containers/InviteMember";
import EditTask from './containers/EditTask'; 
import CreateTask from './containers/CreateTask';
import CreateDocument from './containers/CreateDocument';
import TeamDetail from './containers/TeamDetail';
import Help from './containers/Help';
import ApiDebug from './containers/ApiDebug'; // Import the new component
import './globalStyles.css';

// Import Redux components
import { Provider } from "react-redux";
import store from './store';
import { SET_DRIVE_LOGGED_IN } from './actions/types'; // Add this import

import Layout from './hocs/Layout';

const App = () => {
    useEffect(() => {
        // Check for Google Drive authentication success
        const urlParams = new URLSearchParams(window.location.search);
        const driveAuth = urlParams.get('drive_auth');
        
        if (driveAuth === 'success') {
            // Remove the query parameter from the URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            
            // Update the authentication state
            store.dispatch({ type: SET_DRIVE_LOGGED_IN, payload: true });
            
            // Check if we need to redirect
            const redirectPath = sessionStorage.getItem('driveAuthRedirect');
            const pendingDocId = sessionStorage.getItem('pendingDocumentView');
            
            if (pendingDocId) {
                sessionStorage.removeItem('pendingDocumentView');
                window.location.href = `/view/sop/${pendingDocId}`;
            } else if (redirectPath) {
                sessionStorage.removeItem('driveAuthRedirect');
                window.location.href = redirectPath;
            }
        }
    }, []);

    return (
        <Provider store={store}>
            <Router>
                <Layout>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path='/login' element={<Login />} />
                        <Route path='/signup' element={<Signup />} />
                        <Route path='/reset-password' element={<ResetPassword />} />
                        <Route path='/password/reset/confirm/:uid/:token' element={<ResetPasswordConfirm />} />
                        <Route path="/auth/activate/:uid/:token" element={<Activate />} />
                        <Route path="/view/dashboard" element={<Dashboard />} />
                        <Route path='/view/documents' element={<ViewDocuments />} />
                        <Route path='/view/teams' element={<ViewTeams />} />
                        <Route path='/create-team' element={<CreateTeam />} />
                        <Route path='/edit-team/:id' element={<EditTeam />} />
                        <Route path="/invite-member/:teamId" element={<InviteMember />} />
                        <Route path='/view/tasks' element={<ViewTasks />} />
                        <Route path="/edit-task/:id" element={<EditTask />} />
                        <Route path="/create-task" element={<CreateTask />} />
                        <Route path='/view/sop/:id' element={<ViewSOP />} />
                        <Route path="/create-document" element={<CreateDocument />} />
                        <Route path="/team/:teamId" element={<TeamDetail />} />
                        <Route path="/help" element={<Help />} />
                        <Route path="/api-debug" element={<ApiDebug />} />
                        {/*<Route path='*' element={<h1>Route Not Found</h1>} />*/}
                    </Routes>            
                </Layout>
            </Router>
        </Provider>
    );
};

export default App;