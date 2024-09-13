document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup DOM fully loaded');

    // Load saved settings and update UI
    chrome.storage.sync.get(['workoutLevel', 'workSchedule'], function(data) {
        console.log('Retrieved data from storage:', data);
        setElementValue('workoutLevel', data.workoutLevel || 'Entry');
        setElementValue('workStartTime', data.workSchedule?.start || '09:00');
        setElementValue('workEndTime', data.workSchedule?.end || '17:00');
    });

    // Save settings
    document.getElementById('saveSettings').addEventListener('click', function() {
        console.log('Save Settings button clicked');
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
    document.getElementById('connectToGoogle').addEventListener('click', function() {
        console.log('Connect to Google Calendar button clicked');
        chrome.runtime.sendMessage({action: "connectToGoogle"}, function(response) {
            console.log('Received response from Google connection attempt:', response);
            if (chrome.runtime.lastError) {
                console.error('Chrome runtime error:', chrome.runtime.lastError);
                showNotification('Error connecting to Google Calendar: ' + chrome.runtime.lastError.message);
            } else if (response && response.success) {
                console.log('Successfully connected to Google Calendar');
                showNotification('Successfully connected to Google Calendar!');
            } else {
                console.error('Failed to connect to Google Calendar:', response ? response.error : 'Unknown error');
                showNotification('Failed to connect to Google Calendar. Please try again.');
            }
        });
    });

    // Connect to Outlook Calendar
    document.getElementById('connectToOutlook').addEventListener('click', function() {
        console.log('Connect to Outlook Calendar button clicked');
        chrome.runtime.sendMessage({action: "connectToOutlook"}, function(response) {
            console.log('Received response from Outlook connection attempt:', response);
            if (chrome.runtime.lastError) {
                console.error('Chrome runtime error:', chrome.runtime.lastError);
                showNotification('Error connecting to Outlook Calendar: ' + chrome.runtime.lastError.message);
            } else if (response && response.success) {
                console.log('Successfully connected to Outlook Calendar');
                showNotification('Successfully connected to Outlook Calendar!');
            } else {
                console.error('Failed to connect to Outlook Calendar:', response ? response.error : 'Unknown error');
                showNotification('Failed to connect to Outlook Calendar. Please try again.');
            }
        });
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

function showNotification(message) {
    console.log('Showing notification:', message);
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = 'notification';
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}