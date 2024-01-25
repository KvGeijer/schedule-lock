var calendar; // Global calendar object

var calendarConfig = {
    nowIndicator: true,
    eventMinHeight: 5,
    slotEventOverlap: false,
    // themeSystem: 'bootstrap5',
		// timezone: 'local',
    eventClick: function(info) {
        // info.el.style.borderColor = 'red';
        displayEventPopup(info.event);
    },
    headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    initialView: 'timeGridWeek',
    views: {
        dayGridMonth: {},
        timeGridWeek: {
            titleFormat: { month: 'long', day: 'numeric', year: 'numeric' }
        },
        timeGridDay: {},
    },
};

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the calendar
    var calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, calendarConfig);

    // Add event listener for form submission
    var eventForm = document.getElementById('eventForm')
    if (eventForm) {
        eventForm.addEventListener('submit', submitEventForm);

        // Set some default values
        var now = new Date();
        var startDateInput = document.getElementById('startDate');
        var startTimeInput = document.getElementById('startTime');

        startDateInput.valueAsDate = now;
        startTimeInput.value = now.toTimeString().substr(0, 5); // sets the time input to the current time
    }

    // Load existing events
    fetchEventsAndRenderCalendar();
});

function fetchEventsAndRenderCalendar() {
    fetch('/get_events')
    .then(response => response.json())
    .then(events => {
        events.forEach(function(event) {
        console.log(event),
            calendar.addEvent({
                id: event.id,
                title: event.title,
                start: event.start,
                end: event.end,
                description: event.description,
                owner: event.owner,
                is_owner: event.is_owner,
            });
        });
        calendar.render();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Submits a new reservation
function submitEventForm(e) {
    e.preventDefault(); // Prevent default form submission

    var title = document.getElementById('eventTitle').value;
    var startDate = document.getElementById('startDate').value;
    var startTime = document.getElementById('startTime').value;
    var durationStr = document.getElementById('duration').value;
    var description = document.getElementById('description').value;

    var durationMillisec = parseDuration(durationStr);

    if (title && startDate && startTime && duration) {
		    var startDateTime = new Date(startDate + 'T' + startTime);
        var endDateTime = new Date(startDateTime.getTime() + durationMillisec);

        addCalendarEvent(title, startDateTime.toISOString(), endDateTime.toISOString(), description);
    }
}

// Parses a duration such as 1h 15m
function parseDuration(durationStr) {
    var match = durationStr.match(/((\d+)\s*h)?(\s*(\d+)\s*m)?/);
    if (match) {
        var hours = parseInt(match[2] || 0, 10);
        var minutes = parseInt(match[4] || 0, 10);
				if (hours == 0 && minutes == 0) {
						console.log('Must specify a non-zero duration')
				}
        return (hours * 60 + minutes) * 60 * 1000; // Convert to milliseconds
    } else {
        console.log('Could not parse duration string:', durationStr);
		    return null;
		}
}

// Adds a new event
function addCalendarEvent(title, start, end, description) {
		var newEvent = { 
        title: title, 
        start: start, 
        end: end, 
        description: description,
        is_owner: true,
    };
    if (isOverlapping(newEvent)) {
        console.error('Error: Event overlaps with an existing event');
        return;
    }
	
    fetch('/add_event', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEvent)
    })
    .then(response => {
        if (!response.ok) {
            alert("Could not create event due to ovelap");
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        updateCalendarWithEvent(newEvent, data.owner, data.id); // Update calendar only if successful
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Checks if we can add a new event without overlap
function isOverlapping(newEvent) {
    var events = calendar.getEvents();
    return events.some(function(event) {
        return (newEvent.start < event.end && newEvent.end > event.start);
    });
}

// Callback for updating the calendar view when we have added an event
function updateCalendarWithEvent(eventData, owner, id) {
    // Use the global calendar instance to add the event
    calendar.addEvent({
        id: id,
        title: eventData.title,
        start: eventData.start,
        end: eventData.end,
        description: eventData.description,
        is_owner: true,
        owner: owner,
    });
}

// Display popup when clicking on an event
function displayEventPopup(event) {
    console.log(event);
    var descriptionHTML = event.extendedProps.description 
        ? `<p><strong>Description:</strong> ${event.extendedProps.description}</p>`
        : '';

    // Only display a cancel button if you are the owner
    var cancelBtnHTML = event.extendedProps.is_owner 
        ? `<button onclick="cancelEvent('${event.id}')">Cancel Event</button>`
        : '';

    var popup = document.createElement('div');
    popup.id = 'eventPopup';
    popup.className = 'event-popup';
    popup.innerHTML = `
        <div class="event-popup-content">
            <h2>${event.title}</h2>
            <p><strong>User:</strong> ${event.extendedProps.owner}</p>
            <p><strong>Start:</strong> ${formatLocalDateTime(event.start)}</p>
            <p><strong>End:  </strong> ${formatLocalDateTime(event.end)}</p>
            ${descriptionHTML}
            <button onclick="closeEventPopup()">Close</button>
            ${cancelBtnHTML}
        </div>`;
    document.body.appendChild(popup);
}

// Function to cancel an event
function cancelEvent(eventId) {
    // Send request to the server to delete the event
    // Assuming you have a route '/delete_event/<eventId>' to handle the deletion
    fetch('/delete_event/' + eventId, { method: 'DELETE' })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Event cancelled:', data);
        // Remove the event from the calendar
        var event = calendar.getEventById(eventId);
        if (event) {
            event.remove();
        }
        closeEventPopup(); // Close the popup
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Function to format a date string
function formatLocalDateTime(dateString) {
    var date = new Date(dateString);
    var timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    // Does not properly order date and month...
    // var dateString = date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
    var dateString = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    return `${timeString}, ${dateString}`;
}

function closeEventPopup() {
    var popup = document.getElementById('eventPopup');
    if (popup) {
        document.body.removeChild(popup);
    }
}
