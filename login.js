document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    login();
});

async function login(){
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    // Show loading screen
    document.body.innerHTML += '<div id="loadingScreen" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;"><div style="background: white; padding: 20px; border-radius: 8px; text-align: center;"><p>Logging in, please wait...</p></div></div>';
    
    const response = await fetch('/api/main', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'LOGIN', data: { username, password } })
    });
   // alert('Login response status: ' + response.ok);
    if(response.ok){
       window.location.href = '/custom-property-manager.html';
    }
    else{
        const errorData = await response.json();
        alert('Login failed: ' + errorData.error);
        document.getElementById('message').textContent = 'Login failed: ' + errorData.error;
        setTimeout(() => {
            document.getElementById('message').textContent = '';
        }, 4000);
    }
    document.getElementById('loadingScreen').remove();
}