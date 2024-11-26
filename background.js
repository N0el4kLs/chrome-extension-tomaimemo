// Create context menu item when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "sendToMaimemo",
    title: "Send '%s' to Maimemo",
    contexts: ["selection"]
  });
});

// Function to get dictionary content
async function getDictionary(token, dictionary) {
  try {
    const response = await fetch(`https://open.maimemo.com/open/api/v1/notepads/${dictionary}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'chrome-extension://'
      },
      credentials: 'omit',
      mode: 'cors',
      cache: 'no-cache'
    });

    const data = await response.json();
    if (data.success && data.errors.length === 0) {
      return data.data.notepad;
    }
    throw new Error('Failed to get dictionary');
  } catch (error) {
    console.error('Error getting dictionary:', error);
    throw error;
  }
}

// Function to update dictionary with new word
async function updateDictionary(token, dictionary, notepad, newWord) {
  try {
    // Get current word list and add new word
    let wordList = notepad.content ? notepad.content.split('\n') : [];
    wordList.push(newWord);
    
    // Remove duplicates and empty strings
    wordList = [...new Set(wordList)].filter(word => word.trim());
    
    // Create updated notepad object
    const updatedNotepad = {
      notepad: {
        status: notepad.status || "PUBLISHED",
        content: wordList.join('\n'),
        title: notepad.title || "ToMaimemo",
        brief: notepad.brief || "use chrome extension and send word to here",
        tags: notepad.tags || ["其他"]
      }
    };

    // Send update request
    const response = await fetch(`https://open.maimemo.com/open/api/v1/notepads/${dictionary}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Origin': 'chrome-extension://'
      },
      credentials: 'omit',
      mode: 'cors',
      cache: 'no-cache',
      body: JSON.stringify(updatedNotepad)
    });

    const data = await response.json();
    return data.success && data.errors.length === 0;
  } catch (error) {
    console.error('Error updating dictionary:', error);
    return false;
  }
}

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "sendToMaimemo") {
    const selectedText = info.selectionText;
    
    // Check if the selected text contains only English letters
    if (/^[a-zA-Z\s]+$/.test(selectedText)) {
      // Check if settings exist
      chrome.storage.sync.get(['token', 'dictionary'], async (result) => {
        if (!result.token || !result.dictionary) {
          chrome.tabs.sendMessage(tab.id, {
            action: "error",
            message: "Please set your Maimemo token and dictionary ID in the extension settings"
          });
          return;
        }

        try {
          // Get current dictionary content
          const notepad = await getDictionary(result.token, result.dictionary);
          
          // Update dictionary with new word
          const success = await updateDictionary(
            result.token, 
            result.dictionary, 
            notepad, 
            selectedText.trim()
          );
          
          if (success) {
            chrome.tabs.sendMessage(tab.id, {
              action: "sendToMaimemo",
              word: selectedText.trim(),
              success: true
            });
          } else {
            throw new Error('Failed to update dictionary');
          }
        } catch (error) {
          chrome.tabs.sendMessage(tab.id, {
            action: "error",
            message: "Failed to update dictionary. Please check your settings."
          });
        }
      });
    } else {
      chrome.tabs.sendMessage(tab.id, {
        action: "error",
        message: "Please select English words only"
      });
    }
  }
});

// Handle settings validation
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "validateSettings") {
    getDictionary(request.token, request.dictionary)
      .then(notepad => {
        sendResponse({ success: true });
      })
      .catch(error => {
        sendResponse({ success: false });
      });
    return true; // Required for async response
  }
}); 