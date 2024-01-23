var calendar; // Global calendar object

var calendarConfig = {
    // themeSystem: 'bootstrap5',
		// timezone: 'local',
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
            calendar.addEvent({
                id: event.id,
                title: event.title,
                start: event.start,
                end: event.end
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

    var durationMillisec = parseDuration(durationStr);

    if (title && startDate && startTime && duration) {
		    var startDateTime = new Date(startDate + 'T' + startTime);
        var endDateTime = new Date(startDateTime.getTime() + durationMillisec);

        addCalendarEvent(title, startDateTime.toISOString(), endDateTime.toISOString());
    }
}

// Parses a duration such as 1h 15m
function parseDuration(durationStr) {
    console.log('Trying to parse duration string:', durationStr);
    var match = durationStr.match(/(:?(\d+)\s*h)?(:?\s*(\d+)\s*m)?/);
    if (match) {
        var hours = parseInt(match[1] || 0, 10);
        var minutes = parseInt(match[2] || 0, 10);
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
function addCalendarEvent(title, start, end) {
		var newEvent = { title: title, start: start, end: end };
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
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        updateCalendarWithEvent(newEvent); // Update calendar only if successful
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
function updateCalendarWithEvent(eventData) {
    // Use the global calendar instance to add the event
    calendar.addEvent({
        title: eventData.title,
        start: eventData.start,
        end: eventData.end
    });
}

// Not used, but to be able to remove reservations
function removeCalendarEvent(eventId) {
    var event = calendar.getEventById(eventId);
    if (event) {
        event.remove();
    }
}

