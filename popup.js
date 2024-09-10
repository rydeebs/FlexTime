document.addEventListener('DOMContentLoaded', function() {
  // Load saved settings and update UI
  chrome.storage.sync.get(['workoutLevel', 'workSchedule'], function(data) {
      document.getElementById('workoutLevel').value = data.workoutLevel || 'Entry';
      document.getElementById('workStartTime').value = data.workSchedule?.start || '09:00';
      document.getElementById('workEndTime').value = data.workSchedule?.end || '17:00';
  });

  // Save settings
  document.getElementById('saveSettings').addEventListener('click', function() {
      const workoutLevel = document.getElementById('workoutLevel').value;
      const workStartTime = document.getElementById('workStartTime').value;
      const workEndTime = document.getElementById('workEndTime').value;

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
      chrome.runtime.sendMessage({action: "connectToCalendar"}, function(response) {
          if (response && response.success) {
              showNotification('Successfully connected to Google Calendar!');
          } else {
              showNotification('Failed to connect to Google Calendar. Please try again.');
          }
      });
  });
});

function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.className = 'notification';
  document.body.appendChild(notification);
  setTimeout(() => {
      notification.remove();
  }, 3000);
}