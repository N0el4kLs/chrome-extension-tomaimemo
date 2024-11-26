document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup loaded');
  
  // Load saved settings
  chrome.storage.sync.get(['token', 'dictionary'], (result) => {
    console.log('Loaded settings:', result);
    document.getElementById('token').value = result.token || '';
    document.getElementById('dictionary').value = result.dictionary || '';
  });

  // Function to show status message
  function showStatus(message, isError = false) {
    console.log('Showing status:', message, isError);
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${isError ? 'error' : 'success'}`;
    status.style.display = 'block';
    
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  }

  // Save settings
  document.getElementById('save').addEventListener('click', () => {
    console.log('Save button clicked');
    const token = document.getElementById('token').value.trim();
    const dictionary = document.getElementById('dictionary').value.trim();
    
    console.log('Attempting to save settings:', { token, dictionary });
    
    if (!token || !dictionary) {
      showStatus('Please enter both token and dictionary ID', true);
      return;
    }

    // Save settings first
    chrome.storage.sync.set({ token, dictionary }, () => {
      console.log('Settings saved to storage');
      // Send message to background script to validate
      console.log('Sending validation message to background');
      chrome.runtime.sendMessage(
        { action: "validateSettings", token, dictionary },
        (response) => {
          console.log('Received validation response:', response);
          if (response && response.success) {
            showStatus('Settings saved successfully!');
          } else {
            showStatus('Invalid token or dictionary ID. Please check your credentials.', true);
          }
        }
      );
    });
  });
}); 