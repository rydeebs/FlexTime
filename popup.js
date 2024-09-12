document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded and parsed');

  // Log all elements we're trying to access
  ['workoutLevel', 'workStartTime', 'workEndTime', 'saveSettings', 'connectToCalendar'].forEach(id => {
      const element = document.getElementById(id);
      console.log(`Element ${id}: ${element ? 'Found' : 'Not found'}`);
  });

  // Load saved settings and update UI
  chrome.storage.sync.get(['workoutLevel', 'workSchedule'], function(data) {
      console.log('Retrieved data from storage:', data);
      setElementValue('workoutLevel', data.workoutLevel || 'Entry');
      setElementValue('workStartTime', data.workSchedule?.start || '09:00');
      setElementValue('workEndTime', data.workSchedule?.end || '17:00');
  });

  // Save settings
  addClickListener('saveSettings', function() {
      const workoutLevel = getElementValue('workoutLevel');
      const workStartTime = getElementValue('workStartTime');
      const workEndTime = getElementValue('workEndTime');

      chrome.storage.sync.set({
          workoutLevel: workoutLevel,
          workSchedule: { start: workStartTime, end: workEndTime, days: [1, 2, 3, 4, 5] }
      }, function() {
          console.log('Settings saved');
          showNotification('Settings saved successfully!');
      });
  });

  // Connect to Google Calendar
  document.getElementById('connectToCalendar').addEventListener('click', function() {
    console.log('Connect to Calendar button clicked');
    chrome.runtime.sendMessage({action: "connectToCalendar"}, function(response) {
        if (chrome.runtime.lastError) {
            console.error('Chrome runtime error:', chrome.runtime.lastError);
            showNotification('Error connecting to Google Calendar: ' + chrome.runtime.lastError.message);
            return;
        }
        if (response && response.success) {
            console.log('Successfully connected to Google Calendar!');
            showNotification('Successfully connected to Google Calendar!');
        } else {
            console.error('Failed to connect to Google Calendar:', response ? response.error : 'Unknown error');
            showNotification('Failed to connect to Google Calendar: ' + (response ? response.error : 'Unknown error'));
        }
    });
});

function setElementValue(id, value) {
  const element = document.getElementById(id);
  if (element) {
      element.value = value;
  } else {
      console.warn(`Element with id "${id}" not found`);
  }
}

function getElementValue(id) {
  const element = document.getElementById(id);
  return element ? element.value : null;
}

function addClickListener(id, callback) {
  const element = document.getElementById(id);
  if (element) {
      element.addEventListener('click', callback);
  } else {
      console.warn(`Element with id "${id}" not found`);
  }
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.className = 'notification';
  document.body.appendChild(notification);
  setTimeout(() => {
      notification.remove();
  }, 3000);
}

});