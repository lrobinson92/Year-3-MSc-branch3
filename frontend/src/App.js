import React from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

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
import './globalStyles.css';

import { Provider } from "react-redux";
import store from './store';

import Layout from './hocs/Layout';

const App = () => (
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
                    <Route path='/view/sop' element={<ViewSOP />} />
                    <Route path="/create-document" element={<CreateDocument />} />
                    <Route path='*' element={<h1>Route Not Found</h1>} />
                </Routes>            
            </Layout>
        </Router>
    </Provider>
);

export default App;