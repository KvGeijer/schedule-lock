document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');

    var calendar = new FullCalendar.Calendar(calendarEl, {
			// Be able to switch between different views

		  headerToolbar: {
		    left: 'prev,next today',
		    center: 'title',
		    right: 'dayGridMonth,timeGridWeek,timeGridDay'
		  },
		
		// headerToolbar: {center: 'dayGridMonth, timeGridWeek, timeGridDay' },
      initialView: 'timeGridWeek',

			views: {
		    dayGridMonth: {
		    },
		    timeGridWeek: {
					// Just the default
		      titleFormat: { month: 'long', day: 'numeric', year: 'numeric' }
		    },
		    timeGridDay: {
		    },
		  }
    });

    calendar.render();
});

