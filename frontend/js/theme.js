document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.createElement('button');
    toggleButton.id = 'theme-toggle';
    toggleButton.title = 'Toggle Dark Mode';

    // Style adjustments to look like other header buttons
    toggleButton.style.width = 'auto';
    toggleButton.style.padding = '5px 15px';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.display = 'flex';
    toggleButton.style.alignItems = 'center';
    toggleButton.style.justifyContent = 'center';
    toggleButton.style.fontSize = '16px';
    toggleButton.style.height = '35px'; // Adjust height match

    const navbarUser = document.querySelector('.navbar-user');

    if (navbarUser) {
        // Place in navbar
        toggleButton.style.marginRight = '15px';
        navbarUser.insertBefore(toggleButton, navbarUser.firstChild);
    } else {
        // Fallback for auth pages (Fixed Top Right)
        toggleButton.style.position = 'fixed';
        toggleButton.style.top = '20px';
        toggleButton.style.right = '20px';
        toggleButton.style.zIndex = '1000';
        document.body.appendChild(toggleButton);
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        toggleButton.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    // Check saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    toggleButton.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
    });
});
