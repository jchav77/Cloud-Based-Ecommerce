// AWS Cognito configuration
const awsConfig = {
    Auth: {
        region: 'us-east-1',
        userPoolId: 'us-east-1_gHwtEoN4t',
        userPoolWebClientId: '65foa1spo9hgo0t1hv1fjqfcd3'
    }
};

// Initialize AWS Amplify
AWS.config.region = awsConfig.Auth.region;
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

class AuthService {
    constructor() {
        this.userPool = new AmazonCognitoIdentity.CognitoUserPool({
            UserPoolId: awsConfig.Auth.userPoolId,
            ClientId: awsConfig.Auth.userPoolWebClientId
        });
    }

    // Check if user is logged in
    isAuthenticated() {
        const user = this.userPool.getCurrentUser();
        return user !== null;
    }

    // Update UI based on auth state
    updateAuthUI() {
        const authStatus = document.getElementById('auth-status');
        const guestOptions = document.getElementById('guest-options');
        const userOptions = document.getElementById('user-options');
        
        if (this.isAuthenticated()) {
            const user = this.userPool.getCurrentUser();
            authStatus.textContent = user.getUsername();
            guestOptions.style.display = 'none';
            userOptions.style.display = 'block';
        } else {
            authStatus.textContent = 'Sign In';
            guestOptions.style.display = 'block';
            userOptions.style.display = 'none';
        }
    }

    // Sign out user
    signOut() {
        const user = this.userPool.getCurrentUser();
        if (user) {
            user.signOut();
            window.location.href = '/';
        }
    }
}

// Initialize auth service
const auth = new AuthService();

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
    auth.updateAuthUI();

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.signOut();
        });
    }
}); 