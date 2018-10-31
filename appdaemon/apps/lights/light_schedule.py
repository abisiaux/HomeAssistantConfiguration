from base import Base
import globals
from globals import HouseModes, PEOPLE
import datetime
from datetime import timedelta, date

class LightSchedule(Base):
    def initialize(self):
        """Initialize."""
        super().initialize()

        self.outdoor_lights = "light.outdoor_lights"
        self.hallway_window = "light.hallway_window_light"
        
        self.dark_lights_on = "scene.dark_lights_on"
        self.dark_lights_off = "script.dark_lights_off"
        self.run_at_sunset(self.outdoor_lights_on, offset = datetime.timedelta(minutes = -45).total_seconds())
        self.scheduler.run_on_evening_before_weekday(self.outdoor_lights_out, self.parse_time("23:59:00"))
        self.scheduler.run_on_night_before_weekend_day(self.outdoor_lights_out, self.parse_time("00:30:00"))

        self.scheduler.run_on_weekdays(self.outdoor_lights_on, self.parse_time("06:30:00"))
        self.run_at_sunrise(self.outdoor_lights_out, offset = datetime.timedelta(minutes = 45).total_seconds())

    def outdoor_lights_on(self, kwargs):
        self.turn_on_device(self.outdoor_lights)
        self.log("Turned on outdoor lights")
    
    def outdoor_lights_out(self, kwargs):
        self.turn_off_device(self.outdoor_lights)
        self.log("Turned off outdoor lights")