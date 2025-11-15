import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useKeyboardShortcuts = (onSearchOpen) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Command+K or Ctrl+K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onSearchOpen();
        return;
      }

      // Only handle shortcuts when not in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        return;
      }

      // Navigation shortcuts
      switch (e.key) {
        case '/':
          e.preventDefault();
          onSearchOpen();
          break;
        case 'n':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // Navigate to create new item based on current page
            const currentPath = window.location.pathname;
            if (currentPath.includes('/clients')) {
              // Trigger add client modal
              const addButton = document.querySelector('[data-action="add-client"]');
              if (addButton) addButton.click();
            } else if (currentPath.includes('/tasks')) {
              // Trigger add task modal
              const addButton = document.querySelector('[data-action="add-task"]');
              if (addButton) addButton.click();
            }
          }
          break;
        case '1':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            navigate('/dashboard');
          }
          break;
        case '2':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            navigate('/clients');
          }
          break;
        case '3':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            navigate('/tasks');
          }
          break;
        case '4':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            navigate('/reports');
          }
          break;
        case '?':
          e.preventDefault();
          // Show keyboard shortcuts help
          alert(`
Keyboard Shortcuts:
• Ctrl/Cmd + K: Open search
• /: Open search
• Ctrl/Cmd + N: Create new item
• Ctrl/Cmd + 1: Dashboard
• Ctrl/Cmd + 2: Clients
• Ctrl/Cmd + 3: Tasks
• Ctrl/Cmd + 4: Reports
• ?: Show this help
          `);
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate, onSearchOpen]);
};
