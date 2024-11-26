// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendToMaimemo") {
    if (request.success) {
      alert(`Word "${request.word}" has been sent to Maimemo`);
    } else {
      alert('Failed to send word to Maimemo. Please check your token and dictionary ID.');
    }
  } else if (request.action === "error") {
    alert(request.message);
  }
}); 