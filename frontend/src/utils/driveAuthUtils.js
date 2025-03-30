export const redirectToGoogleDriveLogin = (nextPath = window.location.pathname) => {
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const redirectUrl = `${baseUrl}/api/google-drive/login/?next=${encodeURIComponent(nextPath)}`;

  // Use full page reload to bypass React Router
  window.location.href = redirectUrl;
};