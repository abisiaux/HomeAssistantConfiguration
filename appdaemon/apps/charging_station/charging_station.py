from base import Base
import globals
from globals import HouseModes, PEOPLE
import datetime


class ChargingStation(Base):

    def initialize(self) -> None:
        """Initialize."""
        super().initialize()

        self.plug = "switch.bike_charger"
        self.power_sensor_idle = "sensor.ebike_charger"
        self.bike = "device_tracker.tile_8b84f9654688b3ec"
        self.charger_state = "input_select.ebike_charger_status"
        self.snoozed = False
        self.reminder_handle = None

        self.listen_event(self.snooze_reminder, "ios.notification_action_fired", actionName = "CHARGE_TOMORROW")

        self.listen_state(self.coming_home, self.bike, new = "home")
        self.listen_state(self.turn_off_charger, self.power_sensor_idle, new = "True", duration = 90)

    def coming_home(self, entity, attribute, new, old, kwargs):
        self.select_option(self.charger_state, "Waiting")
        if(new != old and self.now_is_between("08:30:00", "22:00:00")):
            self.run_in(self.turn_on_charger, 5400)        

    def turn_on_charger(self, kwargs):
        self.turn_on(self.plug)
        self.log("Ebike charger turned on")
        self.notification_manager.log_home(message = "Ebike charger turned on.")
        reminder_start = self.datetime()
        if (self.reminder_handle is not None):
            return
        else:
            self.reminder_handle = self.run_every(self.check_charge, reminder_start, 1800)
    
    def check_charge(self, kwargs):
        self.log("Checking charge")
        if (self.get_state(self.power_sensor_idle) == "True"):
            if self.snoozed is False:
                self.data = {"push": {"category":"bike", "thread-id":"bike_charger"}}
                self.notification_manager.notify_if_home(person = "Isa", message = "Charge ebike battery", data = self.data)
        else:
            self.log("Reminder canceled")
            self.notification_manager.log_home(message = "Bike battery on charge, reminder canceled.")
            self.select_option(self.charger_state, "Charging")
            self.cancel_timer(self.reminder_handle)
            self.reminder_handle = None

    def turn_off_charger(self, entity, attribute, new, old, kwargs):
        if (new != old):
            self.log("Fully charged, turning off plug")
            self.select_option(self.charger_state, "Charged")
            self.turn_off(self.plug)
            self.data = {"push": {"thread-id":"bike_charger"}}
            self.call_service(globals.notify_ios_isa, title = "Ebike plug turned off", message = "Battery fully charged", data = self.data)
            self.notification_manager.log_home(message = "Bike battery fully charged, turning off plug.")

    def snooze_reminder(self, event_name, data, kwargs):
        self.snoozed = True

        self.log("Bike reminder snoozed until tomorrow")
        self.notification_manager.log_home(message = "Bike reminder snoozed until tomorrow.")

        runtime = datetime.time(1, 0, 0)
        self.run_once(self.cancel_snooze, runtime)
    
    def cancel_snooze(self):
        self.log("Snoozing stopped.")
        self.notification_manager.log_home(message = "Bike reminder snooze stopped.")
        
        self.snoozed = False