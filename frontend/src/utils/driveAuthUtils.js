export const redirectToGoogleDriveLogin = async () => {
  console.log('Starting Google Drive login process...');
  
  try {
    // Set redirect flag
    sessionStorage.setItem('redirectingToGoogleDrive', 'true');
    
    // Get auth URL from backend
    console.log('Getting auth URL from backend...');
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/api/google-drive/login/`, 
      { credentials: 'include' }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get auth URL: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Got auth URL, redirecting to:', data.auth_url);
    
    // Redirect to Google auth
    window.location.href = data.auth_url;
  } catch (error) {
    console.error('Error initiating Google Drive login:', error);
    sessionStorage.removeItem('redirectingToGoogleDrive');
    alert('Failed to connect to Google Drive. Please try again.');
  }
};