# GPS OBD Scanner Communication Protocol

> Converted from `GPS_OBD_SCANNER.doc` to Markdown. Some complex Word tables are preserved as preformatted text blocks to avoid losing alignment.

departmental sign-off agreement

**- VJT.04.085 -A**

```text
|orde|version  |Revision                                       |Revisio|Revision |
|r   |number   |                                               |ner    |date     |
|numb|         |                                               |       |         |
|er  |         |                                               |       |         |
|1   |V1.01.000|first draft                                    |XQM    |2017-8-24|
|2   |V1.01.001|Proofread content and standardize formatting   |WDC    |2018-9-6 |
|3   |V1.01.002|Add to 1.0x0200 extension information          |YD     |YD       |
|    |         |Subextension 0x01,0x02 extends GSM/CDMA base   |       |         |
|    |         |station information.                           |       |         |
|2018|4        |V1.01.003                                      |Update |WDC      |
|-9-1|         |                                               |the old|         |
|24  |         |                                               |version|         |
|    |         |                                               |1.04   |         |
|    |         |                                               |protoco|         |
|    |         |                                               |l      |         |
|2018|5        |VJT.01.001                                     |Increas|2018-11-1|
|-9-1|         |Reconcile agreement:                           |e the  |9        |
|95  |         |Fault code data, trip data, sleep data, and    |number |         |
|    |         |wake-up data are transmitted through the 0900  |of     |         |
|    |         |protocol.                                      |antisen|         |
|    |         |The parameters for sudden acceleration, sudden |se and |         |
|    |         |deceleration, and sudden turning have been     |sense  |         |
|    |         |adjusted to four levels: high, medium, low, and|functio|         |
|    |         |off.                                           |n      |         |
|    |         |The platform will send a version update packet |example|         |
|    |         |containing terminal-reported software          |s      |         |
|    |         |version/VIN code and system time, enabling time|       |         |
|    |         |synchronization for the terminal.              |       |         |
|    |         |The 0200 data is still packaged and reported   |       |         |
|    |         |dynamically.                                   |       |         |
|    |         |Add privilege number settings                  |       |         |
|6   |VJT.01.00|The latitude and longitude are added to the    |XQM    |2018-12-1|
|    |2        |fault code data packet.                        |       |0        |
|    |         |Add latitude and longitude to trip data        |       |         |
|    |         |Adjust the basic data flow section in the 0200 |       |         |
|    |         |extended data to include CSQ and backup power  |       |         |
|    |         |voltage                                        |       |         |
|7   |VJT.01.00|1. Incorporating Latitude and Longitude Data   |XQM    |2018-12-1|
|    |3        |During Engine Shutdown in Driving Behavior     |       |2        |
|8   |VJT.01.00|Remove the number of inflection points in the  |XQM    |2018-12-1|
|    |4        |line settings                                  |       |8        |
|    |         |Increase the inflection point ID and           |       |         |
|    |         |synchronize with the standard department       |       |         |
|    |         |protocol                                       |       |         |
|9   |VJT.01.00|1. Use 0205/8205 as the version ID             |XQM    |2018-12-2|
|    |5        |                                               |       |0        |
|10  |VJT.01.00|1. Alarm data in the 0200 section is reported  |XQM    |2019-01-0|
|    |6        |using the independent extension ID 0xFA.       |       |4        |
|    |         |2. The command ID in the 0200 extension data   |       |         |
|    |         |section has been reconfigured to ensure        |       |         |
|    |         |compatibility with legacy client command IDs.  |       |         |
|    |         |3. The F1 trip data package at 0900 is changed |       |         |
|    |         |to dynamic data package.                       |       |         |
|11  |VJT.01.00|1. Details adjustment: Set mileage, configure  |XQM    |2019-01-0|
|    |7        |three emergency collision alerts, expand speed |       |8        |
|    |         |limit alerts, add coolant temperature alerts,  |       |         |
|    |         |extend command IDs, and add an accelerometer   |       |         |
|12  |VJT.01.00|Some individual typos                          |XQM    |2019-01-0|
|    |8        |0200 Basic Extended Data Item: Add star count, |       |9        |
|    |         |location accuracy, and signal-to-noise ratio   |       |         |
|12  |VJT.01.00|Modify redundant package parameter items in the|XQM    |2019-01-1|
|    |9        |regional configuration                         |       |5        |
|    |         |In parameter 8103, add the 0090 configuration  |       |         |
|    |         |location mode field                            |       |         |
|13  |VJT.01.01|1. Add the 0x6006 text message reply command   |YGL    |2019-01-2|
|    |0        |                                               |       |1        |
|14  |VJT.04.01|1. Add hyperlink functionality and standardize |LY     |2019-02-1|
|    |1        |version numbers to VJT.04.011                  |       |5        |
|    |         |2. Modify the message body of 0201 and add the |       |         |
|    |         |serial number data item                        |       |         |
|    |         |3. Modify the 0200 message body and delete the |       |         |
|    |         |location report message body length data item  |       |         |
|15  |VJT.04.01|The 0x001B GPS antenna status was added to the |YD     |2019-02-2|
|    |2        |basic data stream section in the 1.0200        |       |1        |
|    |         |extended data.                                 |       |         |
|    |         |The 0x001C calibration status has been added to|       |         |
|    |         |the basic data stream section in the 2.0200    |       |         |
|    |         |extended data.                                 |       |         |
|    |         |The 3.0200 extension data includes the 0x3008  |       |         |
|    |         |H600 video status in the peripheral data stream|       |         |
|    |         |section.                                       |       |         |
|16  |VJT.04.01|1. The fault mileage field (0x6210) has been   |LDY    |2019-02-2|
|    |3        |modified from 2 bytes to 4 bytes               |       |6        |
|    |         |2. The absolute throttle position (0x6110) has |       |         |
|    |         |been modified from 1 byte to 2 bytes.          |       |         |
|    |         |3. Long-term fuel correction for cylinder banks|       |         |
|    |         |1 and 3 (0x6070) -modified from 1 byte to 2    |       |         |
|    |         |bytes                                          |       |         |
|    |         |4. The first cylinder ignition timing advance  |       |         |
|    |         |angle of 0x60E0 has been modified from 1 byte  |       |         |
|    |         |to 2 bytes                                     |       |         |
|17  |VJT.04.01|1.8103 Set 8104 Query adds the following items:|YD     |2019-03-2|
|    |4        |0x2012: Set mileage and fuel type              |       |8        |
|    |         |0x2013: Set mileage coefficient                |       |         |
|    |         |0x2014: Set fuel consumption coefficient       |       |         |
|    |         |0x2015: Set fuel density                       |       |         |
|    |         |0x2016: Set idle fuel consumption coefficient  |       |         |
|    |         |2.8205 The platform's time setting has been    |       |         |
|    |         |adjusted to Beijing Time (Beijing East 8th Time|       |         |
|    |         |Zone).                                         |       |         |
|    |         |3. New extension item 0x3009 H600 input signal |       |         |
|    |         |quantity                                       |       |         |
|18  |VJT.04.01|1. Add truck extension data to support partial |XQM    |2019-04-0|
|    |5        |data streams of the 32960 national standard    |       |8        |
|19  |VJT.04.01|Fix the issue where each package in the 0704   |XQM    |2019-04-2|
|    |6        |subcontract data lacks a length before it      |       |2        |
|    |         |The command word description in control command|       |         |
|    |         |8105 is incorrect                              |       |         |
|20  |VJT.04.01|1.0200 Extended data: Public basic data item   |XQM    |2019-04-2|
|    |7        |added sub-ID 0x001D: Location flag             |       |3        |
|    |         |2. Add the OBD command 8103 sub-id 0x2017 to   |       |         |
|    |         |enable and disable the OBD function            |       |         |
|21  |VJT.04.01|In the 1.0200 extended data items, add the     |XQM    |2019-05-2|
|    |8        |truck data sub-ID 0xFFF1 (mileage data) and    |       |3        |
|    |         |0xFFF2 (fuel consumption data).                |       |         |
|    |         |2. Configure query commands 8103/8104. Add a   |       |         |
|    |         |location data transmission method for          |       |         |
|    |         |sub-function ID 0x2018, supporting two options:|       |         |
|    |         |first-in-first-out and real-time data priority |       |         |
|    |         |transmission.                                  |       |         |
|22  |VJT.04.01|The maintenance mode status was added to the   |XQM    |2019-07-0|
|    |9        |status data item in the 1.0200 data.           |       |5        |
|    |         |In the 2.0200 data, the extended data item     |       |         |
|    |         |includes a new ID: 0x001E for the base data    |       |         |
|    |         |item, which indicates cumulative mileage.      |       |         |
|    |         |In the 3.0900 data, the F1 trip data includes  |       |         |
|    |         |an additional 0x001D to indicate idle fuel     |       |         |
|    |         |consumption.                                   |       |         |
|23  |VJT.04.02|1.0200, in the status flag, the 14th bit       |XQM    |2019-08-1|
|    |0        |indicates the WIFI status: 1 for enabled, 0 for|       |2        |
|    |         |disabled.                                      |       |         |
|    |         |2.8103 WIFI parameter settings.                |       |         |
|    |         |3.8103 The setting of the hibernation wake-up  |       |         |
|    |         |time.                                          |       |         |
|24  |VJT.04.02|The upgrade result type 1.0108 adds a new item,|XQM    |2019-08-2|
|    |1        |0xA2: GSM module                               |       |7        |
|    |         |2.8105 Remote control: Add a type 0xF1 to      |       |         |
|    |         |enable GSM module OTA upgrade                  |       |         |
|25  |VJT.04.02|1. Remove all unnecessary agreements,          |JJH    |2019-9-26|
|    |5        |standardize font formats, and align vertical   |       |         |
|    |         |hyperlinks.                                    |       |         |
|26  |VJT.04.02|1.0200 Extended peripheral data: added weighing|XQM    |2019-9-30|
|    |6        |sensor data                                    |       |         |
|    |         |The 2.0200 alarm extension data now includes   |       |         |
|    |         |emergency brake, emergency braking, overspeed, |       |         |
|    |         |PTO idle alarm, and 8103 configuration alarm   |       |         |
|    |         |parameters.                                    |       |         |
|    |         |3.0200 Update the tire pressure data in the    |       |         |
|    |         |extended peripheral device data                |       |         |
|    |         |4.0900 Add MCU upgrade status feedback package |       |         |
|27  |VJT.04.02|1.0200 Tire data with high/low pressure and    |XQM    |2019-10-2|
|    |7        |high/low temperature status bits, with         |       |1        |
|    |         |additional text added to the tire temperature  |       |         |
|    |         |data                                           |       |         |
|    |         |2.8103 The parameter settings conflict. Adjust |       |         |
|    |         |them again.                                    |       |         |
|28  |VJT.04.02|Adjust the configuration parameters of 1.8103, |XQM    |2019-11-1|
|    |8        |set the command ID to 2012, and add the 0x0d   |       |5        |
|    |         |pulse speed to calculate the mileage type.     |       |         |
|    |         |2.0200 Instantaneous Fuel Consumption          |       |         |
|    |         |Add the original department label function to  |       |         |
|    |         |3.0702                                         |       |         |
|    |         |4.8103 Sub-ID 0x2024 Engine shutdown delay     |       |         |
|    |         |duration, supports setting and querying        |       |         |
|29  |VJT.04.02|1. The data length of the truck data item 60B0 |LYK    |2019-12-1|
|    |9        |has been modified to 2 bytes.                  |       |4        |
|    |         |2. Remove duplicate definitions 510B and 5110  |       |         |
|    |         |from the truck data items.                     |       |         |
|    |         |3. Truck Data Items: New environmental         |       |         |
|    |         |protection-related data items 5111-5118 added  |       |         |
|    |         |in accordance with GB17691-2018                |       |         |
|30  |VJT.04.03|The 1.0200 data truck has been extended to     |XQM    |2019-12-2|
|    |0        |include intake manifold pressure. Previously, a|       |0        |
|    |         |single-byte (60 bits) was used for the 1-255   |       |         |
|    |         |kPa range. Now, without modifying the original |       |         |
|    |         |configuration, a new two-byte ID (50 bits) is  |       |         |
|    |         |adopted for the 1-500 kPa range.               |       |         |
|31  |VJT.04.03|1.0200 Sedan Extended Data Item, added 0x63C0  |XQM    |2020-02-2|
|    |1        |command ID, catalytic converter temperature    |       |6        |
|    |         |2.8300 text information, add a HUD text data.  |       |         |
|32  |VJT.04.03|1. Introduce vehicle control commands,         |XQM    |2020-04-2|
|    |2        |primarily by extending the 8105 terminal       |       |7        |
|    |         |control commands with a new 0105 control result|       |         |
|    |         |response command.                              |       |         |
|    |         |2. Add the 8103 command to configure parameters|       |         |
|    |         |including ACC line validity, fuel consumption  |       |         |
|    |         |coefficient, and minimum OBD speed data stream |       |         |
|    |         |interval.                                      |       |         |
|    |         |3.0900 The sleep wake-up type has been adjusted|       |         |
|    |         |in the dormant exit data packet                |       |         |
|    |         |4. Three new parameters added to the 0200 truck|       |         |
|    |         |expansion data: light absorption               |       |         |
|    |         |coefficient/opacity/particulate matter         |       |         |
|    |         |concentration                                  |       |         |
|33  |VJT.04.03|1.0200 Add an ignition command ID 0x0020 to the|XQM    |2020-08-0|
|    |3        |basic data flow, see protocol for details      |       |6        |
|    |         |In the 2.0200 data base flow, the 0x0011       |       |         |
|    |         |vehicle status table will add a safety status  |       |         |
|    |         |bit and an engine status bit, as specified in  |       |         |
|    |         |the protocol.                                  |       |         |
|34  |VJT.04.03|corrected base data stream                     |TQL    |2020-09-0|
|    |4        |                                               |       |2        |
|35  |VJT.04.03|1. Add department ID: 8202 Temporary Location  |XQM    |2020-09-0|
|    |5        |Tracking Data Packet                           |       |4        |
|36  |VJT.04.03|1. Added 0200 to extend the data stream and    |XQM    |2020-10-2|
|    |6        |0XFB base station data packets.                |       |3        |
|    |         |2. Added 0200 sedan data, including tire       |       |         |
|    |         |pressure, oil level, maintenance mileage, and  |       |         |
|    |         |collision count.                               |       |         |
|37  |VJT.04.03|Add 0200 extended data stream and basic data   |XQM    |2020-12-2|
|    |7        |packet 0XEA, and add cumulative carbon         |       |9        |
|    |         |emissions                                      |       |         |
|    |         |Add 0200 extended data stream and truck data   |       |         |
|    |         |stream 0XEC, and add engine current load 0x511F|       |         |
|38  |VJT.04.03|1. Added the 0XEC data stream for 0200 trucks  |XQM    |2021-04-0|
|    |8        |and incorporated data streams related to the   |       |8        |
|    |         |pine powder machine.                           |       |         |
|39  |VJT.04.03|Add truck data stream 0XEC (0200) and total    |XQM    |2021-05-1|
|    |9        |engine runtime 0x520A for the rice flour       |       |7        |
|    |         |machine.                                       |       |         |
|    |         |Add 0200 basic data stream 0XEA, Roll rate,    |       |         |
|    |         |Pitch rate, Yaw rate                           |       |         |
|    |         |New Energy Vehicle Data, 0200 New Energy Data  |       |         |
|    |         |0XED, Content Adjustment, Project-based        |       |         |
|40  |VJT.04.04|1. Add the 0x300B external oil rod data stream |XQM    |2021-09-1|
|    |0        |to the 0xEE extension peripheral data in the   |       |0        |
|    |         |0200 position data, as detailed in the protocol|       |         |
|    |         |specifications.                                |       |         |
|41  |VJT.04.04|1. In the extended sedan data 0XEB of the 0200 |XQM    |2021-09-2|
|    |1        |position data, two additional extended sub-IDs |       |9        |
|    |         |are added, utilizing the AEB CAN message data  |       |         |
|    |         |reported above.                                |       |         |
|42  |VJT.04.04|1. New 020A command added for reporting        |XQM    |2022-01-1|
|    |2        |collected CAN data streams with custom         |       |7        |
|    |         |functionality                                  |       |         |
|    |         |2. Pressure differential oil quantity sensor   |       |         |
|    |         |added to 0200 data                             |       |         |
|43  |VJT.04.04|Set the motor's current speed, add             |PZJ    |2022-09-2|
|    |3        |offset-32767, and distinguish between forward  |       |0        |
|    |         |and reverse rotation.                          |       |         |
|    |         |2. 0x0105: Control command response with the   |       |         |
|    |         |response sequence number.                      |       |         |
|    |         |3. General response 0x0001: New status         |       |         |
|    |         |added-the previous instruction is currently in |       |         |
|    |         |execution.                                     |       |         |
|44  |VJT.04.04|1. The 0200 FA model has been updated with     |PZJ    |2022-10-1|
|    |4        |alarm codes 0x0405 to 0x0408.                  |       |1        |
|    |         |2. Adjust the alarm description for 0200 FA    |       |         |
|    |         |0x0103~0x0104.                                 |       |         |
|45  |VJT.04.04|1. Failed to add the 0105 control command.     |PZJ    |2022-10-2|
|    |5        |                                               |       |6        |
|46  |VJT.04.04|The 1.0200 extended data includes 0x0025       |LHL    |2022-10-2|
|    |6        |Cumulative Mileage 2 (SWD Customization, for   |       |7        |
|    |         |tire lifespan statistics) in the basic data    |       |         |
|    |         |stream section.                                |       |         |
|47  |VJT.04.04|1. Add 6-channel acquisition for fire          |PZJ    |2022-11-0|
|    |7        |truck-related liquid data in the extended      |       |4        |
|    |         |peripheral data stream                         |       |         |
|48  |VJT.04.04|1. The 0200 FA model now features a 0x040A     |LHL    |2023-1-6 |
|    |8        |battery low power alert                        |       |         |
|49  |VJT.04.04|Add data items 0x520B--0x520E                  |XWB    |2023-1-10|
|    |9        |                                               |       |         |
|50  |VJT.04.50|1. New energy vehicle data flow increases      |LHL    |2023-1-14|
|    |         |battery temperature                            |       |         |
|51  |VJT.04.51|The peripheral data stream has been extended to|XWB    |2023-2-20|
|    |         |include the OX300D and temperature sensor data |       |         |
|    |         |streams.                                       |       |         |
|52  |VJT.04.52|Add extension ID 0xFC to the 1.0x0200 extension|LHL    |2023-3-11|
|    |         |information, Wi-Fi data stream                 |       |         |
|53  |VJT.04.53|1. Add ACC as an ignition type interrupt in the|PZJ    |2023-5-23|
|    |         |0x0200 basic data stream.                      |       |         |
|54  |VJT.04.54|1. The 13th bit in the 0x0200 alarm status bit |PZJ    |2023-5-30|
|    |         |is supplemented with an overspeed warning flag.|       |         |
|55  |VJT.04.55|1. Parameters 0x2029,0x202A, and 0x202B have   |PZJ    |2023-6-01|
|    |         |been added to 0x8103 and 0x8104, including     |       |         |
|    |         |Bluetooth authentication code, Bluetooth name, |       |         |
|    |         |and Bluetooth MAC address.                     |       |         |
|56  |VJT.04.56|Alarm triggered by OBD1 (6X14), OBD2           |XWB    |2023-7-28|
|    |         |(1X9,11X12,3X11) pins being disconnected       |       |         |
|57  |VJT.04.57|1. Content proofreading and formatting         |PZJ    |2023-10-2|
|    |         |standardization.                               |       |3        |
|58  |VJT.04.58|1. The 0200 vehicle status has been added to   |PZJ    |2023-10-2|
|    |         |the B position.                                |       |4        |
|59  |VJT.04.59|1. Add new energy data items: Vehicle status,  |JJH    |2023-10-2|
|    |         |insulation resistance, battery health status,  |       |7        |
|    |         |maximum cell voltage, minimum cell voltage,    |       |         |
|    |         |unit voltage difference, power level           |       |         |
|60  |VJT.04.60|1. A new feature ID: 0x0210, has been added to |PZJ    |2023-12-0|
|    |         |encapsulate and report BMS data streams.       |       |2        |
|61  |VJT.04.61|1. Function ID: 0x0210, adjust the content     |PZJ    |2023-12-0|
|    |         |accordingly.                                   |       |4        |
|62  |VJT.04.62|1. Function ID: 0x0210, adjusts the voltage    |PZJ    |2023-12-0|
|    |         |unit and temperature description of individual |       |4        |
|    |         |cells.                                         |       |         |
|63  |VJT.04.63|1. The truck data flow has increased by 510F   |Water  |2024-04-2|
|    |         |reference torque value                         |       |2        |
|64  |VJT.04.64|Add a description of hybrid vehicle data items |PZJ    |2024-07-2|
|    |         |in the extended data items for passenger cars. |       |6        |
|    |         |0x6907 Range: For hybrid vehicles, this        |       |         |
|    |         |indicates the combined range of electric and   |       |         |
|    |         |fuel power; for fuel-powered vehicles, it      |       |         |
|    |         |refers to the range of the fuel-powered mode.  |       |         |
|    |         |0x6908 indicates the remaining battery level of|       |         |
|    |         |the hybrid vehicle.                            |       |         |
|    |         |The codes 0x6909 (charging station status) and |       |         |
|    |         |0x690A (charging status) both indicate the     |       |         |
|    |         |operational status of hybrid vehicles.         |       |         |
|    |         |2. In the 0x8105 terminal control, the vehicle |       |         |
|    |         |control commands have been expanded:           |       |         |
|    |         |0xa8 Unlock and power-on command;              |       |         |
|    |         |0x9 command to lock and cut off fuel and power.|       |         |
|    |         |3. In the 0x0200 position information report,  |       |         |
|    |         |the basic data stream's supplementary table    |       |         |
|    |         |0x0011 (Vehicle Status) has been updated to    |       |         |
|    |         |include a new' L gear' position.               |       |         |
|65  |VJT.04.65|Add 0200 extended data item, function ID:      |HYD    |2024-08-1|
|    |         |0x300E,3.80 high-speed rail tire pressure data |       |5        |
|    |         |table                                          |       |         |
|66  |VJT.04.66|In the 0200 data stream, add the YF-customized |PZJ    |2024-08-2|
|    |         |5-high 1-low I/O port detection function       |       |9        |
|    |         |description, and adjust the function ID from   |       |         |
|    |         |(0x0022) to (0x0026).                          |       |         |
|    |         |Format changes                                 |       |         |
|67  |VJT.04.67|WIFI Data Flow Sheet Adjustment                |HYD    |2024-09-0|
|    |         |                                               |       |2        |
|68  |VJT.04.68|Add a custom agreement for the Thailand project|HYD    |2024-09-1|
|    |         |1. In the 0200 extended data item, modify the  |       |0        |
|    |         |function ID: 0x300D to differentiate between   |       |         |
|    |         |the temperature of the Thai project and other  |       |         |
|    |         |project temperatures, and add the following    |       |         |
|    |         |function IDs: 0x3013,0x3014,0x3015.            |       |         |
|    |         |2. Add the card-swiping information data for   |       |         |
|    |         |0252;                                          |       |         |
|69  |VJT.04.69|Modify the appendix_Sedan Extended Data Flow by|HYD    |2024-09-1|
|    |         |adding data items 0x6F05,0x6F06,0x6F07, and    |       |3        |
|    |         |0x6F08                                         |       |         |
|70  |VJT.04.70|1. Added 0x41 in 0900 and 8900 for platform    |PZJ    |2024-09-1|
|    |         |downlink transparent transmission and terminal |       |4        |
|    |         |uplink transparent transmission                |       |         |
|    |         |2. The extended data item in the 0200 extended |       |         |
|    |         |data stream now includes a second ADC          |       |         |
|    |         |acquisition channel labeled "0x3016 Analog     |       |         |
|    |         |Signal Input 2"                                |       |         |
|    |         |3. The status flag of the 0200 data stream now |       |         |
|    |         |includes a field indicating whether            |       |         |
|    |         |differential positioning is enabled.           |       |         |
|71  |VJT.04.71|1. Added 0x42 in 0900 and 8900 to differentiate|HYD    |2024-09-2|
|    |         |between downlink and uplink transparent        |       |4        |
|    |         |transmission for two serial ports.             |       |         |
|    |         |2. Added 0x202C and 0x202D in 8103 to configure|       |         |
|    |         |the serial port baud rate                      |       |         |
|72  |VJT.04.72|According to the 808-2013 standard protocol,   |HYD    |2024-10-1|
|    |         |bits 18-21 in the 0200 status flag definition  |       |2        |
|    |         |are supplemented.                              |       |         |
|73  |VJT.04.73|1. Added the key power switch instruction in   |PZJ    |2024-10-1|
|    |         |the 0x8105 interrupt control instruction, 0xAB |       |2        |
|74  |VJT.04.74|0200 Basic data stream with GPS positioning    |HYD    |2024-10-1|
|    |         |status 0x0027 added                            |       |6        |
|75  |VJT.04.75|0200 Truck Extended Data Stream with Additional|HYD    |2024-10-1|
|    |         |Data Items for Auxiliary Engine of Sanitation  |       |8        |
|    |         |Vehicles (0x5210~0x5216)                       |       |         |
|76  |VJT.04.76|1. New low oil level alarm command 0x0410      |CXQ    |2024-10-2|
|    |         |2. Load of Auxiliary Engine of Sanitation      |       |2        |
|    |         |Vehicle and Threshold of Torque Percentage of  |       |         |
|    |         |Sanitation Vehicle Engine Description Update   |       |         |
|77  |VJT.04.77|1. In the 0200 vehicle status, a new key power |PZJ    |2024-11-0|
|    |         |status has been added to indicate whether the  |       |9        |
|    |         |key is powered off or on.                      |       |         |
|78  |VJT.04.78|1. Remove 0405 and 0406 (4-5 pin               |HYD    |2024-11-1|
|    |         |insertion/withdrawal alarms) from the 0200     |       |1        |
|    |         |alarm ID                                       |       |         |
|79  |VJT.04.79|1. 0x8105 Added BMS Lock Control Command       |PZJ    |2024-11-1|
|    |         |2.0x0200 introduces a new BMS status, including|       |4        |
|    |         |BMS operational status and BMS locked status   |       |         |
|    |         |3. The precision for the maximum and minimum   |       |         |
|    |         |individual cell voltage, as well as the        |       |         |
|    |         |individual cell voltage difference, in the     |       |         |
|    |         |0x0200 modification is 0.001V.                 |       |         |
|    |         |4. The number of individual battery packs in   |       |         |
|    |         |the 0x0210 expansion has been increased from   |       |         |
|    |         |128 to 384.                                    |       |         |
|80  |VJT.04.80|The 0705 command has been added to report      |CXQ    |2024-12-1|
|    |         |collected CAN data streams in accordance with  |       |         |
|    |         |the 808-2013 standard.                         |       |         |
|    |         |Add a function ID 0x2050 to support            |       |         |
|    |         |configuration and query, along with a CAN ID   |       |         |
|    |         |configuration filter table                     |       |         |
|    |         |3. Added a new function ID 0x202E to support   |       |         |
|    |         |configuration and query, with CAN transparent  |       |         |
|    |         |reporting interval during ignition (via ACC    |       |         |
|    |         |cable)                                         |       |         |
|    |         |4. Added a new function ID 0x202F to support   |       |         |
|    |         |configuration and query, with CAN transparent  |       |         |
|    |         |reporting interval when the engine is turned   |       |         |
|    |         |off (via ACC cable)                            |       |         |
|    |         |5. Added a new function ID 0x2030, supporting  |       |         |
|    |         |configuration and query, with buzzer control   |       |         |
|    |         |activated only when ACC is engaged.            |       |         |
|81  |VJT.04.81|1. Add 0x0028 to the 0200 basic data stream,   |PZJ    |2025-01-0|
|    |         |which represents the runtime of the device     |       |8        |
|    |         |during startup. This time is reset to 0 after  |       |         |
|    |         |the device restarts from a power-off state.    |       |         |
|82  |VJT.04.82|1. In the 0200 basic data flow, check if the   |PZJ    |2025-01-1|
|    |         |key detection status exists in the vehicle     |       |8        |
|    |         |status table.                                  |       |         |
|83  |VJT.04.83|Add a three-way catalytic converter data item  |JJH&PZJ|2025-01-2|
|    |         |to the 0200 truck data stream                  |       |0        |
|84  |VJT.04.84|1. Add driver's card-swiping data packet to the|CXQ    |2025-05-2|
|    |         |0200 extended peripheral data stream           |       |9        |
|85  |VJT.04.85|1. In the 0200 new energy vehicle data item:   |CXQ    |2025-07-2|
|    |         |add average voltage, average temperature,      |       |9        |
|    |         |accelerator pedal position, and battery pack   |       |         |
|    |         |capacity                                       |       |         |

```

## Catalogue

**- VJT.04.085 -A  1  1**

## 1. Introduction 10  11

### 1.1 Purpose of Compilation 10 11

### 1.2 Terms and Definitions 10  11

### 1.3 Abbreviations 10    11

### 1.4 Protocol Foundation 11 12

### 1.5 Composition of Messages 12   13

### 1.6 Communication Connections 13 14

### 1.7 Message Processing 14  15

### 1.8 SMS Message Processing 14 15

### 1.9 Protocol Classification 14   15

## 2. Data Format 18   19

### 2.1 [0001] Terminal General Response 18 19

### 2.2 [8001] Platform General Response 18 19

### 2.3 [0002] Terminal heartbeat 18 19

### 2.4 [0100] Terminal Registration 19  20

### 2.5 [0003] Terminal Cancellation 19  20

### 2.6 [0102] Terminal Authentication 19   20

### 2.7 [0200] Location Information Reporting 20   21

### 2.8 [0704] Batch Reporting of Location Information 20   21

### 2.9 [020A] CAN Broadcast Data Stream Reporting 20 21

### 2.10 [0210] New Energy Vehicle BMS Data Flow Report 20  22

### 2.11 [0900] Data uplink transmission 21 22

Vehicle Trip Data  Packet  0xF1  21               Vehicle  Trip  Data
Packet 0xF1 21   22

Vehicle fault code data packet 0xF2 21            Vehicle fault  code
data packet 0xF2 21 22

Vehicle sleep entry data packet 0xF3 21          Vehicle sleep  entry
data packet 0xF3 21 22

Vehicle sleep wake-up data packet 0xF4 21          Vehicle sleep wake-
up data packet 0xF4 21  22

MCU upgrade status feedback packet 0xF6 21         MCU upgrade status
feedback packet 0xF6 21 22

Collision Alarm Description Package 0xF7 21          Collision  Alarm
Description Package 0xF7 21   22

### 2.12 [0205]  Proactively  report  version  information  (non-ministerial

standard) 22  24

### 2.13 [8103] Set terminal parameters 22  24

### 2.14 [8104] Query terminal parameters 22   24

### 2.15 [8201] Location Information Query 23  25

### 2.16 [8300] Text message distribution 23   25

### 2.17 [6006] Text message reply 23    25

### 2.18 [8105] Terminal Control 24  26

### 2.19 [0108] Terminal Upgrade Result Notification 24  26

### 2.20 [0702] Driver Identity Information Collection 24   26

### 2.21 [8202] Temporary Position Tracking Control 24   26

### 2.22 [0252]Terminal report driving license data  25 27

## 3. Appendix 1: 26   28

### 3.1 Appendix_Terminal General Response 26  28

### 3.2 Appendix_Platform General Responses 26 28

### 3.3 Appendix_Terminal Registration Message Body 26   28

### 3.4 Appendix_Terminal Registration Response Message Body 26 28

### 3.5 Appendix_Terminal Authentication Message Body 26 28

### 3.6 Appendix_Terminal Parameter Message Body 27   29

### 3.7 Appendix_Parameter Item Format 27   29

### 3.8 Appendix_Terminal Parameter Settings Definition 27  29

### 3.9 Appendix: WIFI Parameters Appendix 32  35

### 3.10 Appendix_Emergency Acceleration Parameters 32   35

### 3.11 Appendix_Emergency Deceleration Parameters 32   35

### 3.12 Appendix_急拐弯参数 32   35

### 3.13 Appendix_Terminal Upgrade Data Package 33 36

### 3.14 Appendix_Platform Upgrade Data Package Response 33 36

### 3.15 Appendix_Traffic Alarm Parameters 33  36

### 3.16 Appendix_ Collision Alarm Parameter Package 33  36

### 3.17 Appendix Privilege Number List 33  36

### 3.18 Appendix_Query Terminal Parameter Response Message Body 34   37

### 3.19 Appendix_ Terminal Control Message Body 34   37

### 3.20 Appendix_Terminal Control Command Word Description Table 34  37

### 3.21 Appendix_Terminal Control Response Message Body 34 38

### 3.22 Appendix_Terminal Control Response Appendix 35  38

### 3.23 Appendix_Terminal Control Response Results Appendix 35 38

### 3.24 Appendix Command Parameter Format 36  39

### 3.25 Appendix_Driver Information Collection Appendix 37 40

### 3.26 Appendix_Temporary Location Tracking Control Message Body 37 40

### 3.27 Appendix_Terminal Upgrade Result Data Package 37   41

### 3.28 Appendix_Position Information  Query  Response  Message  Body  Data

Format 39 42

### 3.29 Appendix_Batch Reporting Package for Location Data 39  42

### 3.30 Appendix_Format of Batch Reporting Data Items for Location 39    42

### 3.31 Appendix_Position Data Information Body 39   42

### 3.32 Appendix Status Flag Definitions 40   43

### 3.33 Appendix_Symbol Definition 40   43

### 3.34 Appendix_Position Additional Information Table 42  45

### 3.35 Appendix_Specification of Additional Information 42    45

### 3.36 Appendix_Basic Data Flow 43 46

### 3.37 Appendix_Sedan Extended Data Flow 45  49

### 3.38 Appendix_Extended Data Flow for Freight Trucks 47  51

### 3.39 Appendix_ New Energy Vehicle Data Flow 50 55

### 3.40 Appendix Extended Peripheral Data Flow 51 57

### 3.41 Appendix_Alarm Command ID and Description Item 52  58

### 3.42 Appendix_Base Station Data Flow 54 59

### 3.43 Appendix_Basic Data Items: Accelerometer 54  60

### 3.44 Appendix_Basic Data Items: Total Mileage Format Table 54  60

### 3.45 Appendix_Basic Data Items: Cumulative Mileage 2 Format Table 55  60

### 3.46 Appendix_Basic Data Items: Total Fuel Consumption Format  Table  55

61

### 3.47 Appendix_Basic Data Items: Accelerometer 56  62

### 3.48 Appendix_Basic Data Items: Agreement Type Table 56 62

### 3.49 Appendix_Basic Data Items: Vehicle Status Table 56 62

### 3.50 Appendix_Alarm Description: Idle Speed Alarm Description 58  64

### 3.51 Appendix_Alarm Description: Speed Exceeding Alarm Description 58 64

### 3.52 Appendix_Alarm Description: Fatigue Driving Alarm Description 58 64

### 3.53 Appendix_Signal  Description:  Water  Temperature   Excess   Alarm

Description 58   64

### 3.54 Appendix Extended Peripheral Data: H600  Video  Status  Information

Table 59  65

### 3.55 Appendix Extended Peripheral Data: H600 Input Signal Count 60    66

### 3.56 Appendix Extended Peripheral Data: Tire Pressure Data Table 60   66

### 3.57 Appendix_Weight Sensor Data Sheet 61  67

### 3.58 Appendix_External Oil Sensitivity Data Table 62 68

### 3.59 Appendix_Fire Truck Route 6 Data Collection Table 62   68

### 3.60 Appendix Version Information Package 63   69

### 3.61 Appendix_Specification Response 63 69

### 3.62 Appendix_Text Information Distribution Message Body 63 69

### 3.63 Appendix_Text Information Flag Meaning 63 69

### 3.64 Appendix_Text Information Message Body 63 69

### 3.65 Appendix_Upload Data Message Body 64  70

### 3.66 Appendix_Definition of Message Types 64   70

### 3.67 Appendix A_Driving Trip Data Package F1 65   71

### 3.68 Appendix_Dynamic Information Table of Driving Trip Data 65   71

### 3.69 Appendix_Specification Table Fault Code Data Packet F2 66 72

### 3.70 Appendix_Sleeping into Data Packet F3 67  73

### 3.71 Appendix_Sleep Wakeup Data Packet F4 67   73

### 3.72 Appendix: Feedback Package on MCU Upgrade Status (F6 67)  73

### 3.73 Appendix_Suspected Collision Alarm Description Package F7 68 74

### 3.74 Appendix CAN Broadcast Data Stream 68 68

### 3.75 Appendix_ New Energy Vehicle BMS Data Information Body 69 75

### 3.76 Appendix_ New Energy Vehicle BMS Data Flow 69   75

### 3.77 Appendix_ New Energy Vehicle BMS Data  Flow:  Single  Battery  Pack

Voltage Data Table 69   75

### 3.78 Appendix: New Energy Vehicle BMS Data Flow – Temperature Data Table

for Single Battery Pack 70 77

### 3.79 Appendix Wifi Data Flow 71  78

### 3.80 Appendix Extended Peripheral Data: High-Speed  Rail  Tire  Pressure

Data Table 71 79

### 3.81 Schedule_Input and Output Status Table    72 72

### 3.82 Schedule_Driving Licence Data Packets(Nbytes)   73 81

### 3.83 Track 1-3 information※   74 82

## 4. Appendix II: Example 74 82

### 4.1 Example of a transfer function: 74  82

### 4.2 Example of Inverted Sense Function: 75 83

### 4.3 [0200] Position Data Analysis Details 76   84

### 4.4 [0900] Transmission of Upstream Data Analysis Details 76   84

### 4.5 [8300]Text Information Data Analysis Details 76  84

## Brief Introduction

1 Purpose of writing

This document extends the OBD  related  functions  based  on  the  JT/T  808
standard protocol.

The JT/T 808 standard specifies  the  communication  protocol  and  data
format  between  the  satellite  positioning  system  terminal  (hereinafter
referred  to  as  the  terminal)  and  the  supervision/monitoring  platform
(hereinafter referred to as the platform) for road  transport  vehicles.  It
covers  the   protocol   foundation,   communication   connection,   message
processing,  protocol  classification  and  description,  as  well  as  data
format.

OBD function: An extended data  capability  for  the  Departmental  Standard
Protocol.

2 Terms and Definitions

a) Abnormal data communication link

The   wireless   connection   is   disconnected    or
temporarily suspended (e.g., during a call).

b) The registered terminal sends a message to the platform to  notify  its
installation on a specific vehicle.     b) The registered terminal  sends  a
message to the platform to notify its installation on a specific vehicle.

c) Unregister: The terminal sends a message to the platform to notify  its
removal from the installed vehicle.     c) Unregister: The terminal sends  a
message to the platform to notify its removal from the installed vehicle.

d) Authentication: When a terminal connects to the platform,  it  sends  a
message to the platform to verify its identity.   d) Authentication: When  a
terminal connects to the platform, it sends a message  to  the  platform  to
verify its identity.

e)  Location  reporting  strategy:  periodic   reporting,   fixed-distance
reporting, or a combination of both.

f) The  Location  Reporting  Program  establishes  rules  for  determining
periodic reporting intervals based on relevant conditions.

g) Report additional points during the turning process

The terminal transmits position update messages upon  detecting  vehicle
cornering. The sampling rate must  be  at  least  1Hz,  with  the  vehicle's
azimuth rate of change not less than 15°/s.

The duration should be at least 3 seconds.

h) Answering strategy: The rules for automatically or  manually  answering
calls on the terminal.

i) SMS  text  alarm:  The  terminal  sends  text  messages  via  SMS  when
triggering an alarm.

j) Event item

Event items are set from the platform to the terminal and consist of  an
event code and event name. When a driver encounters a  corresponding  event,
they operate the terminal to trigger event reporting.

Send to the platform.

3 abbreviation

APN—Access Point Name

GZIP — a GNU Free Software file compression program (GNUzip)

LCD – Liquid Crystal Display

RSA, an asymmetric cryptographic algorithm developed by Ron Rivest,  Adi
Shamir, and Len Adleman, is named after the three of them.

SMS-Short Message Service (Short Message Protocol)

TCP (Transmission Control Protocol)

TTS—Text to Speech

UDP-User Datagram Protocol

VSS—Vehicle Speed Sensor

4 Protocol base

#### 1.4.1 Communication Methods

The  protocol's  communication  method  must  comply   with   the   relevant
provisions of JT/T 794, using either TCP or UDP. The platform serves as  the
server,  while  the  terminal  acts  as  the  client.  In   case   of   data
communication link failures, the terminal may resort to  SMS  messaging  for
communication.

#### 1.4.2 Data Types

Data types used in the protocol message:

```text
|data type  |Description and Requirements                               |
|BYTE       |unsigned single-byte integer (byte, 8 bits)                |
|WORD       |unsigned double-byte integer (word, 16 bits)               |
|DWORD      |unsigned four-byte integer (double, 32-bit)                |
|BYTE[n]    |n byte                                                     |
|BCD[n]     |8421 characters, n bytes                                   |
|STRING     |GBK encoding uses a 0 as the end marker. If no data is     |
|           |present, a 0 is placed at the end.                         |

```

#### 1.4.3 Transmission Rules

The protocol employs big-endian byte order for transmitting  single  and
double words.

The agreement is as follows:

- Byte transmission protocol: Data is transmitted in byte streams.

- The data transfer protocol for WORD: transmit the high  8  bits  first,
then the low 8 bits.

- Two-byte (DWORD) transfer convention: transmit the high 24 bits  first,
then the high 16 bits, followed by the high 8 bits, and finally  the  low  8
bits.

5 Message composition

#### 1.5.1 Message Structure

Each message consists of an identifier, header, body, and  checksum,  as
shown in Figure 1.

```text
|marker |function ID|headers     |message body|check code  |marker      |

```

Figure 1 Message structure

```text
|GPRS packet format                                                      |
|marker|funct|headers                                 |packe|verif|marker|
|      |ion  |                                        |t    |icati|      |
|      |ID   |                                        |     |on   |      |
|marker   |function ID|Message   |End phone number                           |
|         |           |Properties|                                           |
|0        |Message    |WORD      |See Figure 2 for the message body property |
|         |body       |          |format structure diagram                   |
|         |properties |          |                                           |
|2        |End phone  |BCD[6]    |Converts the phone number based on the     |
|         |number     |          |terminal's own number after installation.  |
|         |           |          |If the number is less than 12 digits, it   |
|         |           |          |supplements digits at the beginning. For   |
|         |           |          |mainland China numbers, it supplements     |
|         |           |          |digits with 0. For Hong Kong, Macao, and   |
|         |           |          |Taiwan numbers, it supplements digits      |
|         |           |          |according to their area codes.             |
|8        |message    |WORD      |Increment from 0 in the order of sending   |
|         |sequence   |          |                                           |
|         |number     |          |                                           |
|10       |message    |          |If the relevant flag in the message body   |
|         |packet     |          |attributes determines that the message is  |
|         |header     |          |to be processed as a subpacket, this item  |
|         |           |          |has content; otherwise, it has no content. |

```

Message body properties:

The message body property format structure diagram is shown in Figure 2:

```text
|15     |14   |13          |12                                          |

```

Figure 2 Message Body Attribute Format Structure Diagram

Data encryption method:

- bit10-bit12 are the data encryption identifier bits;

- When all three values are 0, the message body is unencrypted.

- When the 10th bit is 1, it indicates the message body has been
encrypted using the RSA algorithm.

- When the 12th bit is 1, it indicates the message body has been
encrypted using the SM4 algorithm.

The SM4 algorithm encrypts only the message body in both the 0200
position report data and the 0704 batch report data, with the message body
length matching the encrypted length.

SM4 encryption is used, and all server data downlinks do not require
encryption.

- Other reservations.

subpackage ：

When the 13th bit of the message body attribute is 1, the message body
is a long message and is processed for packetization. The specific
packetization information is determined by the message packet encapsulation
field.

If the 13th bit is 0, the message header contains no packet
encapsulation field.

Message packet header content

```text
|Start byte|field    |data type       |Description and Requirements    |
|0         |Total    |WORD            |Total number of subcontracts    |
|          |message  |                |after message splitting         |
|          |packages |                |                                |
|2         |Package  |WORD            |Start from 1                    |
|          |number   |                |                                |

```

#### 1.5.4 Verification Code

The checksum is calculated by XORing the subsequent byte from the
function ID until the byte before the checksum, occupying one byte.

6 communication junction

#### 1.6.1 Connection Establishment

The terminal and platform can maintain daily data connections via TCP or
UDP. After resetting, the terminal must establish a connection with the
platform promptly.

After the connection is established, the terminal immediately sends an
authentication message to the platform for verification.

#### 1.6.2 Maintenance of Connections

After successful connection establishment and terminal authentication,
the terminal should periodically send heartbeat messages to the platform.
Upon receiving these messages, the platform will...

The terminal sends a generic response message to the platform, with the
sending cycle determined by terminal parameters.

#### 1.6.3 Disconnection of Connection

Both the platform and the terminal can actively disconnect the
connection based on the TCP protocol, and both parties should
proactively determine whether the TCP connection has been terminated.

How the platform detects a TCP connection termination:

- The TCP protocol detects the terminal has initiated a connection
termination.

A new connection is established with the same identity, indicating
the original connection has been disconnected.

- No messages from the terminal are received within a specified time,
such as heartbeat signals.

How the terminal determines if the TCP connection is disconnected:

- The platform is detected as actively disconnecting based on TCP
protocol.

- The data communication link is disconnected.

The data communication link is functioning normally, but the
retransmission limit has been reached without receiving a response.

7 message handling

#### 1.7.1 TCP and UDP Message Processing

##### 1.7.1.1 Messages from the platform owner

All messages originating from platform hosts require terminal responses,
categorized as either general or specific responses based on individual
functional protocols. When the sender's response timeout occurs, the
message must be retransmitted. Both the timeout duration and retransmission
count are platform-defined parameters. The formula for calculating the
response timeout duration after each retransmission is provided in Equation
(1):

TN+1=TN*(N+1)         …………(1)         …………(1)

In the formula:

TN+1-the timeout time for each retransmission response;

TN-the last response timeout time;

N-Number of retransmissions.

#### 1.7.2 Terminal Master Message

##### 1.7.2.1 The data communication link is normal

When the data communication link is operational, all messages initiated
by the terminal require platform acknowledgment. Acknowledgments are
categorized into general and specific types, determined by individual
functional protocols. If the terminal fails to receive an acknowledgment
within the timeout period, it must retransmit the message. The timeout
duration and retransmission count are defined by terminal parameters, with
the subsequent timeout time calculated using Equation (1). For critical
alarm messages sent by the terminal, if no acknowledgment is received after
the specified retransmission limit, the message should be archived.
Subsequent messages must first send this archived critical alarm message
before transmission.

##### 1.7.2.2 Abnormal Data Communication Link

When the data communication link fails, the terminal should save the
location report message to be sent. Once the data communication link is
restored, the saved message should be sent immediately.

8 SMS message handling

When switching the terminal communication mode to SMS via GSM network,
the PDU 8-bit encoding method is adopted. For messages exceeding 140 bytes,
they should be processed as packets according to the GSM SMS service
standard GSM 03.40.

The response, retransmission, and storage mechanisms for SMS messages
follow those in Section 6.1, but the response timeout duration and
retransmission attempts must be configured according to the parameter IDs
0x0006 and 0x0007.

9 Protocol Classification

summary

The protocol is categorized by function below. Unless otherwise
specified, TCP communication is the default method. For communication
between the vehicle terminal and external devices, refer to Appendix A.
Appendix B provides the message name-to-ID mapping table in the protocol.
The protocol is categorized by function below. Unless otherwise specified,
TCP communication is the default method. For communication between the
vehicle terminal and external devices, refer to Appendix A. Appendix B
provides the message name-to-ID mapping table in the protocol.

#### 1.9.1 Terminal Management Protocol

##### 1.9.1.1 Terminal Registration/Unregistration

When a terminal is unregistered, it must first complete registration.
Upon successful registration, the terminal will receive and store an
authentication code, which is used to authenticate the terminal during
login.
Before removing or replacing a terminal, the terminal must be
deregistered to cancel the association between the terminal and the
vehicle.
When a terminal opts to send registration and deregistration messages
via SMS, the platform must respond to the registration request and
deregistration request through SMS.
Reply by sending a platform-wide response via SMS to the terminal's
logout.

##### 1.9.1.2 Terminal Authentication

After registration, the terminal must authenticate immediately each time
it connects to the platform. The terminal cannot send any messages until
authentication is successful.

The terminal authenticates by sending an authentication message, and the
platform responds with a standard acknowledgment message.

##### 1.9.1.3 Set/Query Terminal Parameters

The platform sets terminal parameters by sending configuration messages,
and the terminal responds with a standard acknowledgment message. The
platform then queries terminal parameters through...
The terminal queries the terminal parameters and responds with a
parameter response message. Terminals operating on different network
standards should support specific parameters unique to their respective
networks.

##### 1.9.1.4 Terminal Control

The platform controls the terminal by sending terminal control messages,
and the terminal responds with a terminal common response message.

#### 1.9.2 Location/Alarm Protocols

##### 1.9.2.1 Location Information Reporting

The terminal sends periodic location information report messages
according to the parameter setting.

According to the parameter control, the terminal can send the
location information report message when it judges the vehicle turning.

##### 1.9.2.2 Location Information Query

The platform sends a location query message to retrieve the real-time
position data of a designated in-vehicle terminal, which then responds
with a location query reply message.

##### 1.9.2.3 Temporary Position Tracking Control

The platform initiates or terminates location tracking by sending
temporary location tracking control messages. Location tracking requires
the terminal to stop previous periodic reporting and proceed according to
the cancellation process.

The system reports at the specified time intervals. The terminal
responds with a universal response message.

##### 1.9.2.4 Terminal Alarm

When the terminal determines that the alarm conditions are met, it sends
a location report message and sets the corresponding alarm flag in the
message. The platform can then...

Reply the platform's general response message to trigger an alarm.

See the description in the location information report message body for
each alarm type. The alarm flag remains active until the alarm condition is
resolved.

Send the location report immediately and clear the alarm flag.

#### 1.9.3 Information Protocols

##### 1.9.3.1 Text message distribution

The platform sends text messages to notify drivers as specified. The
terminal responds with a standard response message.

##### 1.9.3.2 Event Settings and Reporting

The platform sends event-triggered messages to the terminal for
storage. When a driver encounters a relevant event, they can access the
event list interface.

The terminal then selects an option, and after selection, sends an
event report message to the platform.

To send an event message, the terminal must respond with a general
response message.

The event report message requires the platform to respond with a
standard reply.

##### 1.9.3.3 Questioning

The platform sends questions with candidate answers to the terminal
via messaging. The terminal displays the questions immediately, and
after the driver selects an answer, the terminal sends the selection
back to the platform.

Send a question and response message. The terminal must reply with a
standard response message when a question is sent.

##### 1.9.3.4 Collecting driving record data

The platform sends a command message to collect driving record data,
requiring the terminal to upload the specified data. The terminal must
respond with the number of driving records.

According to the uploaded message.

##### 1.9.3.5 Information on Demand

The platform sends a message via the on-demand menu settings to store
the on-demand item list on the terminal. Drivers can select on-demand
items through the menu.

Cancel the corresponding information service. After selection, the
terminal sends a message to the platform for on-demand or cancellation.

After subscribing to information services, users will receive regular
updates from the platform, including news and weather forecasts.

To set the message for the information on-demand menu, the terminal
must respond with a general response message.

To request information on-demand or cancel a message, the platform
must respond with a standard reply.

The message requires a terminal to respond with a common response
message.

#### 1.9.4 Telephone Protocols

##### 1.9.4.1 Call Back

The platform sends a callback message to request the terminal to
return the call to a specified number and to choose whether to monitor
the call.

(The device does not turn on the speaker). The phone call back
message requires the device to respond with a device-wide response
message.

##### 1.9.4.2 Set up the phone book

The platform sends a contact book configuration message to set up the
terminal's contact book, which requires the terminal to respond with a
standard acknowledgment message.

#### 1.9.5 Vehicle Control Protocols

The platform sends vehicle control messages to instruct the terminal
to perform specified operations on the vehicle. Upon receiving the
message, the terminal immediately responds with a standard response
message. The terminal then controls the vehicle and sends a vehicle
control response message based on the results.    The platform sends
vehicle control messages to instruct the terminal to perform specified
operations on the vehicle. Upon receiving the message, the terminal
immediately responds with a standard response message. The terminal then
controls the vehicle and sends a vehicle control response message based
on the results.

#### 1.9.6 Vehicle Management Agreement

The platform enables terminal devices to configure zones and routes
by sending configuration messages for circular, rectangular, polygonal
areas, and routes. The terminal evaluates whether alarm conditions are
met based on zone and route attributes, including speed limit
violations, zone/route entry/exit alerts, and insufficient/overlong
segment duration alerts. The location information and report messages
must include corresponding positional details.    The platform enables
terminal devices to configure zones and routes by sending configuration
messages for circular, rectangular, polygonal areas, and routes. The
terminal evaluates whether alarm conditions are met based on zone and
route attributes, including speed limit violations, zone/route
entry/exit alerts, and insufficient/overlong segment duration alerts.
The location information and report messages must include corresponding
positional details. The platform enables terminal devices to configure
zones and routes by sending configuration messages for circular,
rectangular, polygonal areas, and routes. The terminal evaluates whether
alarm conditions are met based on zone and route attributes, including
speed limit violations, zone/route entry/exit alerts, and
insufficient/overlong segment duration alerts. The location information
and report messages must include corresponding positional details.
The range for a region or route ID is 1-0XFFFFFFFF. If the ID you set
duplicates an existing region or route ID on the device, the existing
one will be updated.   The range for a region or route ID is 1-
0XFFFFFFFF. If the ID you set duplicates an existing region or route ID
on the device, the existing one will be updated.
The platform can also delete saved areas and routes on the terminal
by removing circular, rectangular, polygonal regions, or routes.  The
platform can also delete saved areas and routes on the terminal by
removing circular, rectangular, polygonal regions, or routes.
To set or delete area and route messages, the terminal must respond
with a general response message.

#### 1.9.7 Information Collection Protocols

##### 1.9.7.1 Collect driver identity information data

The terminal collects the driver's identity information, uploads the
data to the platform for identification, and the platform responds with
a success or failure message.

##### 1.9.7.2 Collecting Electronic Waybill Data

The terminal collects the data of the electronic waybill and uploads
it to the platform.

##### 1.9.7.3 Download driving record parameters

The platform sends a command message with driving record parameters
to request the terminal to upload specified data. The terminal must
respond with a standard response.

Reply to the message.

#### 1.9.8 Multimedia Protocols

##### 1.9.8.1 Upload multimedia event information

When a terminal initiates video or audio recording due to a specific
event, it must upload the multimedia event message after the event
occurs. The platform must respond with a standard reply message.  When a
terminal initiates video or audio recording due to a specific event, it
must upload the multimedia event message after the event occurs. The
platform must respond with a standard reply message.

##### 1.9.8.2 Multimedia Data Upload

The terminal transmits a multimedia data upload request and uploads
the multimedia data. Each complete multimedia data packet must be
appended with a location report message indicating the recording time,
referred to as location multimedia data. The platform sets a timeout
duration based on the total number of data packets. Upon receiving all
packets or reaching the timeout, the platform sends a multimedia data
upload acknowledgment to the terminal. This message either confirms
receipt of all packets or requests the terminal to retransmit specified
packets.  The terminal transmits a multimedia data upload request and
uploads the multimedia data. Each complete multimedia data packet must
be appended with a location report message indicating the recording
time, referred to as location multimedia data. The platform sets a
timeout duration based on the total number of data packets. Upon
receiving all packets or reaching the timeout, the platform sends a
multimedia data upload acknowledgment to the terminal. This message
either confirms receipt of all packets or requests the terminal to
retransmit specified packets. The terminal transmits a multimedia data
upload request and uploads the multimedia data. Each complete multimedia
data packet must be appended with a location report message indicating
the recording time, referred to as location multimedia data. The
platform sets a timeout duration based on the total number of data
packets. Upon receiving all packets or reaching the timeout, the
platform sends a multimedia data upload acknowledgment to the terminal.
This message either confirms receipt of all packets or requests the
terminal to retransmit specified packets.  The terminal transmits a
multimedia data upload request and uploads the multimedia data. Each
complete multimedia data packet must be appended with a location report
message indicating the recording time, referred to as location
multimedia data. The platform sets a timeout duration based on the total
number of data packets. Upon receiving all packets or reaching the
timeout, the platform sends a multimedia data upload acknowledgment to
the terminal. This message either confirms receipt of all packets or
requests the terminal to retransmit specified packets.

##### 1.9.8.3 The camera immediately captures the scene

The platform sends an instant camera capture command message to the
terminal, which must respond with a standard acknowledgment message. If
real-time upload is specified, the terminal captures and uploads the
camera image/video; otherwise, it stores the image/video.   The platform
sends an instant camera capture command message to the terminal, which
must respond with a standard acknowledgment message. If real-time upload
is specified, the terminal captures and uploads the camera image/video;
otherwise, it stores the image/video.

##### 1.9.8.4 Recording starts

The platform sends a recording start command message to the device,
which must respond with a device-specific acknowledgment. If real-time
upload is specified, the device records and uploads the audio data;
otherwise, it stores the audio data. The platform sends a recording
start command message to the device, which must respond with a device-
specific acknowledgment. If real-time upload is specified, the device
records and uploads the audio data; otherwise, it stores the audio data.

##### 1.9.8.5 Retrieving and Extracting Multimedia Data from Terminal Storage

The platform sends a multimedia data retrieval message to obtain the
status of multimedia data storage on the terminal, and the terminal must
respond with a multimedia data retrieval response message.  The platform
sends a multimedia data retrieval message to obtain the status of
multimedia data storage on the terminal, and the terminal must respond
with a multimedia data retrieval response message.

According to the retrieval results, the platform can send a message
to request the terminal to upload specified multimedia data, and the
terminal must respond with a general response message.  According to the
retrieval results, the platform can send a message to request the
terminal to upload specified multimedia data, and the terminal must
respond with a general response message.

#### 1.9.9 General Data Transfer Class

Messages not defined in the protocol but required in practice can be
transmitted via uplink and downlink data relay messages. Terminals may
compress longer messages using the GZIP algorithm and upload them as
compressed data. Messages not defined in the protocol but required in
practice can be transmitted via uplink and downlink data relay messages.
Terminals may compress longer messages using the GZIP algorithm and
upload them as compressed data.

#### 1.9.10 Encryption Protocols

To enable encrypted communication between the platform and the
terminal, the RSA public key cryptography system can be adopted. The
platform sends its RSA public key to the terminal, and the terminal
reciprocally responds with its RSA public key.    To enable encrypted
communication between the platform and the terminal, the RSA public key
cryptography system can be adopted. The platform sends its RSA public
key to the terminal, and the terminal reciprocally responds with its RSA
public key.

## Data Format

1 [0001] Terminal General Response

[Function Description]: Terminal General Response Message Body Data

[ up ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |00 01  |message   |terminal general response |XOR   |7E       |
|       |       |attachment|schedule                  |      |         |

```

2 [8001] Platform General Response

[Function Description]: Platform General Response Message Body Data

[ down ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |80 01  |message   |Platform General Response |XOR   |7E       |
|       |       |attachment|Appendix                  |      |         |

```

3 [0002] Terminal heartbeat

[Function Description] Terminal heartbeat packet reporting

[ up ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |00 02  |message   |not have                  |XOR   |7E       |
|       |       |attachment|                          |      |         |

```

[ down ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |80 01  |message   |Platform General Response |XOR   |7E       |
|       |       |attachment|                          |      |         |

```

4 [0100] Terminal registration

[Function Description] Terminal registration message body data

[ up ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |01 00  |message   |terminal registration     |XOR   |7E       |
|       |       |attachment|message body              |      |         |

```

[ down ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |81 00  |message   |terminal registration     |XOR   |7E       |
|       |       |attachment|response message body     |      |         |

```

5 [0003] Terminal logout

[Function Description] The terminal logout message body is empty

[ up ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |00 03  |message   |not have                  |XOR   |7E       |
|       |       |attachment|                          |      |         |

```

[ down ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |80 01  |message   |Platform General Response |XOR   |7E       |
|       |       |attachment|                          |      |         |

```

6 [0102] Terminal authentication

[Function Description] Terminal Authentication Message Body Data

[ up ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |01 02  |message   |terminal authentication   |XOR   |7E       |
|       |       |attachment|message body              |      |         |

```

[ down ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |80 01  |message   |Platform General Response |XOR   |7E       |
|       |       |attachment|                          |      |         |

```

7 [0200] Location Information Reporting

[Function Description] The location report message body consists of
basic location information and a list of additional location information
items.

[ up ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |02 00  |message   |position data message body|XOR   |7E       |
|       |       |attachment|                          |      |         |

```

[ down ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |80 01  |message   |Platform General Response |XOR   |7E       |
|       |       |attachment|                          |      |         |

```

8 [0704] Batch location report

[Function Description] Batch Reporting of Location Information

[ up ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |07 04  |message   |Batch Report Package for  |XOR   |7E       |
|       |       |attachment|Location Data             |      |         |

```

[ down ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |80 01  |message   |Platform General Response |XOR   |7E       |
|       |       |attachment|                          |      |         |

```

9 [0705] CAN broadcast data stream report

[Function Description] Collect CAN data streams from the bus

[ up ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |07 05  |message   |CAN broadcast data stream |XOR   |7E       |
|       |       |attachment|(Departmental Standard    |      |         |
|       |       |          |808-2013)                 |      |         |

```

[ down ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |80 01  |message   |Platform General Response |XOR   |7E       |
|       |       |attachment|                          |      |         |

```

10 [020A] CAN Broadcast Data Stream Report

[Function Description] Customizes the CAN data stream obtained from the
acquisition bus

[ up ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |02 0A  |message   |CAN broadcast data stream |XOR   |7E       |
|       |       |attachment|[Custom feature]          |      |         |

```

[ down ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |80 01  |message   |Platform General Response |XOR   |7E       |
|       |       |attachment|                          |      |         |

```

11  [0210] New Energy Vehicle BMS Data Stream Reporting

[Function Description] Customized functionality for processing the BMS
data stream from new energy vehicles via the acquisition bus.

[ up ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |02 10  |message   |New Energy Vehicle BMS    |XOR   |7E       |
|       |       |attachment|Data Information Body     |      |         |

```

[ down ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |80 01  |message   |Platform General Response |XOR   |7E       |
|       |       |attachment|                          |      |         |

```

12 [0900] data uplink transparent transmission

Vehicle journey data packet 0xF1               Vehicle  journey  data
packet 0xF1

Vehicle fault code data packet  0xF2             Vehicle  fault  code
data packet 0xF2

Vehicle sleep entry data packet  0xF3           Vehicle  sleep  entry
data packet 0xF3

Vehicle sleep wake-up data packet 0xF4          Vehicle sleep wake-up
data packet 0xF4

MCU upgrade status feedback packet 0xF6         MCU upgrade status
feedback packet 0xF6

Collision Alarm Description Package 0xF7          Collision Alarm
Description Package 0xF7

[Function Description] Data uplink transparent message body data

[ up ]

```text
|charact|functio|headers    |message body             |verifi|character|
|eristic|n ID   |           |                         |cation|istic    |
|7E     |09 00  |message    |Data Transmission Message|XOR   |7E       |
|       |       |attachment |Body Appendix            |      |         |

```

[ down ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |80 01  |message   |Platform General Response |XOR   |7E       |
|       |       |attachment|                          |      |         |

```

13 [8900] Downlink data transmission

[Function Description] Data uplink transparent message body data

[ up ]

```text
|charact|functio|headers    |message body             |verifi|character|
|eristic|n ID   |           |                         |cation|istic    |
|7E     |89 00  |message    |Data Transmission Message|XOR   |7E       |
|       |       |attachment |Body Appendix            |      |         |

```

[ down ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |00 01  |message   |terminal general response |XOR   |7E       |
|       |       |attachment|                          |      |         |

```

14 [0205] Proactively report version information (non-ministerial standard)

[Function Description] Includes key data such as software version,
software release date, module model, total mileage, total fuel consumption,
and VIN code.

[ up ]

```text
|charact|functio|headers   |message body               |verifi|character|
|eristic|n ID   |          |                           |cation|istic    |
|7E     |02 05  |message   |version information package|XOR   |7E       |
|       |       |attachment|                           |      |         |

```

[ down ]

```text
|charact|functio|headers   |message body               |verifi|character|
|eristic|n ID   |          |                           |cation|istic    |
|7E     |82 05  |message   |version information packet |XOR   |7E       |
|       |       |attachment|response                   |      |         |

```

15 [8103] Set terminal parameters

[Function  Description]:  Set  the  message  body  data   for   terminal
parameters.

[ down ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |81 03  |message   |terminal parameter message|XOR   |7E       |
|       |       |attachment|body attachment           |      |         |

```

[ up ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |00 01  |message   |uplink common response    |XOR   |7E       |
|       |       |attachment|                          |      |         |

```

16 [8104] Query terminal parameters

[Function Description]: The query terminal  parameter  message  body  is
empty.

[ down ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |81 04  |message   |empty                     |XOR   |7E       |
|       |       |attachment|                          |      |         |

```

[ up ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |01 04  |message   |Query terminal parameter  |XOR   |7E       |
|       |       |attachment|response message body     |      |         |
|       |       |          |appendix                  |      |         |

```

17 [8201] Location query

[Function Description]: The location query message body is empty.

[ down ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |82 01  |message   |empty                     |XOR   |7E       |
|       |       |attachment|                          |      |         |

```

[ up ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |02 01  |message   |Appendix of Location      |XOR   |7E       |
|       |       |attachment|Information Query Response|      |         |
|       |       |          |Data                      |      |         |

```

18 [8300] Text message delivery

[Function Description]: Distributes text message content to the
recipient. (Set to SMS or TTS broadcast)

[ down ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |83 00  |message   |Text message body         |XOR   |7E       |
|       |       |attachment|attachment                |      |         |

```

[ up ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |00 01  |message   |uplink common response    |XOR   |7E       |
|       |       |attachment|                          |      |         |

```

19 [6006] Text message reply

[Function Description]: Send text message data on the terminal device

[ up ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |60 06  |message   |Text message body         |XOR   |7E       |
|       |       |attachment|attachment                |      |         |

```

[ down ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |80 01  |message   |Platform General Response |XOR   |7E       |
|       |       |attachment|                          |      |         |

```

20 [8105] Terminal Control

[Function Description]: Terminal control message body data format.

[ down ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |81 05  |message   |terminal control message  |XOR   |7E       |
|       |       |attachment|body appendix             |      |         |

```

[ up ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |00 01  |message   |terminal general response |XOR   |7E       |
|       |       |attachment|                          |      |         |

```

The terminal control for specific types requires the control result
0x0105 to be supplemented. Upon receiving the control command, it sends
0x0001 back to the platform to indicate receipt.

After executing the control command, the result is reported to the
platform via 0x0105.

[ up ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |01 05  |message   |terminal control response |XOR   |7E       |
|       |       |attachment|message body              |      |         |

```

21 [0108] Terminal Upgrade Result Notification

[ message ID]：0x0108。

[Function Description]: After the terminal upgrade is completed, this
command notifies the monitoring center.

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |01 08  |message   |Upgrade result data       |XOR   |7E       |
|       |       |attachment|package                   |      |         |

```

22 [0702]Driver Identity Information Collection

[ message ID]：0x0702。

[Function Description]: Upon receiving the 0X8702 command, the terminal
automatically responds with the 0702 driver information collection package,
or automatically reports the 0702 driver information package during
registration and deregistration.

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |07 02  |message   |Driver's Identity         |XOR   |7E       |
|       |       |attachment|Information Appendix      |      |         |

```

23 [8202]Temporary Location Tracking Control

[ message ID]：0x8202。

[Function Description]: Temporarily tracks and controls the message body
data.

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |82 02  |message   |temporary location        |XOR   |7E       |
|       |       |attachment|tracking message body     |      |         |

```

24 2.22  [0252]Terminal report driving license data

[Function Description]Terminalreport driving license data when  first
swipe card

Uplink

[ up ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |02 52  |message   |drving license Data       |XOR   |7E       |
|       |       |attachment|packets                   |      |         |

```

[ down ]

```text
|charact|functio|headers   |message body              |verifi|character|
|eristic|n ID   |          |                          |cation|istic    |
|7E     |80 01  |message   |Platform General Response |XOR   |7E       |
|       |       |attachment|                          |      |         |

```

Appendix 1:

1 Appendix Terminal General Response

```text
|Start   |field       |data type|Description and Requirements            |
|byte    |            |         |                                        |
|0       |Response    |WORD     |The serial number of the corresponding  |
|        |sequence    |         |platform message                        |
|        |number      |         |                                        |
|2       |reply ID    |WORD     |The corresponding platform message ID   |
|4       |bear fruit  |BYTE     |0: Success/confirmed; 1: Failed; 2:     |
|        |            |         |Message is incorrect; 3: Not supported; |
|        |            |         |4: Performing the previous operation    |

```

2 Appendix_Platform General Response

```text
|Start   |field       |data type|Description and Requirements              |
|byte    |            |         |                                          |
|0       |Response    |WORD     |Serial number of the corresponding        |
|        |sequence    |         |terminal message                          |
|        |number      |         |                                          |
|2       |reply ID    |WORD     |The ID of the corresponding terminal      |
|        |            |         |message                                   |
|4       |bear fruit  |BYTE     |0: Success/Confirmed; 1: Failed; 2:       |
|        |            |         |Message is incorrect; 3: Not supported    |

```

3 Attachment_Terminal Registration Message Body

```text
|Start byte |field     |data    |Description and Requirements              |
|           |          |type    |                                          |
|0          |provincial|WORD    |Specify the province where the terminal is|
|           |ID        |        |installed. 0 is reserved and the platform |
|           |          |        |uses the default value. The province ID   |
|           |          |        |uses the first two digits of the six-digit|
|           |          |        |administrative division code specified in |
|           |          |        |GB/T 2260.                                |
|2          |City/Count|WORD    |Specify the city and county where the     |
|           |y ID      |        |terminal is installed. 0 is reserved and  |
|           |          |        |the platform uses the default value. The  |
|           |          |        |city and county IDs use the last four     |
|           |          |        |digits of the six-digit administrative    |
|           |          |        |division code specified in GB/T 2260.     |
|4          |manufactur|BYTE[5] |Five bytes for terminal manufacturer code.|
|           |er ID     |        |                                          |
|9          |Terminal  |BYTE[20]|New Beidou 20 bytes.                      |
|           |model     |        |                                          |
|29         |terminal  |BYTE[7] |A seven-byte identifier composed of       |
|           |ID        |        |uppercase letters and numbers, which is   |
|           |          |        |defined by the manufacturer.              |
|36         |License   |BYTE    |License plate color, in accordance with   |
|           |plate     |        |JT/T 415-2006, Section 5.4.12             |
|           |color     |        |                                          |
|37         |plate     |STRING  |license plate issued by traffic police    |
|           |number    |        |                                          |

```

4 Appendix_Terminal Registration Response Message Body

```text
|Start byte|field     |data type    |Description and Requirements          |
|0         |Response  |WORD         |Serial number of the corresponding    |
|          |sequence  |             |terminal registration message         |
|          |number    |             |                                      |
|2         |bear fruit|BYTE         |0: Successful; 1: The vehicle is      |
|          |          |             |registered; 2: The vehicle is not in  |
|          |          |             |the database; 3: The terminal is      |
|          |          |             |registered; 4: The terminal is not in |
|          |          |             |the database                          |
|3         |authentici|STRING       |This field is available only after    |
|          |ty code   |             |success                               |

```

5 Attachment Terminal Authentication Message Body

```text
|Start byte|field     |data type    |Description and Requirements          |
|0         |authentici|STRING       |Report the authentication code after  |
|          |ty code   |             |terminal reconnection                 |

```

6 Appendix Terminal Parameter Message Body

```text
|Start byte|field    |data type   |Description and Requirements              |
|0         |Total    |BYTE        |N parameter items                         |
|          |parameter|            |                                          |
|          |s        |            |                                          |
|1         |Parameter|            |Parameter field format 2                  |
|          |list     |            |参数项格式3,                              |
|          |         |            |Parameter field format 3                  |
|          |         |            |......                                    |

```

Parameter field format N

7    附表_参数项格式

```text
|Appendix_P|field  |data type                                               |
|arameter  |       |                                                        |
|Item      |       |                                                        |
|Format    |       |                                                        |
|Descriptio|paramet|DWORD终端参数设置定义                                   |
|n and     |er ID  |                                                        |
|Requiremen|       |                                                        |
|ts参数ID  |       |                                                        |
|Parameter |paramet|BYTE                                                    |
|ID        |er     |                                                        |
|definition|length |                                                        |
|and       |       |                                                        |
|descriptio|       |                                                        |
|n table   |       |                                                        |
|entries,  |       |                                                        |
|see       |       |                                                        |
|terminal  |       |                                                        |
|parameter |       |                                                        |
|settings  |       |                                                        |
|for       |       |                                                        |
|details参 |       |                                                        |
|数长度    |       |                                                        |
|参数值    |paramet|DWORD或STRING,若为多值参数,则消息中使用多个相同ID的参数 |
|          |er     |项,如调度中心电话号码                                   |
|          |values |                                                        |

```

8 DWORD or STRING. If it  is  a  multi-value  parameter,  the  message  uses
multiple parameter items with the same ID, such as the dispatch  center
phone number.   附表_终端参数设置定义

```text
|Appendix  |paramet|data type                                               |
|Terminal  |er ID  |                                                        |
|Parameter |       |                                                        |
|Settings  |       |                                                        |
|Descriptio|0x0001 |DWORD                                                   |
|n and     |       |                                                        |
|Requiremen|       |                                                        |
|ts0x0001  |       |                                                        |
|0x0002    |DWORD  |TCP message response timeout time, in seconds (s)       |
|0x0003    |DWORD  |TCP message retransmission count                        |
|0x0004    |DWORD  |UDP message response timeout time, in seconds (s)       |
|0x0005    |DWORD  |UDP message retransmission count                        |
|0x0006    |DWORD  |SMS message response timeout time, in seconds (s)       |
|0x0007    |DWORD  |SMS message retransmission count                        |
|0x0008-0x0|       |continue to have                                        |
|00F       |       |                                                        |
|0x0010    |STRING |The APN (Access Point Name) of the primary server, which|
|          |       |is the wireless communication dial-up access point. If  |
|          |       |the network standard is CDMA, this is the PPP dial-up   |
|          |       |number.                                                 |
|0x0011    |STRING |Primary server wireless communication dial-up username  |
|0x0012    |STRING |Primary server wireless communication dial-up password  |
|0x0013    |STRING |Primary server address, IP, or domain name              |
|0x0014    |STRING |Backup server APN, wireless communication dial-up access|
|          |       |point                                                   |
|0x0015    |STRING |Backup server wireless communication dial-up username   |
|0x0016    |STRING |Backup server wireless communication dialing password   |
|0x0017    |STRING |Backup the server address, IP, or domain name           |
|0x0018    |DWORD  |Server TCP port                                         |
|0x0019    |DWORD  |Server UDP port                                         |
|0x001A-0x0|       |continue to have                                        |
|01F       |       |                                                        |
|0x0020    |DWORD  |Report scheduling policy: 0: Scheduled reports; 1: Fixed|
|          |       |interval reports; 2: Both scheduled and fixed interval  |
|          |       |reports                                                 |
|0x0021    |DWORD  |Report the location status: 0: Based on ACC status; 1:  |
|          |       |Based on login status and ACC status. First, check the  |
|          |       |login status. If logged in, then check the ACC status.  |
|0x0022    |DWORD  |The driver has not logged the reporting interval in     |
|          |       |seconds (s). The value must be greater than 0.          |
|0x0023-0x0|DWORD  |continue to have                                        |
|026       |       |                                                        |
|0x0027    |DWORD  |Report the time interval in seconds (s) during sleep,>0 |
|0x0028    |DWORD  |The reporting interval for emergency alerts, in seconds |
|          |       |(s), must be greater than 0.                            |
|0x0029    |DWORD  |Default time report interval in seconds (s),>0          |
|0x002A-0x0|DWORD  |continue to have                                        |
|02B       |       |                                                        |
|0x002C    |DWORD  |Default distance report interval in meters (m),>0       |
|0x002D    |DWORD  |The driver has not logged the reporting distance        |
|          |       |interval, measured in meters (m), and it must be greater|
|          |       |than 0.                                                 |
|0x002E    |DWORD  |Report the distance interval during sleep, in meters    |
|          |       |(m),>0                                                  |
|0x002F    |DWORD  |The reporting distance interval during an emergency     |
|          |       |alert, in meters (m), must be greater than 0.           |
|0x0030    |DWORD  |Angle of inflection point compensation, <180°           |
|0x0031-0x0|       |continue to have                                        |
|03F       |       |                                                        |
|0x0040    |STRING |Monitoring platform phone number                        |
|0x0041    |STRING |Reset the phone number. Use this number to call the     |
|          |       |terminal and reset it.                                  |
|0x0042    |STRING |To restore the phone number to factory settings, dial   |
|          |       |the number to reset the device.                         |
|0x0043    |STRING |Monitoring platform SMS phone number                    |
|0x0044    |STRING |Receive SMS alerts from the police hotline              |
|0x0045    |DWORD  |Terminal call answering policy: 0: Auto answer; 1: Auto |
|          |       |answer when ACC is ON, manual answer when ACC is OFF    |
|0x0046    |DWORD  |Maximum call duration per session, in seconds (s). 0    |
|          |       |means no call is allowed, and 0xFFFFFFFF means no limit.|
|0x0047    |DWORD  |Maximum call duration for the month, in seconds (s). 0  |
|          |       |means no call is allowed, and 0xFFFFFFFF means no limit.|
|0x0048    |STRING |Monitor phone numbers                                   |
|0x0049    |STRING |supervisory privileged short message code               |
|0x004A-0x0|       |continue to have                                        |
|04F       |       |                                                        |
|0x0050    |DWORD  |Alarm mask bit. Corresponds to the alarm flag in the    |
|          |       |location report message. A 1 in this bit masks the      |
|          |       |corresponding alarm.                                    |
|0x0051    |DWORD  |The SMS alert toggle corresponds to the alarm flag in   |
|          |       |the location report message. When the corresponding bit |
|          |       |is set to 1, an SMS alert is sent.                      |
|0x0052    |DWORD  |The alarm capture switch corresponds to the alarm flag  |
|          |       |in the location report message. When the corresponding  |
|          |       |bit is set to 1, the camera captures during alarm       |
|          |       |activation.                                             |
|0x0053    |DWORD  |The alarm storage flag corresponds to the alarm flag in |
|          |       |the location information report message. If the         |
|          |       |corresponding bit is 1, the photo of the corresponding  |
|          |       |alarm time card is stored; otherwise, it is transmitted |
|          |       |in real time.                                           |
|0x0054    |DWORD  |The key flag corresponds to the alarm flag in the       |
|          |       |location information report message. If the             |
|          |       |corresponding bit is set to 1, the alarm is classified  |
|          |       |as a critical alarm.                                    |
|0x0055    |DWORD  |Maximum speed, in kilometers per hour (km/h)            |
|0x0056    |DWORD  |Duration of overspeed, in seconds (s)                   |
|0x0057    |DWORD  |Continuous driving time threshold, in seconds (s)       |
|0x0058    |DWORD  |Daily cumulative driving time threshold, in seconds (s) |
|0x0059    |DWORD  |Minimum rest time, in seconds (s)                       |
|0x005A    |DWORD  |Maximum parking time, in seconds (s)                    |
|0x005B-0x0|       |continue to have                                        |
|06F       |       |                                                        |
|0x0070    |DWORD  |Image/video quality (1-10),1 is best                    |
|0x0071    |DWORD  |Brightness, 0-255                                       |
|0x0072    |DWORD  |Contrast, 0-127                                         |
|0x0073    |DWORD  |Saturation, 0-127                                       |
|0x0074    |DWORD  |Chroma, 0-255                                           |
|0x0075-0x0|DWORD  |                                                        |
|07F       |       |                                                        |
|0x0080    |DWORD  |Vehicle odometer reading, 1/10 km                       |
|0x0081    |WORD   |The province ID of the vehicle                          |
|0x0082    |WORD   |City ID of the vehicle                                  |
|0x0083    |STRING |license plate issued by traffic police                  |
|0x0084    |BYTE   |License plate color, in accordance with JT/T415-2006,   |
|          |       |Section 5.4.12                                          |
|0x0090    |BYTE   |Location mode: 0x01 for GPS, 0x02 for BD, 0x03 for      |
|          |       |dual-mode                                               |
|ID        |       |                                                        |
|manufactur|       |                                                        |
|er        |       |                                                        |
|exclusive |       |                                                        |
|0x2001    |BYTE   |Clear fault code 0x01: Clear 0x00: Do not clear         |
|0x2002    |BYTE   |Clear vehicle data 0x01: Clear 0x00: Do not clear       |
|0x2003    |BYTE   |Clear driving trip data 0x01: Clear 0x00: Do not clear  |
|0x2004    |DWORD  |Total fuel consumption (ml)                             |
|0x2006    |DWORD  |Water temperature alarm parameter, unit: ℃              |
|0x2007    |BYTE   |acceleration parameter schedule                         |
|0x2008    |BYTE   |table of parameters for rapid deceleration              |
|0x2009    |BYTE   |parameter table of sharp turn                           |
|0x200A    |WORD   |Vehicle type. See the manufacturer's model list for     |
|          |       |details.                                                |
|0x200B    |DWORD  |Low voltage alarm parameter, unit: 0.1V                 |
|0x200C    |DWORD  |Alarmed for excessive idle time, unit: seconds          |
|0x200D    |DWORD  |Time-out alarm for positioning, unit: seconds           |
|0x200E    |STRING |Towing Alarm Parameters Appendix                        |
|0x200F    |BYTE   |collision alarm parameter table                         |
|0x2010    |STRING |special privilege schedule                              |
|0x2011    |DWORD  |Ignition threshold voltage, unit: 0.1V                  |
|0x2012    |WORD   |Route type (high byte), fuel consumption type (low byte)|
|          |       |Route type:                                             |
|          |       |0x00: Cancel forced setting                             |
|          |       |0x01: GPS                                               |
|          |       |0x02: J19391                                            |
|          |       |0x03: J19392                                            |
|          |       |0x04: J19393                                            |
|          |       |0x05: J19394                                            |
|          |       |0x06: J19395                                            |
|          |       |0x07: OBD instrument                                    |
|          |       |0x08: OBD/Private Protocol                              |
|          |       |0x09: J1939A                                            |
|          |       |0x0A: J1939B                                            |
|          |       |0x0B: J1939C                                            |
|          |       |0x0C: J1939D                                            |
|          |       |0x0D: Pulse speed                                       |
|          |       |…                                                       |
|          |       |0xff: Do not change the mandatory type                  |
|          |       |Fuel type:                                              |
|          |       |0x00: Cancel forced setting                             |
|          |       |0x01: J19391                                            |
|          |       |0x02: J19392                                            |
|          |       |0x03: J19393                                            |
|          |       |0x04: J19394                                            |
|          |       |0x05: J19395                                            |
|          |       |0x06: OBD1                                              |
|          |       |0x07: OBD2                                              |
|          |       |…                                                       |
|          |       |0xff: Do not change the mandatory type                  |
|0x2013    |WORD   |Mileage factor: Set value/1000. For example: 1020-> 1.02|
|0x2014    |WORD   |Fuel consumption coefficient: Set value/1000. For       |
|          |       |example: 1020-> 1.02                                    |
|0x2015    |WORD   |Oil density:                                            |
|          |       |Diesel 0# 835                                           |
|          |       |Diesel 10# 840                                          |
|          |       |Diesel 20# 830                                          |
|          |       |Diesel 35# 820                                          |
|          |       |Diesel 50# 816                                          |
|          |       |Gasoline 90# 722                                        |
|          |       |Gasoline 92# 725                                        |
|          |       |Gasoline 95# 737                                        |
|          |       |Gasoline 98# 753                                        |
|0x2016    |WORD   |Idle fuel consumption coefficient: Set value/1000. For  |
|          |       |example: 1020-> 1.02                                    |
|0x2017    |BYTE   |0x01: Turn on OBD                                       |
|          |       |0x00: Turn off OBD                                      |
|0x2018    |BYTE   |The device uses a first-in-first-out method for sending |
|          |       |location data.                                          |
|          |       |0x00: First In, First Out (default)                     |
|          |       |0x01: Real-time priority                                |
|0x2019    |BYTE   |The emergency alarm system requires adding data packets |
|          |       |for the first few seconds before and after the event.   |
|          |       |The additional data primarily targets the 0200 protocol.|
|          |       |0x00-0x0A, with a maximum of 10 seconds and default to 0|
|          |       |seconds, which disables the feature.                    |
|0x201A    |BYTE   |Read fault code instruction:                            |
|          |       |0x01: Reads the OBD fault code and reports F2 via 0900. |
|          |       |0x00: No fault code is read.                            |
|0x201B    |STRING |WIFI Parameter Table                                    |
|0x201C    |DWORD  |seconds, minimum hibernation wake-up time is 5 minutes, |
|          |       |i.e., 300 seconds                                       |
|0x201D    |WORD   |acute acceleration threshold, unit: mg                  |
|0x201E    |WORD   |threshold for rapid deceleration, unit: mg              |
|0x201F    |WORD   |Sharp turn speed threshold, unit: mg                    |
|0x2020    |BYTE[2]|Braking parameters: Detailed principle explanation as   |
|          |       |specified in the alarm reporting section                |
|          |       |BYTE[0]: Speed difference threshold default 9 km/h      |
|          |       |BYTE[1]: Speed threshold, default 0 km/h                |
|0x2021    |BYTE   |Emergency brake parameters: Specific principle          |
|          |       |description according to alarm reporting section        |
|          |       |Default speed difference threshold: 18 km/h             |
|0x2022    |WORD   |Over-speed parameters: Specific principle explanation is|
|          |       |provided in the alarm reporting section.                |
|          |       |Engine speed threshold 2400 rpm                         |
|0x2023    |WORD   |PTO idle parameters: Detailed principle explanation as  |
|          |       |specified in the alarm reporting section                |
|          |       |Engine speed threshold 1000 rpm                         |
|0x2024    |BYTE   |Log upload: 1 to enable (automatically disabled after 20|
|          |       |minutes) 0 to disable                                   |
|0x2025    |WORD   |Ignition delay time, in seconds                         |
|0x2026    |BYTE   |Set ACC line validity: Invalid: 0x00; Valid: 0x01       |
|0x2027    |WORD   |The OBD data stream transmission interval, indicating a |
|          |       |minimum frame interval of 70 milliseconds. The default  |
|          |       |value is 70 milliseconds.                               |
|0x2028    |WORD   |OBD data transmission interval: 0200 data, default 60S  |
|0x2029    |BYTE[n]|Bluetooth authorization code: a hexadecimal string up to|
|          |       |50 bytes. W/R                                           |
|0x202A    |STRING |Bluetooth name: greater than 8 bytes, up to 35 bytes.   |
|          |       |W/R                                                     |
|0x202B    |STRING |Bluetooth MAC: e.g., 44A6E5148CFE. R                    |
|0x202C    |BYTE   |Serial port 1 baud rate configuration:                  |
|          |       |1：9600                                                 |
|          |       |2：19200                                                |
|          |       |3：38400                                                |
|          |       |4：57600                                                |
|          |       |5：115200                                               |
|          |       |Other values: 115200                                    |
|0x202D    |BYTE   |Serial port 2 baud rate configuration:                  |
|          |       |1：9600                                                 |
|          |       |2：19200                                                |
|          |       |3：38400                                                |
|          |       |4：57600                                                |
|          |       |5：115200                                               |
|          |       |Other values: 115200                                    |
|0x202E    |WORD   |Ignition interval (via ACC cable), CAN transparent      |
|          |       |transmission reporting interval, 0x0705, default 5s     |
|0x202F    |WORD   |CAN data transmission reporting interval during engine  |
|          |       |shutdown (via ACC cable), default 0x0705,60s            |
|0x2030    |BYTE   |The buzzer switch is 1 for on and 0 for off.            |
|0x2050    |BYTE[N]|CAN ID configuration filter table                       |

```

9 Appendix: CAN ID Configuration Filtering Table

```text
|order    |conten|Bytes |data   |description                              |
|number   |t     |      |type   |                                         |
|0        |Total |1     |Byte   |Total number of filter groups: up to 14  |
|         |filter|      |       |CAN filter groups                        |
|         |groups|      |       |If it is 0xAA, it means all reports are  |
|         |      |      |       |submitted                                |
|         |      |      |       |If it is 0x00, no report is generated.   |
|1+(N-1)*8|Filter|8     |Byte[8]|Rule 1, as specified below;              |
|         |Group |      |       |                                         |
|         |1     |      |       |                                         |
|...      |...   |...   |...    |                                         |
|1+(N-1)*8|Filter|8     |Byte[8]|Rule N, as specified below;              |
|         |Group |      |       |                                         |
|         |N     |      |       |                                         |

```

rule ：

Total 8 bytes: CAN ID [4 bytes] + mask [4 bytes]

Sample explanation:

0x11223344 CAN ID binary 00010001 00100010 00110011 01000100

0xFF00FF00 Masked binary 11111111 00000000 11111111 00000000

A CAN ID is defined as one with the first byte being 11 and the third byte
being 33, while other bytes are irrelevant. All such CAN IDs must be
packaged and reported to the server.

10 Appendix: WIFI Parameter Table

```text
|order    |conten|Bytes |data   |description                              |
|number   |t     |      |type   |                                         |
|0        |Enable|1     |ASCII  |Enable: 0: Off 1: On                     |
|1        |,     |1     |ASCII  |0x2C                                     |
|2        |SSID  |Length|ASCII  |Wifi SSID                                |
|         |      |unspec|       |                                         |
|         |      |ified |       |                                         |
|3        |,     |1     |ASCII  |0x2C                                     |
|4        |Passwo|Length|ASCII  |Wifi password                            |
|         |rd    |unspec|       |                                         |
|         |      |ified |       |                                         |

```

11 Appendix_Instantaneous Acceleration Parameters

```text
|byte     |content  |Bytes |data    |description                          |
|position |         |      |type    |                                     |
|0        |accelerat|1     |BYTE    |0X03: High sensitivity; 0X02: Medium |
|         |ion level|      |        |sensitivity; 0X01: Low sensitivity;  |
|         |         |      |        |0X00: Off                            |

```

12 Appendix_急减速参数

```text
|byte     |content  |Bytes |data    |description                          |
|position |         |      |type    |                                     |
|0        |rate of  |1     |BYTE    |0X03: High sensitivity; 0X02: Medium |
|         |descent  |      |        |sensitivity; 0X01: Low sensitivity;  |
|         |         |      |        |0X00: Off                            |

```

13 Appendix_急转弯参数

```text
|byte     |content  |Bytes  |data type|description                          |
|position |         |       |         |                                     |
|0        |sharp    |1      |BYTE     |0X03: High sensitivity; 0X02: Medium |
|         |turn     |       |         |sensitivity; 0X01: Low sensitivity;  |
|         |level    |       |         |0X00: Off                            |

```

14 Appendix Terminal Upgrade Data Package

```text
|byte     |content     |Bytes  |data    |description                      |
|position |            |       |type    |                                 |
|0        |firmware    |1      |BYTE    |Upgrade the version number string|
|         |version     |       |        |length of the file               |
|         |number      |       |        |                                 |
|         |length      |       |        |                                 |
|1        |firmware    |N      |BYTE[N] |alphabetic string                |
|         |version     |       |        |                                 |
|         |number      |       |        |                                 |
|1+n      |offset      |4      |BYTE    |Identifies the data offset       |
|         |address     |       |        |address of the requested upgrade |
|         |            |       |        |file, starting from 0            |
|1+n+4    |Request data|4      |BYTE    |Indicates the length of the data |
|         |length      |       |        |requested                        |

```

15 Appendix_Platform Upgrade Data Package Response

```text
|byte     |content     |Bytes  |data    |description                      |
|position |            |       |type    |                                 |
|0        |firmware    |1      |BYTE    |Upgrade the version number string|
|         |version     |       |        |length of the file               |
|         |number      |       |        |                                 |
|         |length      |       |        |                                 |
|1        |firmware    |N      |BYTE[N] |alphabetic string                |
|         |version     |       |        |                                 |
|         |number      |       |        |                                 |
|1+n      |Upgrade the |4      |Dword   |                                 |
|         |total file  |       |        |                                 |
|         |size        |       |        |                                 |
|1+n+4    |Upgrade file|4      |Dword   |                                 |
|         |checksum    |       |        |                                 |
|1+n+8    |offset      |4      |Dword   |Identifies the data offset       |
|         |address     |       |        |address of the requested upgrade |
|         |            |       |        |file, starting from 0            |
|1+n+12   |Upgrade the |N      |BYTE[N] |Current data content             |
|         |data packet |       |        |                                 |
|         |content     |       |        |                                 |

```

16 Appendix_Tow Truck Alarm Parameters

```text
|order   |content     |Bytes  |data    |description                       |
|number  |            |       |type    |                                  |
|0       |Enable      |1      |ASCII   |Alarm suppression: 0 no alarm 1   |
|        |            |       |        |alarm                             |
|1       |,           |1      |ASCII   |0x2C                              |
|2       |Tow Spd     |Length |ASCII   |Trailer threshold speed (unit:    |
|        |            |unspeci|        |km/h, greater than 15 km/h)       |
|        |            |fied   |        |                                  |
|3       |,           |1      |ASCII   |0x2C                              |
|4       |Tow Interval|Length |ASCII   |Duration of trailer conditions met|
|        |            |unspeci|        |(seconds, greater than 20 seconds)|
|        |            |fied   |        |                                  |

```

17 Appendix_Collision Alarm Parameter Package

```text
|byte     |content     |Bytes  |data    |description                       |
|position |            |       |type    |                                  |
|0        |collision   |1      |BYTE    |0X03: High sensitivity;           |
|         |level       |       |        |0X02: Medium sensitivity;         |
|         |            |       |        |0X01: Low sensitivity,            |
|         |            |       |        |0X00: Close                       |

```

18 Attachment Privilege List

```text
|byte     |content     |Bytes  |data    |description                       |
|position |            |       |type    |                                  |
|0        |Privilege   |11     |ASCII   |13866668888 indicates that this   |
|         |number      |       |        |number allows configuration query |
|         |            |       |        |parameters.                       |

```

19 Appendix_Query Terminal Parameter Response Message Body

```text
|Start  |field      |data type |Description and Requirements              |
|byte   |           |          |                                          |
|0      |Response   |WORD      |Serial number of the corresponding        |
|       |sequence   |          |terminal parameter query message          |
|       |number     |          |                                          |
|2      |Total      |BYTE      |                                          |
|       |parameters |          |                                          |
|3      |Parameter  |          |Parameter field format table              |
|       |list       |          |                                          |

```

20 Appendix Terminal Control Message Body

```text
|Start  |field      |data type |Description and Requirements               |
|byte   |           |          |                                           |
|0      |CW         |BYTE      |terminal control command word table        |
|1      |command    |STRING    |See the following description for the      |
|       |parameter  |          |command parameter format. Each field is    |
|       |           |          |separated by a half-width ';' character.   |
|       |           |          |Each STRING field is processed using GBK   |
|       |           |          |encoding before being combined into a      |
|       |           |          |message.                                   |

```

21 Appendix_Terminal Control Command Word Description Table

```text
|CW      |command    |Description and Requirements                          |
|        |parameter  |                                                      |
|0x01    |Command    |Wireless upgrade. Parameters are separated by         |
|        |parameter  |semicolons. The command is: "URL; dial-up point name; |
|        |format     |dial-up username; dial-up password; IP address; TCP   |
|        |           |port; UDP port; manufacturer ID; hardware version;    |
|        |           |firmware version; connection time limit to the        |
|        |           |specified server". If a parameter is missing, leave it|
|        |           |blank.                                                |
|0x04    |not have   |terminal reset                                        |
|0x05    |not have   |Restore device to factory settings                    |
|0x90    |1byte+10byt|Power and fuel cutoff 1 byte 0x01: Fuel cutoff 10     |
|        |e          |bytes reserved                          Power and fuel|
|        |           |cutoff 1 byte 0x01: Fuel cutoff 10 bytes reserved     |
|0x91    |1byte+10byt|Oil and power connection: 1 byte 0x01 (oil connection)|
|        |e          |/ 10 bytes reserved                          Oil and  |
|        |           |power connection: 1 byte 0x01 (oil connection) / 10   |
|        |           |bytes reserved                                        |
|0x92    |1byte+10byt|Ignition 1 byte 0x01: Ignition 10 bytes reserved      |
|        |e          |Ignition 1 byte 0x01: Ignition 10 bytes reserved      |
|0x93    |1byte+10byt|Off 1 byte 0x01: Off 10 bytes reserved                |
|        |e          |Off 1 byte 0x01: Off 10 bytes reserved                |
|0xA0    |1byte+10byt|Order/Return: 1 byte 0x01: Order; 0x00: Return. 10    |
|        |e          |bytes reserved.               Order/Return: 1 byte    |
|        |           |0x01: Order; 0x00: Return. 10 bytes reserved.         |
|0xA1    |1byte+10byt|Search for vehicle: 1 byte 0x01: horn; 0x02: light;   |
|        |e          |0x03: horn + light; 10 bytes reserved                 |
|0xA2    |1byte+10byt|Central control lock: 1 byte 0x01: unlock; 0x00: lock.|
|        |e          |10 bytes reserved.               Central control lock:|
|        |           |1 byte 0x01: unlock; 0x00: lock. 10 bytes reserved.   |
|0xA3    |1byte+10byt|Window 1 byte 0x01: Open window; 0x00: Close window 10|
|        |e          |bytes reserved          Window 1 byte 0x01: Open      |
|        |           |window; 0x00: Close window 10 bytes reserved          |
|        |           |Window 1 byte 0x01: Open window; 0x00: Close window 10|
|        |           |bytes reserved                                        |
|0xA4    |1byte+10byt|Trunk lock: 1 byte 0x01: open trunk; 0x00: close      |
|        |e          |trunk. 10 bytes reserved.                             |
|0xA5    |1byte+10byt|Air conditioner: 1 byte 0x01: On; 0x00: Off. 10 bytes |
|        |e          |reserved.           Air conditioner: 1 byte 0x01: On; |
|        |           |0x00: Off. 10 bytes reserved.                         |
|0xA6    |1byte+10byt|Wiper 1 byte 0x01: Turn on wiper; 0x00: Turn off wiper|
|        |e          |10 bytes reserved           Wiper 1 byte 0x01: Turn on|
|        |           |wiper; 0x00: Turn off wiper 10 bytes reserved         |
|0xA7    |1byte+10byt|Skylight 1 byte 0x01: Open the skylight; 0x00: Close  |
|        |e          |the skylight 10 bytes reserved           Skylight 1   |
|        |           |byte 0x01: Open the skylight; 0x00: Close the skylight|
|        |           |10 bytes reserved                                     |
|0xA8    |1byte+10byt|Unlock and power on 1 byte 0x01: Unlock and power on  |
|        |e          |10 bytes reserved                                     |
|0xA9    |1byte+10byt|Lock and power-off 1 byte 0x01: Lock and power-off 10 |
|        |e          |bytes reserved                                        |
|0xAA    |2byte+9byte|OUT control: 1 byte 0x01: pull high OUT1 0x00: pull   |
|        |           |low OUT1 2 bytes 0x01: pull high OUT2 0x00: pull low  |
|        |           |OUT2 9 bytes reserved                                 |
|0xAB    |1byte+10byt|Key power switch: 1 byte 0x01: no power; 0x00: power  |
|        |e          |10 bytes reserved                                     |
|        |           |explain ：                                            |
|        |           |When the key power switch is set to off, the vehicle  |
|        |           |can be unlocked by the central control lock, but the  |
|        |           |key is not detected, and the engine cannot be started.|
|        |           |When the key power switch is set to power on, the     |
|        |           |vehicle can be unlocked and locked by the central     |
|        |           |control lock. The key can be detected, and the vehicle|
|        |           |can be started.                                       |
|        |           |This instruction applies only when additional forced  |
|        |           |power-off of the key is required. Under normal        |
|        |           |conditions, the central locking system powers the     |
|        |           |unlocking key while the locking key remains unpowered.|
|0xAC    |1byte+10byt|BMS lock control: 1 byte 0x01: Lock; 0x00: Unlock. 10 |
|        |e          |bytes reserved.           BMS lock control: 1 byte    |
|        |           |0x01: Lock; 0x00: Unlock. 10 bytes reserved.          |
|0xF1    |not have   |GSM module OTA upgrade started                        |

```

22 Appendix_ Terminal Control Response Message Body

```text
|Start  |field      |data type |Description and Requirements               |
|byte   |           |          |                                           |
|0      |Response   |WORD      |The serial number of the corresponding     |
|       |sequence   |          |platform message                           |
|       |number     |          |                                           |
|1      |command    |BYTE[N]   |terminal control response schedule         |
|       |parameter  |          |                                           |

```

23 Appendix_Terminal Control Response Appendix

The 0x0105 command requires a response only  when  the  control  command
word is listed in the table below.

```text
|CW      |command    |Description and Requirements                          |
|        |parameter  |                                                      |
|0x90    |1byte+10byt|Power and fuel cut-off 1 byte terminal control        |
|        |e          |response result 10 bytes reserved                     |
|        |           |Power and fuel cut-off 1 byte terminal control        |
|        |           |response result 10 bytes reserved                     |
|0x91    |1byte+10byt|Power and data transmission: 1 byte for terminal      |
|        |e          |control response, 10 bytes reserved                   |
|        |           |Power and data transmission: 1 byte for terminal      |
|        |           |control response, 10 bytes reserved                   |
|0x92    |1byte+10byt|Ignition 1 byte, terminal control response 10 bytes   |
|        |e          |reserved                           Ignition 1 byte,   |
|        |           |terminal control response 10 bytes reserved           |
|0x93    |1byte+10byt|Shut down 1 byte terminal control response result 10  |
|        |e          |bytes reserved                           Shut down 1  |
|        |           |byte terminal control response result 10 bytes        |
|        |           |reserved                                              |
|0xA0    |1byte+10byt|Order/Return: 1 byte for terminal control response, 10|
|        |e          |bytes reserved                           Order/Return:|
|        |           |1 byte for terminal control response, 10 bytes        |
|        |           |reserved                                              |
|0xA1    |1byte+10byt|Search for a 1-byte terminal control response and     |
|        |e          |reserve 10 bytes                           Search for |
|        |           |a 1-byte terminal control response and reserve 10     |
|        |           |bytes                                                 |
|0xA2    |1byte+10byt|Central control lock 1 byte, terminal control response|
|        |e          |result 10 bytes reserved                              |
|        |           |Central control lock 1 byte, terminal control response|
|        |           |result 10 bytes reserved                              |
|0xA3    |1byte+10byt|Window 1 byte, terminal control response result 10    |
|        |e          |bytes reserved          Window 1 byte, terminal       |
|        |           |control response result 10 bytes reserved             |
|        |           |Window 1 byte, terminal control response result 10    |
|        |           |bytes reserved                                        |
|0xA4    |1byte+10byt|Trunk lock 1 byte, terminal control response 10 bytes |
|        |e          |reserved                           Trunk lock 1 byte, |
|        |           |terminal control response 10 bytes reserved           |
|0xA5    |1byte+10byt|Air conditioner 1 byte terminal control response      |
|        |e          |result 10 bytes reserved                           Air|
|        |           |conditioner 1 byte terminal control response result 10|
|        |           |bytes reserved                                        |
|0xA6    |1byte+10byt|Rain刮 1 byte terminal control response result 10     |
|        |e          |bytes reserved                           Rain刮 1 byte|
|        |           |terminal control response result 10 bytes reserved    |
|0xA7    |1byte+10byt|Skylight 1 byte terminal control response result 10   |
|        |e          |bytes reserved                           Skylight 1   |
|        |           |byte terminal control response result 10 bytes        |
|        |           |reserved                                              |

```

24 Appendix_Terminal Control Response Results Appendix

```text
|Control   |data type|Description and Requirements                          |
|response  |         |                                                      |
|0x00      |BYTE     |Control succeeded                                     |
|0x01      |BYTE     |Control failed (instruction not supported or this     |
|          |         |feature is not available)                             |
|0x02      |BYTE     |Control failed because the engine is not off.         |
|0x03      |BYTE     |Control failed because the handbrake is not engaged.  |
|0x04      |BYTE     |Control failed because the vehicle speed is not zero. |
|0x05      |BYTE     |Control failed because the left front door lock is    |
|          |         |open.                                                 |
|0x06      |BYTE     |Control failed because the right front door lock is   |
|          |         |open.                                                 |
|0x07      |BYTE     |Control failed because the left rear door lock is     |
|          |         |open.                                                 |
|0x08      |BYTE     |Control failed because the right rear door lock is    |
|          |         |open.                                                 |
|0x09      |BYTE     |Control failed because the left front window is open. |
|0x0A      |BYTE     |Control failed because the right front window is open.|
|0x0B      |BYTE     |Control failed because the left rear window is open.  |
|0x0C      |BYTE     |Control failed because the right rear window is open. |
|0x0D      |BYTE     |Control failed because the sunroof was not closed.    |
|0x0E      |BYTE     |Control failed because the left front door was open.  |
|0x0F      |BYTE     |Control failed because the right front door was       |
|          |         |opened.                                               |
|0x10      |BYTE     |Control failed because the left rear door was opened. |
|0x11      |BYTE     |Control failed because the right rear door was opened.|
|0x12      |BYTE     |Control failed because the front compartment cover is |
|          |         |open.                                                 |
|0x13      |BYTE     |Control failed because the rear trunk is open.        |
|0x14      |BYTE     |Control failed because the reading light is on.       |
|0x15      |BYTE     |Control failed because the low beam is on.            |
|0x16      |BYTE     |Control failed because the high beam is on.           |
|0x17      |BYTE     |Control failed because the front fog lights are on.   |
|0x18      |BYTE     |Control failed because the rear fog lights are on.    |
|0x19      |BYTE     |Control failed because the danger light is on.        |
|0x1A      |BYTE     |Control failed because the turn signal is on.         |
|0x1B      |BYTE     |Control failed because the turn signal is on          |
|0x1C      |BYTE     |The control failed because the wiper is on.           |
|0x1D      |BYTE     |Control failed because the air conditioner is on.     |
|0x1E      |BYTE     |Control failed because the vehicle is not in P gear.  |
|0x1F      |BYTE     |Control failed because the vehicle did not shift back |
|          |         |to N.                                                 |
|0x20      |BYTE     |The terminal failed to execute control actions for the|
|          |         |vehicle, resulting in a timeout and control failure.  |
|0x21      |BYTE     |Control failed because the car door is not closed     |
|          |         |(multiple doors)                                      |
|0x22      |BYTE     |Control failed because the car door lock is not closed|
|          |         |(multiple door locks)                                 |
|0x23      |BYTE     |Control failed because the car doors and windows were |
|          |         |not closed (multiple car doors and windows).          |

```

25 Appendix Command Parameter Format

```text
|field    |data type  |Description and Requirements                          |
|link     |BYTE       |0x00: Switch to the specified regulatory platform     |
|control  |           |server. Pressing the server repeatedly activates      |
|         |           |emergency mode, where only the issuing regulatory     |
|         |           |platform can send control commands including SMS:     |
|         |           |0x01: Switch back to the default monitoring platform  |
|         |           |server and restore normal operation.                  |
|Dial     |STRING     |Typically a server APN (Access Point Name), a wireless|
|point    |           |communication dial-up access point.                   |
|name     |           |If the network mode is CDMA, this value is the PPP    |
|         |           |connection dial-up number.                            |
|Dial-up  |STRING     |Server wireless communication dial-up username        |
|username |           |                                                      |
|Dial     |STRING     |server wireless dialing password                      |
|password |           |                                                      |
|address  |STRING     |Server address, IP, or domain name                    |
|TCP port |WORD       |Server TCP port                                       |
|UDP port |WORD       |Server UDP port                                       |
|         |           |Hide feature 0xAA: Switch to FTP upgrade server       |
|         |           |Hide feature 0xBB: Switch to TCP upgrade server       |
|manufactu|BYTE[5]    |terminal manufacturer code                            |
|rer ID   |           |                                                      |
|Regulator|STRING     |The authentication code issued by the regulatory      |
|y        |           |platform is only used for connecting to the platform. |
|Platform |           |For subsequent authentication when the terminal       |
|Authentic|           |reconnects to the original monitoring platform, the   |
|ation    |           |original authentication code is required.             |
|Code     |           |                                                      |
|Hardware |STRING     |The hardware version number of the terminal is        |
|version  |           |determined by the manufacturer.                       |
|firmware |STRING     |The firmware version number of the device is          |
|version  |           |determined by the manufacturer.                       |
|URL      |STRING     |Complete URL                                          |
|address  |           |                                                      |
|Connectio|WORD       |Unit: minutes (min). A non-zero value means the       |
|n time   |           |terminal must reconnect to the original address before|
|limit to |           |the expiration time after receiving an upgrade or     |
|the      |           |connection to the specified server. If the value is 0,|
|specified|           |it means the connection to the specified server       |
|server   |           |remains active.                                       |

```

26 Appendix_Driver Information Collection Appendix

```text
|Start    |field      |data    |Description and Requirements                |
|byte     |           |type    |                                            |
|         |           |        |                                            |
|0        |state      |BYTE    |0x01: Insert the IC card for professional   |
|         |           |        |qualification (driver on duty);             |
|         |           |        |                                            |
|         |           |        |0x02: IC card for professional qualification|
|         |           |        |certificate removed (driver off duty).      |
|         |           |        |                                            |
|1        |time       |BCD[6]  |Time of card insertion or removal,          |
|         |           |        |YY-MM-DD-hh-mm-ss;                          |
|         |           |        |                                            |
|         |           |        |The following fields are valid and filled   |
|         |           |        |only when the status is 0x01.               |
|         |           |        |                                            |
|         |           |        |0x00: IC card read successfully;            |
|         |           |        |0x01: Card read failed due to failed key    |
|         |           |        |authentication.                             |
|7        |IC card    |BYTE    |0x02: Card read failed. The card is locked. |
|         |reading    |        |                                            |
|         |result     |        |                                            |
|         |           |        |0x03: Card read failed. The card was        |
|         |           |        |removed.                                    |
|         |           |        |                                            |
|         |           |        |0x04: Card read failed due to data          |
|         |           |        |validation error.                           |
|         |           |        |The following fields are valid only when the|
|         |           |        |IC card reads 0x00.                         |
|         |           |        |                                            |
|8        |Driver's   |BYTE    |n                                           |
|         |name length|        |                                            |
|         |           |        |                                            |
|9        |Driver's   |STRING  |Driver's Name                               |
|         |Name       |        |                                            |
|         |           |        |                                            |
|9+n      |Professiona|STRING  |The length is 20 bits. If insufficient, pad |
|         |l          |        |with 0x00.                                  |
|         |Qualificati|        |                                            |
|         |on         |        |                                            |
|         |Certificate|        |                                            |
|         |Code       |        |                                            |
|         |           |        |                                            |
|29+n     |Issuing    |BYTE    |m                                           |
|         |body name  |        |                                            |
|         |length     |        |                                            |
|         |           |        |                                            |
|30+n     |Issuer name|STRING  |Name of the issuing authority for           |
|         |           |        |professional qualification certificates     |
|         |           |        |                                            |
|30+n+m   |Validity   |BCD[4]  |YYYYMMDD                                    |
|         |period of  |        |                                            |
|         |the        |        |                                            |
|         |certificate|        |                                            |
|         |           |        |                                            |

```

27 Attachment temporary location tracking control message body

```text
|Start    |field     |data type     |Description and Requirements     |
|byte     |          |              |                                 |
|0        |time      |WORD          |The unit is seconds (s). 0 stops |
|         |interval  |              |tracking. Stopping tracking does |
|         |          |              |not require a subsequent field.  |
|2        |Location  |DWORD         |The unit is seconds (S). The     |
|         |tracking  |              |terminal sends a location report |
|         |validity  |              |based on the time interval in the|
|         |period    |              |message before the expiration    |
|         |          |              |time of the location tracking    |
|         |          |              |control message.                 |

```

28 Appendix Terminal Upgrade Result Data Package

```text
|Start   |field       |data type|Description and Requirements                |
|byte    |            |         |                                            |
|0       |Upgrade type|BYTE     |0x00: Terminal                              |
|        |            |         |0x12: Road Transport Permit IC Card Reader  |
|        |            |         |0x52: Beidou                                |
|        |            |         |0x2A: GSM module                            |
|1       |Upgrade     |BYTE     |0x00: Successful                            |
|        |result      |         |0x01: Failed (Timeout)                      |
|        |            |         |0x02: Cancel                                |
|        |            |         |0x03:  NEODOWNLOAD:NULL                     |
|        |            |         |0x04:  NEODOWNLOAD:FAIL                     |
|        |            |         |0x05:  NEOUPDATE:FAIL                       |
|        |            |         |0x06:  NEOUPDATE:NULL                       |
|        |            |         |0xF0: Same version, no upgrade              |
|        |            |         |0xF1: Upgrade version attribute error       |
|        |            |         |0xF2: Upgrade file verification error       |
|        |            |         |0xF3: The upgrade file does not exist       |

```

29 Appendix_Position Information Query Response Message Body Data Format

```text
|Start   |field           |data    |Description and Requirements               |
|byte    |                |type    |                                           |
|0       |Response        |WORD    |Serial number of the corresponding         |
|        |sequence number |        |information query message                  |
|2       |Location report |        |see, location data message body            |

```

30 Attachment: Location Data Batch Reporting Package

```text
|Start   |field           |data    |Description and Requirements               |
|byte    |                |type    |                                           |
|0       |Number of data  |WORD    |Number of data items (packages) in the     |
|        |items (packages)|        |location (package) N,>0                    |
|2       |Location data   |BYTE    |0: Normal batch data                       |
|        |item type       |        |1: Blind spot report                       |
|3       |Report data     |        |Format batch report data items by location |
|        |items by        |        |(Package 1)                                |
|        |location        |        |Format batch report data items by location |
|        |                |        |(Package 2)                                |
|        |                |        |Format batch report data items by location |
|        |                |        |(Package 3)                                |
|        |                |        |....                                       |
|        |                |        |Format batch report data items (Package N) |

```

Note: Upload multiple packages at once

31 Appendix: Format for Batch Reporting Data Items by Location

```text
|Start   |field          |data   |Description and Requirements                 |
|byte    |               |type   |                                             |
|0       |Report data    |Word   |Report the data body length, N               |
|        |body length by |       |                                             |
|        |position       |       |                                             |
|2       |Report body    |BYTE[n]|position data message body                   |
|        |position       |       |                                             |

```

32 Attachment Location Data Information Body

```text
|Start   |field         |data   |Description and Requirements                 |
|byte    |              |type   |                                             |
|0       |warning mark  |DWORD  |For details, refer to the appendix on the    |
|        |              |       |definition of alarm flag bits.               |
|4       |state         |DWORD  |See the attached table for detailed          |
|        |              |       |definitions of status flag bits              |
|8       |latitude      |DWORD  |The latitude value in degrees multiplied by  |
|        |              |       |10 to the sixth power, accurate to one       |
|        |              |       |millionth of a degree                        |
|12      |longitude     |DWORD  |The latitude value in degrees multiplied by  |
|        |              |       |10 to the sixth power, accurate to one       |
|        |              |       |millionth of a degree                        |
|16      |altitude      |WORD   |Altitude, in meters (m)                      |
|18      |velocity      |WORD   |1/10km/h                                     |
|20      |direction     |WORD   |0-359, with 0 at due north, clockwise        |
|22      |time          |BCD[6] |YY-MM-DD-hh-mm-ss (GMT+8 device reporting    |
|        |              |       |uses Beijing Time as the reference)          |
|28      |Location      |nByte  |See the location details table               |
|        |Additional    |       |                                             |
|        |Information   |       |                                             |
|        |List          |       |                                             |

```

33 Appendix Status Flag Definitions

```text
|bit         |state                                                           |
|0           |0: ACC off; 1: ACC on                                           |
|1           |0: Not located; 1: Located                                      |
|2           |0: north latitude: 1: south latitude                            |
|3           |0: east longitude; 1: west longitude                            |
|4           |0: Operational status: 1: Downtime status                       |
|5           |0: Latitude and longitude are not encrypted by the security     |
|            |plugin; l: Latitude and longitude are encrypted by the security |
|            |plugin                                                          |
|6-9         |continue to have                                                |
|10          |0: The vehicle fuel line is normal. 1: The vehicle fuel line is |
|            |disconnected.                                                   |
|11          |0: Vehicle circuit is normal: 1: Vehicle circuit is disconnected|
|12          |0: Unlock the door; 1: Lock the door                            |
|13          |0: Normal mode; 1: Repair mode                                  |
|14          |0: WIFI off; 1: WIFI on                                         |
|15          |0: Tire pressure 433 module normal; 1: Tire pressure 433 module |
|            |abnormal                                                        |
|16          |0: Bluetooth is working properly; 1: Bluetooth is not working   |
|17          |0: The wheelbarrow is not lifted; 1: The wheelbarrow is lifted  |
|18          |0: No GPS satellite is used for positioning; 1: GPS satellite is|
|            |used for positioning                                            |
|19          |0: Not using Beidou satellite for positioning; 1: Using Beidou  |
|            |satellite for positioning                                       |
|20          |0: No GLONASS satellite is used for positioning; 1: GLONASS     |
|            |satellite is used for positioning                               |
|21          |0: No Galileo satellite is used for positioning; 1: Galileo     |
|            |satellite is used for positioning                               |
|22          |0: No differential positioning used; 1: Differential positioning|
|            |used                                                            |
|23-31       |                                                                |

```

34 Appendix_Definition of Alarm Flag

```text
|bit    |definition                 |processing specification                 |
|0      |1: The emergency alarm is  |Clear after receiving response           |
|       |triggered upon activation  |                                         |
|       |of the alarm switch        |                                         |
|1      |1: Speed limit violation   |The indicator remains active until the   |
|       |alert                      |alarm condition is cleared               |
|2      |1: Fatigue Driving         |The indicator remains active until the   |
|       |                           |alarm condition is cleared               |
|3      |1: Danger Alert            |Clear after receiving response           |
|4      |1: GNSS module failure     |The indicator remains active until the   |
|       |                           |alarm condition is cleared               |
|5      |1: The GNSS antenna is not |The indicator remains active until the   |
|       |connected or is cut off    |alarm condition is cleared               |
|6      |1: GNSS antenna short      |The indicator remains active until the   |
|       |circuit                    |alarm condition is cleared               |
|7      |1: Terminal main power     |The indicator remains active until the   |
|       |supply under-voltage       |alarm condition is cleared               |
|8      |1: Main power supply of the|The indicator remains active until the   |
|       |terminal is off            |alarm condition is cleared               |
|9      |1: Terminal LCD or display |The indicator remains active until the   |
|       |malfunction                |alarm condition is cleared               |
|10     |1: TTS module failure      |The indicator remains active until the   |
|       |                           |alarm condition is cleared               |
|11     |1: Camera malfunction      |The indicator remains active until the   |
|       |                           |alarm condition is cleared               |
|12     |continue to have           |                                         |
|13     |1: Speed Warning           |The indicator remains active until the   |
|       |                           |alarm condition is cleared               |
|14-17  |                           |                                         |
|18     |1: Cumulative driving time |The indicator remains active until the   |
|       |exceeded for the day       |alarm condition is cleared               |
|19     |1: Timeout parking         |The indicator remains active until the   |
|       |                           |alarm condition is cleared               |
|20     |1: Entry and exit areas    |Clear after receiving response           |
|21     |1: Entry and exit routes   |Clear after receiving response           |
|22     |1: Route duration is       |Clear after receiving response           |
|       |insufficient/overlong      |                                         |
|23     |1: Route deviation alarm   |The indicator remains active until the   |
|       |                           |alarm condition is cleared               |
|24     |1: Vehicle VSS failure     |The indicator remains active until the   |
|       |                           |alarm condition is cleared               |
|25     |1: Vehicle fuel level is   |The indicator remains active until the   |
|       |abnormal                   |alarm condition is cleared               |
|26     |1: Vehicle stolen (via     |The indicator remains active until the   |
|       |anti-theft system)         |alarm condition is cleared               |
|27     |1: Vehicle ignition is     |Clear after receiving response           |
|       |illegal                    |                                         |
|28     |1: Illegal vehicle         |Clear after receiving response           |
|       |displacement               |                                         |
|29-31  |continue to have           |                                         |

```

35 Attachment Location Information Table

```text
|field                |data type            |Description and Requirements    |
|AI ID                |BYTE                 |1-255                           |
|Additional           |BYTE                 |1-255                           |
|information length   |                     |                                |
|AI                   |                     |Additional Information          |
|                     |                     |Definition Schedule             |

```

36 Appendix_Additional Information Definition

```text
|Additiona|AI        |Description and Requirements                            |
|l        |Length (1 |                                                        |
|informati|byte)     |                                                        |
|on ID (1 |          |                                                        |
|byte)    |          |                                                        |
|0xE1     |2byte     |Rotation speed, unit: RPM; Offset: 0; Range: 0-8000.    |
|         |          |(Exclusive)                                             |
|0xEA     |Nbyte     |Data packet sub-ID (2 bytes), length (1 byte) + data (N |
|         |          |bytes) Basic data stream table                          |
|0xEB     |Nbyte     |Data packet sub-ID (2 bytes), length (1 byte) + data (N |
|         |          |bytes) Car extended data stream                         |
|0xEC     |Nbyte     |Data packet sub-ID (2 bytes), length (1 byte) + data (N |
|         |          |bytes) truck extended data stream                       |
|0xED     |Nbyte     |Data packet sub-ID (2 bytes), length (1 byte) + data (N |
|         |          |bytes) New energy vehicle data item                     |
|0xEE     |Nbyte     |Data packet sub-ID (2 bytes), length (1 byte) + data (N |
|         |          |bytes) Extended Peripheral Data Item Appendix           |
|0xFA     |Nbyte     |Data packet sub-ID (2 bytes), length (1 byte) + data (N |
|         |          |bytes). Alarm command ID and description table          |
|0xFB     |Nbyte     |Packet inclusion sub-ID (2 bytes), length (1 byte) +    |
|         |          |data (N bytes) -Base station data stream reported when  |
|         |          |GPS positioning is unavailable, customizable            |
|0xFC     |Nbyte     |Data packet sub-ID (2 bytes), length (1 byte) + data (N |
|         |          |bytes of WIFI data stream, reported when GPS positioning|
|         |          |fails, customizable)                                    |
|...      |...       |Other reserves                                          |

```

add ID：

0XEA: A data item type for backward reference, representing basic data
items with a maximum length of 255.

0XEB: The following data item represents a sedan, with a maximum length
of 255 bytes.

0XEC: The subsequent data item indicates the truck data item, with a
maximum length of 255.

0XED: The subsequent data item indicates that for new energy vehicles,
the data item length is up to 255.

0XEE: A data field for peripheral devices, with a maximum length of 255
bytes.

0XFA: The subsequent data field indicates the alarm event ID, with a
maximum length of 255 bytes.

0XFB: The following data item indicates the base station data stream,
with a maximum length of 255.

0XFC: The following data item  indicates  a  Wi-Fi  data  stream  with  a
maximum length of 255 bytes.

37 Appendix_Basic Data Flow

```text
|Function  |Functio|Length|function   |unit |description                     |
|ID field  |n ID[2]|[1]   |           |     |                                |
|0x0001-0x0|0x0001 |4     |obligate   |     |                                |
|FFF       |       |      |           |     |                                |
|          |0x0002 |4     |obligate   |     |                                |
|          |0x0003 |5     |Total      |Mi   |Total Mileage Format Table      |
|          |       |      |mileage    |     |                                |
|          |       |      |data       |     |                                |
|          |0x0004 |5     |Total fuel |milli|Total Fuel Consumption Format   |
|          |       |      |consumption|liter|Table                           |
|          |       |      |data       |     |                                |
|          |0x0005 |4     |Total      |secon|Cumulative total operating time |
|          |       |      |runtime    |d    |                                |
|          |0x0006 |4     |Total      |secon|Total Cumulative Engine Shutdown|
|          |       |      |shutdown   |d    |Time                            |
|          |       |      |duration   |     |                                |
|          |0x0007 |4     |Total idle |secon|Cumulative idle time            |
|          |       |      |time       |d    |                                |
|          |0x0008 |N     |mileage    |     |60-byte reference data packet   |
|          |       |      |table      |     |for distance measurement        |
|          |0x0009 |N     |fuel       |     |Reference fuel consumption data |
|          |       |      |consumption|     |packet: 35 bytes                |
|          |       |      |data sheet |     |                                |
|          |0x0010 |N     |acceleromet|     |accelerometer                   |
|          |       |      |er         |     |                                |
|          |0x0011 |20    |vehicle    |     |vehicle status table            |
|          |       |      |status     |     |                                |
|          |       |      |table      |     |                                |
|          |0x0012 |2     |vehicle    |0.1V |0-36V                           |
|          |       |      |voltage    |     |                                |
|          |0x0013 |1     |Terminal   |0.1V |0-5V                            |
|          |       |      |built-in   |     |                                |
|          |       |      |battery    |     |                                |
|          |       |      |voltage    |     |                                |
|          |0x0014 |1     |CSQ price  |     |Network signal strength         |
|          |0x0015 |2     |motorcycle |     |Model ID Table                  |
|          |       |      |type ID    |     |                                |
|          |0x0016 |1     |OBD        |     |Protocol Type Table             |
|          |       |      |protocol   |     |                                |
|          |       |      |type       |     |                                |
|          |0x0017 |2     |Driving    |     |                                |
|          |       |      |Cycle Label|     |                                |
|          |0x0018 |1     |GPS        |     |GPS positioning number of       |
|          |       |      |satellite  |     |satellites                      |
|          |       |      |count      |     |                                |
|          |0x0019 |2     |GPS        |0.01 |GPS positional accuracy         |
|          |       |      |positional |     |                                |
|          |       |      |accuracy   |     |                                |
|          |0x001A |1     |GPS average|db   |GPS average signal-to-noise     |
|          |       |      |signal-to-n|     |ratio                           |
|          |       |      |oise ratio |     |                                |
|          |0x001B |1     |GPS antenna|     |0: Antenna normal 1: Antenna    |
|          |       |      |status     |     |open circuit                    |
|          |       |      |           |     |2: Antenna short circuit        |
|          |       |      |           |     |(requires module support)       |
|          |       |      |           |     |Note: Only TBOX products are    |
|          |       |      |           |     |supported.                      |
|          |0x001D |1     |Device     |     |0x02: Device unplugged or before|
|          |       |      |removal    |     |first positioning after power-on|
|          |       |      |status     |     |                                |
|          |       |      |(custom)   |     |                                |
|          |       |      |           |     |Non-0x02: Others                |
|          |       |      |           |     |Note: To prevent the GPS        |
|          |       |      |           |     |trajectory from being a straight|
|          |       |      |           |     |line between the factory        |
|          |       |      |           |     |location and the installation   |
|          |       |      |           |     |location during the first       |
|          |       |      |           |     |installation at the customer's  |
|          |       |      |           |     |site, avoid shipping from the   |
|          |       |      |           |     |factory test point.             |
|          |0x001E |4     |Cumulative |Mi   |When the mileage type in the    |
|          |       |      |mileage    |     |0003 total mileage data is      |
|          |       |      |           |     |instrument mileage, the accuracy|
|          |       |      |           |     |is typically limited to 1KM or  |
|          |       |      |           |     |10KM, which hinders mileage     |
|          |       |      |           |     |statistics. To facilitate       |
|          |       |      |           |     |platform statistics, add a      |
|          |       |      |           |     |cumulative mileage field.       |
|          |0x001F |4     |instantaneo|0.01 |Exclusive Version               |
|          |       |      |us fuel    |L/100|                                |
|          |       |      |consumption|km   |                                |
|          |0x0020 |2     |Ignition   |     |BIT0: 1: ACC line ignition      |
|          |       |      |type       |     |BIT1: 1: Security monitoring    |
|          |       |      |           |     |ignition                        |
|          |       |      |           |     |BIT2: 1: GPS speed              |
|          |       |      |           |     |BIT3: 1: Voltage (Low Voltage + |
|          |       |      |           |     |Vibration)                      |
|          |       |      |           |     |BIT4: 1: Engine speed           |
|          |       |      |           |     |BIT5: 1:ACC interrupt ignition  |
|          |       |      |           |     |BIT6: 1: ADC interrupt ignition |
|          |       |      |           |     |BIT7: 1: Voltage (high voltage) |
|          |       |      |           |     |BIT8: 1: Maintenance mode       |
|          |       |      |           |     |                                |
|          |0x0021 |4     |carbon     |can  |Cumulative carbon emissions (g) |
|          |       |      |emission   |     |are calculated from the         |
|          |       |      |（g）      |     |installation of equipment       |
|          |0x0022 |2     |Roll rate  |0.1dp|Bit15 indicates                 |
|          |       |      |(dedicated)|s    |positive/negative: 0 for        |
|          |       |      |           |     |positive direction, 1 for       |
|          |       |      |           |     |negative direction              |
|          |       |      |           |     |Bit0-14, representing a value   |
|          |       |      |           |     |with 0.1 precision              |
|          |       |      |           |     |Eg; upload value 0x80FF,        |
|          |       |      |           |     |indicating a negative direction |
|          |       |      |           |     |with an angle of 25.5dps. This  |
|          |       |      |           |     |means 0x8000 indicates a        |
|          |       |      |           |     |negative direction, and 0x00FF  |
|          |       |      |           |     |equals 255,255/10 = 25.5dps.    |
|          |0x0023 |2     |Pitch      |0.1dp|Bit15 indicates                 |
|          |       |      |angular    |s    |positive/negative: 0 for        |
|          |       |      |velocity   |     |positive direction, 1 for       |
|          |       |      |(exclusive)|     |negative direction              |
|          |       |      |           |     |Bit0-14, representing a value   |
|          |       |      |           |     |with 0.1 precision              |
|          |0x0024 |2     |Yaw angular|0.1dp|Bit15 indicates                 |
|          |       |      |velocity   |s    |positive/negative: 0 for        |
|          |       |      |(dedicated)|     |positive direction, 1 for       |
|          |       |      |           |     |negative direction              |
|          |       |      |           |     |Bit0-14, representing a value   |
|          |       |      |           |     |with 0.1 precision              |
|          |0x0025 |5     |Cumulative |Mi   |Cumulative Mileage 2 Format     |
|          |       |      |Mileage 2  |     |Table                           |
|          |       |      |(SWD       |     |                                |
|          |       |      |Exclusive) |     |                                |
|          |0x0026 |6     |5 high 1   |     |D_IN2 (High Input): Byte0=1:    |
|          |       |      |low (YF    |     |High detected; =0: No detected  |
|          |       |      |exclusive) |     |D_IN3 (High Input): Byte1=1:    |
|          |       |      |           |     |High detected; =0: No detected  |
|          |       |      |           |     |D_IN4 (High Input): Byte2=1:    |
|          |       |      |           |     |High detected; =0: No detection |
|          |       |      |           |     |D_IN5 (High Input): Byte3=1:    |
|          |       |      |           |     |High detected; =0: No detection |
|          |       |      |           |     |D_IN6 (Low Input): Byte4=1: Low |
|          |       |      |           |     |detected; =0: No detected       |
|          |       |      |           |     |D_IN7 (High Input): Byte5=1:    |
|          |       |      |           |     |High detected; =0: No detection |
|          |0x0027 |1     |GPS        |     |0: Invalid location             |
|          |       |      |positioning|     |1: Standard positioning         |
|          |       |      |state      |     |2: Range Time Difference (RTD)  |
|          |       |      |           |     |Positioning                     |
|          |       |      |           |     |3: Undefined                    |
|          |       |      |           |     |4: RTK Fixed Solution           |
|          |       |      |           |     |5: RTK Floating-Point Solution  |
|          |       |      |           |     |6: Trajectory Calculation       |
|          |0x0028 |4     |unit run   |secon|The running time of the device  |
|          |       |      |time       |d    |startup, starting from 0 after a|
|          |       |      |           |     |power outage and restart        |

```

38 Appendix_Car Extended Data Flow

```text
|Function ID|functi|Lengt|function           |unit |description              |
|field      |on    |h [1]|                   |     |                         |
|           |ID[2] |     |                   |     |                         |
|Car data   |0x60C0|2    |speed              |rpm  |Precision: 1 Offset: 0   |
|item       |      |     |                   |     |Range: 0 ~ 8000          |
|(Frequently|      |     |                   |     |                         |
|used       |      |     |                   |     |                         |
|section)   |      |     |                   |     |                         |
|[0x6001-0x6|      |     |                   |     |                         |
|FFF]       |      |     |                   |     |                         |
|           |0x60D0|1    |speed of a motor   |Km/h |Precision: 1 Offset: 0   |
|           |      |     |vehicle            |     |Range: 0 ~ 240           |
|           |0x62F0|2    |remaining oil      |%    |Remaining oil quantity,  |
|           |      |     |quantity           |L    |in L or%                 |
|           |      |     |                   |     |When Bit15 equals 0, the |
|           |      |     |                   |     |OBD percentage is        |
|           |      |     |                   |     |displayed as a percentage|
|           |      |     |                   |     |value.                   |
|           |      |     |                   |     |==1 unit L               |
|           |      |     |                   |     |Display value as upload  |
|           |      |     |                   |     |value divided by 10      |
|           |0x6050|1    |coolant temperature|℃    |Accuracy: 1°C Offset:    |
|           |      |     |                   |     |-40.0°C Range: -40.0°C to|
|           |      |     |                   |     |+210°C                   |
|           |0x60F0|1    |intake temperature |℃    |Accuracy: 1°C Offset:    |
|           |      |     |                   |     |-40.0°C Range: -40.0°C to|
|           |      |     |                   |     |+210°C                   |
|           |0x60B0|1    |intake (absolute   |kPa  |Precision: 1 Offset: 0   |
|           |      |     |manifold) pressure |     |Range: 0 ~ 250 kPa       |
|           |0x6330|1    |atmospheric        |kPa  |Precision: 1 Offset: 0   |
|           |      |     |pressure           |     |Range: 0 to 125 kPa      |
|           |0x6460|1    |ambient temperature|℃    |Accuracy: 1°C Offset:    |
|           |      |     |                   |     |-40.0°C Range: -40.0°C to|
|           |      |     |                   |     |+210°C                   |
|           |0x6490|1    |accelerator pedal  |%    |Precision: 1 Offset: 0   |
|           |      |     |position           |     |Range: 0% to 100%        |
|           |0x60A0|2    |fuel pressure      |kPa  |Precision: 1 Offset: 0   |
|           |      |     |                   |     |Range: 0 ~ 500 kPa       |
|           |0x6014|1    |fault code status  |     |Valid range: 0 to 1. "0" |
|           |      |     |                   |     |means off, "1" means on. |
|           |0X6010|1    |fault code count   |indiv|Precision: 1 Offset: 0   |
|           |      |     |                   |idual|Value range: 0~255       |
|           |0x6100|2    |air flow rate      |g/s  |Precision: 0.1 Offset: 0 |
|           |      |     |                   |     |Range: 0~6553.5          |
|           |0x6110|2    |absolute throttle  |%    |Precision: 0.1 Offset: 0 |
|           |      |     |position           |     |Range: 0~6553.5          |
|           |0x61F0|2    |time from engine   |sec  |Precision: 1 Offset: 0   |
|           |      |     |start              |     |                         |
|           |0x6210|4    |fault mileage      |Km   |Precision: 1 Offset: 0   |
|           |0x6040|1    |Calculate load     |%    |Precision: 1 Offset: 0   |
|           |      |     |value              |     |Range: 0% to 100%        |
|           |0x6070|2    |long term fuel     |%    |Precision: 0.1 Offset: 0 |
|           |      |     |correction         |     |Range: 0~6553.5          |
|           |      |     |(cylinder row 1 and|     |                         |
|           |      |     |3)                 |     |                         |
|           |0x60E0|2    |first cylinder     |%    |Precision: 0.1 Offset:   |
|           |      |     |ignition timing    |     |-64                      |
|           |      |     |advance            |     |                         |
|           |0x6901|1    |Front brake pad    |     |0 Normal/Otherwise:      |
|           |      |     |wear (special)     |     |Display corresponding    |
|           |      |     |                   |     |data, unit: level        |
|           |0x6902|1    |Wear of rear brake |     |0 Normal/Otherwise:      |
|           |      |     |pads (special)     |     |Display corresponding    |
|           |      |     |                   |     |data, unit: level        |
|           |0x6903|1    |Brake fluid level  |     |0: Abnormal 1: Normal    |
|           |      |     |(special)          |     |Others: Not available    |
|           |0x6904|2    |Oil level (special)|MM   |Unit MM or%              |
|           |      |     |                   |%    |Bit15 ==0 percentage%    |
|           |      |     |                   |     |==1 unit MM              |
|           |      |     |                   |     |Remove the highest bit   |
|           |      |     |                   |     |and keep the precision at|
|           |      |     |                   |     |0.1                      |
|           |0x6905|4    |Left front tire    |bar  |0xFF: Exception; other   |
|           |      |     |pressure (BYTE1)   |     |values: Unit: bar,       |
|           |      |     |Right front tire   |     |precision: 0.1           |
|           |      |     |pressure: BYT2     |     |0xFF: Exception; other   |
|           |      |     |Left rear tire     |     |values: Unit: bar,       |
|           |      |     |pressure: BYT3     |     |precision: 0.1           |
|           |      |     |Right rear tire    |     |0xFF: Exception; other   |
|           |      |     |pressure: BYT4     |     |values: Unit: bar,       |
|           |      |     |                   |     |precision: 0.1           |
|           |      |     |                   |     |0xFF: Exception; other   |
|           |      |     |                   |     |values: Unit: bar,       |
|           |      |     |                   |     |precision: 0.1           |
|           |0x6906|2    |Coolant level      |     |Precision: 1 Offset: -48 |
|           |      |     |(dedicated)        |     |                         |
|           |0x6907|4    |Range (Exclusive)  |km   |Precision: 0.1 Offset: 0 |
|           |      |     |                   |     |Total range of hybrid    |
|           |      |     |                   |     |vehicle: pure electric   |
|           |      |     |                   |     |range + fuel range       |
|           |      |     |                   |     |Total range of pure fuel |
|           |      |     |                   |     |vehicle: fuel            |
|           |0x6908|1    |Remaining Battery  |%    |0% - 100%                |
|           |      |     |(Exclusive)        |     |Hybrid vehicle: Remaining|
|           |      |     |                   |     |battery power of the pure|
|           |      |     |                   |     |electric part            |
|           |0x6909|1    |Charging status    |     |Hybrid vehicle: charging |
|           |      |     |(exclusive)        |     |status of the pure       |
|           |      |     |                   |     |electric part            |
|           |      |     |                   |     |0x0: Initial value       |
|           |      |     |                   |     |0x1: Not charged         |
|           |      |     |                   |     |0x2: Charging in AC mode |
|           |      |     |                   |     |0x3: DC charging in      |
|           |      |     |                   |     |progress                 |
|           |      |     |                   |     |0x4: Charging complete   |
|           |      |     |                   |     |0x5: Charging while      |
|           |      |     |                   |     |driving                  |
|           |      |     |                   |     |0x6: Stop and charge     |
|           |      |     |                   |     |0x7: Invalid value       |
|           |0x690A|1    |Charging station   |     |Hybrid vehicle: status of|
|           |      |     |status (dedicated) |     |charging pile for pure   |
|           |      |     |                   |     |electric part            |
|           |      |     |                   |     |0x01: Insert             |
|           |      |     |                   |     |0x00: Not inserted       |
|           |0x6060|2    |Short-term fuel    |     |                         |
|           |      |     |adjustment         |     |                         |
|           |      |     |(Cylinder banks 1  |     |                         |
|           |      |     |and 3) (Special)   |     |                         |
|           |0x6340|4    |The equivalent     |     |The 4 bytes are ABCD     |
|           |      |     |ratio (lambda) and |N/A  |Equivalent ratio =       |
|           |      |     |current (specific) |mA   |(A*256+B)*2/65535        |
|           |      |     |of B1-S1 linear or |     |Current =                |
|           |      |     |broadband oxygen   |     |(C*256+D)*8/65535        |
|           |      |     |sensors            |     |                         |
|           |0x6430|1    |Absolute load value|%    |Precision: 1 Offset: 0   |
|           |      |     |(dedicated)        |     |Range: 0% to 100%        |
|           |0x6680|1    |intake temperature |     |                         |
|           |      |     |sensor (dedicated) |     |                         |
|           |0x66f0|1    |Turbocompressor    |     |                         |
|           |      |     |intake pressure    |     |                         |
|           |      |     |(special)          |     |                         |
|           |0x6C11|4    |Maintenance Mileage|km   |Precision: 1 Offset: 0   |
|           |      |     |(Exclusive)        |     |                         |
|           |0x6C12|1    |Cumulative         |Next |                         |
|           |      |     |collision count:   |     |                         |
|           |      |     |total number of    |     |                         |
|           |      |     |front, rear, left, |     |                         |
|           |      |     |and right          |     |                         |
|           |      |     |collisions         |     |                         |
|           |      |     |(exclusive)        |     |                         |
|           |0x6F01|12   |AEB1 Data Stream   |     |A 4-byte CAN ID paired   |
|           |      |     |(Dedicated)        |     |with an 8-byte data      |
|           |      |     |                   |     |stream is forwarded by   |
|           |      |     |                   |     |the terminal without     |
|           |      |     |                   |     |parsing.                 |
|           |0x6F02|12   |AEB2 data stream   |     |A 4-byte CAN ID paired   |
|           |      |     |(dedicated)        |     |with an 8-byte data      |
|           |      |     |                   |     |stream is forwarded by   |
|           |      |     |                   |     |the terminal without     |
|           |      |     |                   |     |parsing.                 |
|           |0x6F03|12   |AEB3 data stream   |     |A 4-byte CAN ID paired   |
|           |      |     |(dedicated)        |     |with an 8-byte data      |
|           |      |     |                   |     |stream is forwarded by   |
|           |      |     |                   |     |the terminal without     |
|           |      |     |                   |     |parsing.                 |
|           |0x6F04|12   |AEB4 data stream   |     |A 4-byte CAN ID paired   |
|           |      |     |(dedicated)        |     |with an 8-byte data      |
|           |      |     |                   |     |stream is forwarded by   |
|           |      |     |                   |     |the terminal without     |
|           |      |     |                   |     |parsing.                 |
|           |0x6F05|1    |OBD clutch switch  |　   |0x00/0x01 Off/On         |
|           |0x6F06|1    |OBD brake switch   |　   |0x00/0x01 Off/On         |
|           |0x6F07|1    |OBD parking brake  |　   |0x00/0x01 Off/On         |
|           |      |     |switch             |     |                         |
|           |0x6F08|4    |real time injection|ml/h |                         |

```

39 Appendix-Truck Extended Data Flow

```text
|function  |funct|Len|function              |unit|description                |
|ID land   |ion  |gth|                      |    |                           |
|within    |ID[2]|[1]|                      |    |                           |
|certain   |     |   |                      |    |                           |
|boundaries|     |   |                      |    |                           |
|Truck data|0x60C|2  |OBD speed             |rpm |Precision: 1 Offset: 0     |
|item      |0    |   |                      |    |Range: 0 ~ 8000            |
|0x5001-0x6|     |   |                      |    |                           |
|FFF       |     |   |                      |    |                           |
|          |0x60D|1  |OBD speed of a motor  |Km/h|Precision: 1 Offset: 0     |
|          |0    |   |vehicle               |    |Range: 0 ~ 240             |
|          |0x62f|2  |OBD remaining fuel    |%   |Remaining oil quantity, in |
|          |0    |   |                      |L   |L or%                      |
|          |     |   |                      |    |When Bit15 equals 0, the   |
|          |     |   |                      |    |OBD percentage is displayed|
|          |     |   |                      |    |as a percentage value.     |
|          |     |   |                      |    |==1 unit L                 |
|          |     |   |                      |    |Display value as upload    |
|          |     |   |                      |    |value divided by 10        |
|          |0x605|1  |OBD coolant           |℃   |Accuracy: 1°C Offset:      |
|          |0    |   |temperature           |    |-40.0°C Range: -40.0°C to  |
|          |     |   |                      |    |+210°C                     |
|          |0x60F|1  |OBD intake temperature|℃   |Accuracy: 1°C Offset:      |
|          |0    |   |                      |    |-40.0°C Range: -40.0°C to  |
|          |     |   |                      |    |+210°C                     |
|          |0x60B|1  |OBD intake (absolute  |kPa |Accuracy: 1 Offset: 0      |
|          |0    |   |manifold) pressure    |    |Range: 0 to 250 kPa. The   |
|          |     |   |                      |    |original protocol only     |
|          |     |   |                      |    |allowed selection between  |
|          |     |   |                      |    |0x60B0 and 0x50B0.         |
|          |0x50B|2  |OBD intake (absolute  |kPa |Accuracy: 1 Offset: 0      |
|          |0    |   |manifold) pressure    |    |Range: 0 to 500 kPa (for   |
|          |     |   |                      |    |trucks) 0x60B0 and 0x50B0  |
|          |     |   |                      |    |are mutually exclusive     |
|          |0x633|1  |OBD atmospheric       |kPa |Precision: 1 Offset: 0     |
|          |0    |   |pressure              |    |Range: 0 to 125 kPa        |
|          |0x646|1  |OBD ambient           |℃   |Accuracy: 1°C Offset:      |
|          |0    |   |temperature           |    |-40.0°C Range: -40.0°C to  |
|          |     |   |                      |    |+210°C                     |
|          |0x649|1  |OBD Accelerator Pedal |%   |Precision: 1 Offset: 0     |
|          |0    |   |Position              |    |Range: 0% to 100%          |
|          |     |   |（ acceleration pedal |    |                           |
|          |     |   |）                    |    |                           |
|          |0x60A|2  |OBD fuel pressure     |kPa |Precision: 1 Offset: 0     |
|          |0    |   |                      |    |Range: 0 ~ 500 kPa         |
|          |0x601|1  |OBD fault code count  |indi|Precision: 1 Offset: 0     |
|          |0    |   |                      |vidu|Value range: 0~255         |
|          |     |   |                      |al  |                           |
|          |0x500|1  |OBD clutch switch     |　  |0x00/0x01 Off/On           |
|          |1    |   |                      |    |                           |
|          |0x500|1  |OBD brake switch      |　  |0x00/0x01 Off/On           |
|          |2    |   |                      |    |                           |
|          |0x500|1  |OBD parking brake     |　  |0x00/0x01 Off/On           |
|          |3    |   |switch                |    |                           |
|          |0x500|1  |OBD throttle valve    |%   |Precision: 1 Offset: 0     |
|          |4    |   |position              |    |Range: 0% to 100%          |
|          |0x500|2  |OBD Fuel Consumption  |L/h |Accuracy: 0.05L/h; Offset: |
|          |5    |   |Rate                  |    |0; Range: 0 to 3212.75L/h  |
|          |     |   |engine fuel flow rate |    |                           |
|          |0x500|2  |OBD fuel temperature  |℃   |Accuracy: 0.03125℃ Offset: |
|          |6    |   |                      |    |-273.0℃ Range: -273.0℃ to  |
|          |     |   |                      |    |+1734.96875℃               |
|          |0x500|2  |OBD oil temperature   |℃   |Accuracy: 0.03125℃ Offset: |
|          |7    |   |                      |    |-273.0℃ Range: -273.0℃ to  |
|          |     |   |                      |    |+1734.96875℃               |
|          |0x500|1  |OBD Engine Lubricating|kPa |Precision: 4 Offset: 0     |
|          |8    |   |Oil Pressure          |    |Range: 0 ~ 1000 kPa        |
|          |0x500|1  |OBD brake pedal       |%   |Precision: 1 Offset: 0     |
|          |9    |   |position              |    |Range: 0% to 100%          |
|          |0x500|2  |OBD air flow rate     |g/s |Precision: 0.1 Offset: 0   |
|          |A    |   |                      |    |Range: 0~6553.5            |
|          |0x510|1  |net output torque of  |%   |Precision: 1 Offset: -125  |
|          |1    |   |engine                |    |Value range: -125% to +125%|
|          |0x510|1  |friction torque       |%   |Precision: 1 Offset: -125  |
|          |2    |   |                      |    |Value range: -125% to +125%|
|          |0x510|2  |SCR upstream NOx      |ppm |Precision: 0.05 Offset:    |
|          |3    |   |sensor output value   |    |-200 Range: -200 to        |
|          |     |   |                      |    |+3012.75 ppm               |
|          |0x510|2  |SCR downstream NOx    |ppm |Precision: 0.05 Offset:    |
|          |4    |   |sensor output value   |    |-200 Range: -200 to        |
|          |     |   |                      |    |+3012.75 ppm               |
|          |0x510|1  |reactant surplus      |%   |Precision: 0.4 Offset: 0   |
|          |5    |   |                      |    |Range: 0% to 100%          |
|          |0x510|2  |air input             |Kg/h|Precision: 0.05 Offset: 0  |
|          |6    |   |                      |    |Range: 0 to 3212.75 kg/h   |
|          |0x510|2  |SCR inlet temperature |℃   |Accuracy: 0.03125℃ Offset: |
|          |7    |   |                      |    |-273.0℃ Range: -273.0℃ to  |
|          |     |   |                      |    |+1734.96875℃               |
|          |0x510|2  |SCR exit temperature  |℃   |Accuracy: 0.03125℃ Offset: |
|          |8    |   |                      |    |-273.0℃ Range: -273.0℃ to  |
|          |     |   |                      |    |+1734.96875℃               |
|          |0x510|2  |DPF differential      |kPa |Precision: 0.1 Offset: 0   |
|          |9    |   |pressure              |    |Range: 0 to 6425.5 kPa     |
|          |0x510|1  |engine torque pattern |    |0: Over-speed failure      |
|          |A    |   |                      |    |1: Speed control           |
|          |     |   |                      |    |2: Torque control          |
|          |     |   |                      |    |3: Speed/Torque Control    |
|          |     |   |                      |    |9: Normal                  |
|          |0x510|1  |acceleration pedal    |1%  |The displayed value is 0.4 |
|          |B    |   |                      |    |times the uploaded value   |
|          |0x510|1  |Urea tank temperature |℃   |Accuracy: 1°C Offset:      |
|          |C    |   |                      |    |-40.0°C Range: -40.0°C to  |
|          |     |   |                      |    |+210°C                     |
|          |0x510|4  |actual urea injection |ml/h|Precision: 0.01 Offset: 0  |
|          |D    |   |rate                  |    |Range: 0 ~ 42949672.95 ml/h|
|          |0x510|4  |Cumulative urea       |g   |Precision: 1 Offset: 0     |
|          |E    |   |consumption           |    |Range: 0 to 4294967295g    |
|          |0x510|2  |DPF delivery          |℃   |Accuracy: 0.03125℃ Offset: |
|          |F    |   |temperature           |    |-273.0℃ Range: -273.0℃ to  |
|          |     |   |                      |    |+1734.96875℃               |
|          |0x511|2  |engine fuel flow      |L/H |The displayed value is the |
|          |0    |   |                      |    |upload value multiplied by |
|          |     |   |                      |    |0.05                       |
|          |0x511|1  |OBD diagnostic        |    |The valid range is 0 to 2. |
|          |1    |   |protocol              |    |'0' stands for IOS15765,   |
|          |     |   |                      |    |'1' for IOS27145, '2' for  |
|          |     |   |                      |    |SAEJ1939, and '0xFE'       |
|          |     |   |                      |    |indicates invalid.         |
|          |0x511|1  |MIL state             |    |The valid range is 0 to 1, |
|          |2    |   |                      |    |where 0 means off and 1    |
|          |     |   |                      |    |means on. 0xFE is invalid. |
|          |0x511|2  |Diagnostic Support    |    |Each is defined as follows:|
|          |3    |   |Status                |    |1 Catalyst Monitoring      |
|          |     |   |                      |    |Status                     |
|          |     |   |                      |    |2 Status of Catalytic      |
|          |     |   |                      |    |Converter Monitoring       |
|          |     |   |                      |    |3 Evaporative system       |
|          |     |   |                      |    |monitoring Status          |
|          |     |   |                      |    |4. Secondary air system    |
|          |     |   |                      |    |monitoring status          |
|          |     |   |                      |    |5. Status of A/C system    |
|          |     |   |                      |    |refrigerant monitoring     |
|          |     |   |                      |    |6 Exhaust Gas Sensor       |
|          |     |   |                      |    |Monitoring Status          |
|          |     |   |                      |    |7 Exhaust Gas Sensor Heater|
|          |     |   |                      |    |Monitoring Status          |
|          |     |   |                      |    |8 EGR/VVT system monitoring|
|          |     |   |                      |    |9 Cold start aid system    |
|          |     |   |                      |    |monitoring status          |
|          |     |   |                      |    |10 Monitoring Status of    |
|          |     |   |                      |    |Boost Pressure Control     |
|          |     |   |                      |    |System                     |
|          |     |   |                      |    |11 Diesel Particulate      |
|          |     |   |                      |    |Filter (DPF) Monitoring    |
|          |     |   |                      |    |Status                     |
|          |     |   |                      |    |12 NOx conversion catalyst |
|          |     |   |                      |    |and/or NOx adsorber        |
|          |     |   |                      |    |monitoring status for      |
|          |     |   |                      |    |Selective Catalytic        |
|          |     |   |                      |    |Reduction (SCR) system or  |
|          |     |   |                      |    |NOx adsorber               |
|          |     |   |                      |    |13 NMHC Oxidation Catalyst |
|          |     |   |                      |    |Monitoring Status          |
|          |     |   |                      |    |14 Misfire monitoring      |
|          |     |   |                      |    |support                    |
|          |     |   |                      |    |15 Fuel system monitoring  |
|          |     |   |                      |    |support                    |
|          |     |   |                      |    |16 Comprehensive component |
|          |     |   |                      |    |monitoring support         |
|          |     |   |                      |    |The meaning of each value: |
|          |     |   |                      |    |0 = not supported; 1 =     |
|          |     |   |                      |    |supported;                 |
|          |0x511|2  |Diagnostic readiness  |    |Each individual is defined |
|          |4    |   |status                |    |as follows                 |
|          |     |   |                      |    |1 Catalyst Monitoring      |
|          |     |   |                      |    |Status                     |
|          |     |   |                      |    |2 Status of Catalytic      |
|          |     |   |                      |    |Converter Monitoring       |
|          |     |   |                      |    |3 Evaporative system       |
|          |     |   |                      |    |monitoring Status          |
|          |     |   |                      |    |4. Secondary air system    |
|          |     |   |                      |    |monitoring status          |
|          |     |   |                      |    |5. Status of A/C system    |
|          |     |   |                      |    |refrigerant monitoring     |
|          |     |   |                      |    |6 Exhaust Gas Sensor       |
|          |     |   |                      |    |Monitoring Status          |
|          |     |   |                      |    |7 Exhaust Gas Sensor Heater|
|          |     |   |                      |    |Monitoring Status          |
|          |     |   |                      |    |8 EGR/VVT system monitoring|
|          |     |   |                      |    |9 Cold start aid system    |
|          |     |   |                      |    |monitoring status          |
|          |     |   |                      |    |10 Monitoring Status of    |
|          |     |   |                      |    |Boost Pressure Control     |
|          |     |   |                      |    |System                     |
|          |     |   |                      |    |11 Diesel Particulate      |
|          |     |   |                      |    |Filter (DPF) Monitoring    |
|          |     |   |                      |    |Status                     |
|          |     |   |                      |    |12 NOx conversion catalyst |
|          |     |   |                      |    |and/or NOx adsorber        |
|          |     |   |                      |    |monitoring status for      |
|          |     |   |                      |    |Selective Catalytic        |
|          |     |   |                      |    |Reduction (SCR) system or  |
|          |     |   |                      |    |NOx adsorber               |
|          |     |   |                      |    |13 NMHC Oxidation Catalyst |
|          |     |   |                      |    |Monitoring Status          |
|          |     |   |                      |    |14 Misfire monitoring      |
|          |     |   |                      |    |support                    |
|          |     |   |                      |    |15 Fuel system monitoring  |
|          |     |   |                      |    |support                    |
|          |     |   |                      |    |16 Comprehensive component |
|          |     |   |                      |    |monitoring support         |
|          |     |   |                      |    |The meaning of each value: |
|          |     |   |                      |    |0 = test completed or      |
|          |     |   |                      |    |unsupported; 1 = test not  |
|          |     |   |                      |    |completed                  |
|          |0x511|17 |Vehicle Identification|ASCI|The vehicle identification |
|          |5    |   |Number (VIN)          |I   |code is a unique identifier|
|          |     |   |                      |    |composed of 17 digits,     |
|          |     |   |                      |    |which must comply with the |
|          |     |   |                      |    |requirements specified in  |
|          |     |   |                      |    |Section 4.5 of GB16735.    |
|          |0x511|18 |software calibration  |    |The software calibration   |
|          |6    |   |ID                    |    |identifier is customized by|
|          |     |   |                      |    |the manufacturer and       |
|          |     |   |                      |    |consists of letters or     |
|          |     |   |                      |    |numbers. If the identifier |
|          |     |   |                      |    |is shorter, a '0' is       |
|          |     |   |                      |    |appended.                  |
|          |0x511|18 |Calibrate Verification|    |The verification code is   |
|          |7    |   |Number (CVN)          |    |customized by the          |
|          |     |   |                      |    |manufacturer and consists  |
|          |     |   |                      |    |of letters or numbers. If  |
|          |     |   |                      |    |it is shorter, add a '0' at|
|          |     |   |                      |    |the end.                   |
|          |0x511|36 |IUPR price            |    |Refer to SAE J1979-DA Table|
|          |8    |   |                      |    |G11 for definition.        |
|          |0x511|2  |photoabsorption       |0.01|                           |
|          |A    |   |coefficient           |m-1 |                           |
|          |0x511|2  |opacity               |0.1%|                           |
|          |B    |   |                      |    |                           |
|          |0x511|2  |Particle concentration|Mg/m|                           |
|          |C    |   |(mass flow rate)      |3   |                           |
|          |0x511|1  |real-time load of     |%   |0-100%                     |
|          |F    |   |engine                |    |                           |
|          |0x512|2  |Output Value of       |V   |                           |
|          |0    |   |Upstream Oxygen Sensor|    |                           |
|          |     |   |of Three-way Catalytic|    |                           |
|          |     |   |Converter             |    |                           |
|          |0x512|2  |Output Value of Oxygen|V   |                           |
|          |1    |   |Sensor Downstream of  |    |                           |
|          |     |   |the Three-way         |    |                           |
|          |     |   |Catalytic Converter   |    |                           |
|          |0x512|2  |Output of temperature |°C  |                           |
|          |2    |   |sensor of three-way   |    |                           |
|          |     |   |catalytic converter   |    |                           |
|          |0x520|2  |Current Powder-Song   |0.01|                           |
|          |1    |   |Pressure (Special)    |Mpa |                           |
|          |0x520|2  |Current left walking  |0.01|                           |
|          |2    |   |pressure (dedicated)  |Mpa |                           |
|          |0x520|2  |Current right walking |0.01|                           |
|          |3    |   |pressure (exclusive)  |Mpa |                           |
|          |0x520|2  |Current powder silo   |1rpm|                           |
|          |4    |   |rotation speed        |    |                           |
|          |     |   |(special)             |    |                           |
|          |0x520|1  |Current Fuel Level    |    |0: Normal 1: Alarm         |
|          |5    |   |Alarm (Special)       |    |                           |
|          |0x520|1  |Powdered soft handle  |    |0: Left turn 1: Right turn |
|          |6    |   |for left and right    |    |                           |
|          |     |   |steering (exclusive)  |    |                           |
|          |0x520|1  |Gear position         |    |0: Neutral 1: Forward 2:   |
|          |7    |   |(exclusive)           |    |Reverse                    |
|          |0x520|1  |Lock status           |    |0: Walkable 1: Walk locked |
|          |8    |   |(exclusive)           |    |                           |
|          |0x520|1  |State of Agricultural |    |0: Standby 1: Working      |
|          |9    |   |Machinery (Special)   |    |                           |
|          |0x520|2  |Total operating time  |0.1H|Unit: hours                |
|          |A    |   |of powder-sprayed     |    |                           |
|          |     |   |engine (special       |    |                           |
|          |     |   |purpose)              |    |                           |
|          |0x520|1  |low coolant level     |    |0: Normal 1: Alarm         |
|          |B    |   |alarm                 |    |                           |
|          |0x520|1  |low engine oil alarm  |    |0: Normal 1: Alarm         |
|          |C    |   |                      |    |                           |
|          |0x520|1  |barometric alarm      |    |0x00/0x01 Off/On           |
|          |D    |   |indicator             |    |                           |
|          |0x520|1  |brake switch          |    |0x00/0x01 Off/On           |
|          |E    |   |                      |    |                           |
|          |0x520|2  |engine reference      |    |                           |
|          |F    |   |torque                |    |                           |
|          |0x521|1  |Friction Torque of    |%   |Precision: 1 Offset: -125  |
|          |0    |   |Auxiliary Engine of   |    |Value range: -125% to +125%|
|          |     |   |Sanitation Vehicle    |    |                           |
|          |     |   |(Special)             |    |                           |
|          |0x521|1  |Coolant temperature of|℃   |Accuracy: 1°C Offset:      |
|          |1    |   |auxiliary engine for  |    |-40.0°C Range: -40.0°C to  |
|          |     |   |sanitation vehicle    |    |+210°C                     |
|          |     |   |(special)             |    |                           |
|          |0x521|1  |Atmospheric Pressure  |kPa |Precision: 1 Offset: 0     |
|          |2    |   |of Auxiliary Engine   |    |Range: 0 to 125 kPa        |
|          |     |   |for Sanitation Vehicle|    |                           |
|          |     |   |(Special Purpose)     |    |                           |
|          |0x521|1  |Load of Auxiliary     |%   |Precision: 1 Offset: 0     |
|          |3    |   |Engine for Sanitation |    |Value range: 0 to 250%     |
|          |     |   |Vehicle (Special      |    |                           |
|          |     |   |Purpose)              |    |                           |
|          |0x521|2  |Auxiliary engine speed|rpm |Precision: 1 Offset: 0     |
|          |4    |   |of sanitation vehicle |    |Range: 0 ~ 8000            |
|          |     |   |(special)             |    |                           |
|          |0x521|1  |Percentage of torque  |%   |Precision: 1 Offset: -125  |
|          |5    |   |of auxiliary engine   |    |Value range: -125% to +125%|
|          |     |   |for sanitation vehicle|    |                           |
|          |     |   |(special purpose)     |    |                           |
|          |0x521|1  |Torque percentage     |%   |Precision: 1 Offset: -125  |
|          |6    |   |threshold for         |    |Value range: -125% to +125%|
|          |     |   |auxiliary engine of   |    |                           |
|          |     |   |sanitation vehicle    |    |                           |
|          |     |   |(exclusive)           |    |                           |
|          |     |   |                      |    |                           |
|          |     |   |                      |    |                           |

```

40 Appendix_ New Energy Vehicle Data Flow

```text
|function    |functio|Length|function        |unit   |description            |
|ID land     |n      |[1]   |                |       |                       |
|within      |ID[2]  |      |                |       |                       |
|certain     |       |      |                |       |                       |
|boundaries  |       |      |                |       |                       |
|            |0x7001 |4     |endurance       |0.1km  |Display value as upload|
|            |       |      |mileage         |       |value divided by 10    |
|            |       |      |                |       |                       |
|            |       |      |                |       |                       |
|            |       |      |                |       |                       |
|            |       |      |                |       |                       |
|            |       |      |                |       |                       |
|            |       |      |                |       |                       |
|            |       |      |                |       |                       |
|            |       |      |                |       |                       |
|            |       |      |                |       |                       |
|            |       |      |                |       |                       |
|            |       |      |                |       |                       |
|            |       |      |                |       |                       |
|            |       |      |                |       |                       |
|            |       |      |                |       |                       |
|New Energy  |       |      |                |       |                       |
|Vehicle Data|       |      |                |       |                       |
|Items       |       |      |                |       |                       |
|[0x7001-0x7F|       |      |                |       |                       |
|FF]         |       |      |                |       |                       |
|            |       |      |                |       |                       |
|            |0x7002 |1     |Remaining       |%      |0% - 100%              |
|            |       |      |Battery (SOC)   |       |                       |
|            |0x7003 |1     |speed of a motor|Km/h   |0 - 240                |
|            |       |      |vehicle         |       |                       |
|            |0x7004 |1     |charged state   |       |0x0: Initial value     |
|            |       |      |                |       |0x1: Not charged       |
|            |       |      |                |       |0x2: Charging in AC    |
|            |       |      |                |       |mode                   |
|            |       |      |                |       |0x3: DC charging in    |
|            |       |      |                |       |progress               |
|            |       |      |                |       |0x4: Charging complete |
|            |       |      |                |       |0x5: Charging while    |
|            |       |      |                |       |driving                |
|            |       |      |                |       |0x6: Stop and charge   |
|            |       |      |                |       |0x7: Invalid value     |
|            |0x7005 |1     |Charging station|       |0x01: Insert           |
|            |       |      |status          |       |0x00: Not inserted     |
|            |0x7006 |2     |power battery   |0.01A  |0x0-0xFFFF             |
|            |       |      |charge and      |       |Offset-32767           |
|            |       |      |discharge       |       |positive discharge     |
|            |       |      |current         |       |negative charge        |
|            |0x7007 |2     |maximum voltage |0．01V |0x0-0xFFFF/100         |
|            |       |      |of a single cell|       |                       |
|            |0x7008 |2     |Minimum voltage |0．01V |0x0-0xFFFF/100         |
|            |       |      |of a single cell|       |                       |
|            |0x7009 |2     |Current speed of|Rpm    |Offset-32767           |
|            |       |      |the drive motor |       |Forward rotation of the|
|            |       |      |                |       |positive motor         |
|            |       |      |                |       |reverse rotation of    |
|            |       |      |                |       |negative motor         |
|            |0x700a |2     |current torque  |Nm     |                       |
|            |       |      |of drive motor  |       |                       |
|            |0x700b |1     |Current         |C      |Subtract 40 from the   |
|            |       |      |temperature of  |       |uploaded value         |
|            |       |      |the drive motor |       |                       |
|            |0x700c |2     |DC bus voltage, |0.1V   |0x0-0xFFFF/10          |
|            |       |      |total voltage   |       |                       |
|            |0x700d |2     |DC bus current, |0.01A  |Offset-500A            |
|            |       |      |total current   |       |Discharge is positive, |
|            |       |      |                |       |charge is negative     |
|            |       |      |                |       |0x0-0xFFFF/100-500     |
|            |0x700e |2     |available energy|0.01Kwh|0x0-0xFFFF             |
|            |       |      |of power battery|       |                       |
|            |0x700f |2     |total voltage of|0.01V  |0x0-0xFFFF             |
|            |       |      |power battery   |       |                       |
|            |0x7021 |2     |voltage of cell |0.01V  |                       |
|            |       |      |1               |       |                       |
|            |0x7022 |2     |Voltage of the  |0.01V  |                       |
|            |       |      |No.2 single cell|       |                       |
|            |0x7023 |2     |Voltage of the  |0.01V  |                       |
|            |       |      |3rd cell        |       |                       |
|            |0x7024 |2     |Voltage of a    |0.01V  |                       |
|            |       |      |single cell on  |       |                       |
|            |       |      |the 4th         |       |                       |
|            |0x7025 |2     |Voltage of a    |0.01V  |                       |
|            |       |      |single cell on  |       |                       |
|            |       |      |the 5th day     |       |                       |
|            |0x7026 |2     |Voltage of a    |0.01V  |                       |
|            |       |      |single cell on  |       |                       |
|            |       |      |the 6th         |       |                       |
|            |0x7027 |2     |Voltage of 7th  |0.01V  |                       |
|            |       |      |cell            |       |                       |
|            |0x7028 |2     |voltage of 8    |0.01V  |                       |
|            |       |      |cell            |       |                       |
|            |0x7029 |2     |cell voltage of |0.01V  |                       |
|            |       |      |9 cell          |       |                       |
|            |0x702A |1     |Voltage of      |0.01V  |                       |
|            |       |      |10-cell monomer |       |                       |
|            |       |      |battery         |       |                       |
|            |0x702B |1     |BMS heartbeat   |       |0-255 cycle count      |
|            |       |      |information     |       |                       |
|            |0x702C |1     |highest voltage |       |                       |
|            |       |      |cell code       |       |                       |
|            |0x702D |1     |minimum voltage |       |                       |
|            |       |      |cell code       |       |                       |
|            |0x702E |1     |Total number of |       |                       |
|            |       |      |individual cells|       |                       |
|            |0x702F |1     |Total number of |       |                       |
|            |       |      |temperature     |       |                       |
|            |       |      |probes          |       |                       |
|            |0x7030 |1     |Maximum         |C      |Subtract 40 from the   |
|            |       |      |temperature     |       |uploaded value         |
|            |       |      |value           |       |                       |
|            |0x7031 |1     |Maximum         |       |                       |
|            |       |      |temperature     |       |                       |
|            |       |      |probe monomer   |       |                       |
|            |       |      |code            |       |                       |
|            |0x7032 |1     |Minimum         |C      |Subtract 40 from the   |
|            |       |      |temperature     |       |uploaded value         |
|            |       |      |value           |       |                       |
|            |0x7033 |1     |Minimum         |       |                       |
|            |       |      |temperature     |       |                       |
|            |       |      |probe monomer   |       |                       |
|            |       |      |code            |       |                       |
|            |0x7034 |4     |warning message |       |                       |
|            |0x7035 |1     |Temperature of  |C      |Subtract 40 from the   |
|            |       |      |the first probe |       |uploaded value         |
|            |0x7036 |1     |Temperature of  |C      |Subtract 40 from the   |
|            |       |      |the second probe|       |uploaded value         |
|            |0x7037 |1     |Third probe     |C      |Subtract 40 from the   |
|            |       |      |temperature     |       |uploaded value         |
|            |0x7038 |1     |Temperature of  |C      |Subtract 40 from the   |
|            |       |      |the 4th probe   |       |uploaded value         |
|            |0x7039 |1     |The fifth probe |C      |Subtract 40 from the   |
|            |       |      |temperature     |       |uploaded value         |
|            |0x703A |1     |The sixth probe |C      |Subtract 40 from the   |
|            |       |      |temperature     |       |uploaded value         |
|            |0x703B |1     |The seventh     |C      |Subtract 40 from the   |
|            |       |      |probe           |       |uploaded value         |
|            |       |      |temperature     |       |                       |
|            |0x703C |1     |The temperature |C      |Subtract 40 from the   |
|            |       |      |of the 8th probe|       |uploaded value         |
|            |0x703D |1     |The temperature |C      |Subtract 40 from the   |
|            |       |      |of the 9th probe|       |uploaded value         |
|            |0x703E |1     |Temperature of  |C      |Subtract 40 from the   |
|            |       |      |the 10th probe  |       |uploaded value         |
|            |0x703F |1     |Battery current |℃      |Subtract 40 from the   |
|            |       |      |temperature     |       |uploaded value         |
|            |0x7040 |1     |Vehicle status  |       |0-Engine off Start     |
|            |0x7041 |2     |insulation      |       |0x0-0xFFFF             |
|            |       |      |resistance      |       |                       |
|            |0x7042 |1     |Battery health  |       |0-100                  |
|            |       |      |status          |       |                       |
|            |0x7043 |2     |maximum single  |0.01V  |0x0-0xFFFF/100         |
|            |       |      |voltage         |       |                       |
|            |0x7044 |2     |minimum single  |0.01V  |0x0-0xFFFF/100         |
|            |       |      |voltage         |       |                       |
|            |0x7045 |2     |unit pressure   |0.01V  |0x0-0xFFFF/100         |
|            |       |      |drop            |       |                       |
|            |0x7043 |2     |maximum single  |0.001V |0x0-0xFFFF/1000        |
|            |       |      |voltage         |       |                       |
|            |0x7044 |2     |minimum single  |0.001V |0x0-0xFFFF/1000        |
|            |       |      |voltage         |       |                       |
|            |0x7045 |2     |unit pressure   |0.001V |0x0-0xFFFF/1000        |
|            |       |      |drop            |       |                       |
|            |0x7046 |1     |Power level     |       |0-1-2 Check if the     |
|            |       |      |                |       |engine is off, on, or  |
|            |       |      |                |       |started                |
|            |       |      |                |       |How does it differ from|
|            |       |      |                |       |the vehicle status     |
|            |       |      |                |       |above?                 |
|            |       |      |                |       |Or the vehicle gear?   |
|            |0x7047 |4     |BMS state       |u8     |BMS operative mode ：  |
|            |       |      |                |       |0 "Init"               |
|            |       |      |                |       |1 "Standby"            |
|            |       |      |                |       |2 "PreCharge"          |
|            |       |      |                |       |3 "Run"                |
|            |       |      |                |       |4 "AC Charge"          |
|            |       |      |                |       |5 "DC Charge"          |
|            |       |      |                |       |6 "PowerDown"          |
|            |       |      |                |       |7 "Error"              |
|            |       |      |                |u8     |BMS lock status:       |
|            |       |      |                |       |0 "UnLocked"           |
|            |       |      |                |       |1 "Locked"             |
|            |       |      |                |u8     |obligate               |
|            |       |      |                |u8     |obligate               |
|            |0x7048 |2     |average voltage |0.001V |0x0-0xFFFF/1000        |
|            |0x7049 |1     |average         |°C     |Subtract 40 from the   |
|            |       |      |temperature     |       |uploaded value         |
|            |       |      |value           |       |                       |
|            |0x704A |  1   |accelerator     |%      |Precision: 1 Offset: 0 |
|            |       |      |pedal position  |       |Range: 0% to 100%      |
|            |0x704B |2     |battery capacity|       |Precision: 0.1, Offset:|
|            |       |      |                |       |0                      |

```

41 Appendix Extended Peripheral Data Flow

```text
|Function  |funct|Leng|function             |unit   |description             |
|ID field  |ion  |th  |                     |       |                        |
|          |ID[2]|[1] |                     |       |                        |
|Peripheral|0x300|1   |positive and negative|　     |0x00 (Stop)             |
|Data Item |1    |    |states               |       |0x01 (Forward)          |
|0x3001-0x4|     |    |                     |       |0x02 (Reverse)          |
|FFF       |     |    |                     |       |                        |
|          |0x300|2   |Probe temperature (1)|0.1℃   |Start temperature:      |
|          |2    |    |channel              |       |-40.0°C, subtract 40    |
|          |     |    |                     |       |from the upload value   |
|          |0x300|2   |Probe temperature (2 |0.1℃   |Start temperature:      |
|          |3    |    |channels)            |       |-40.0°C, subtract 40    |
|          |     |    |                     |       |from the upload value   |
|          |0x300|2   |Probe temperature (3 |0.1℃   |Start temperature:      |
|          |4    |    |channels)            |       |-40.0°C, subtract 40    |
|          |     |    |                     |       |from the upload value   |
|          |0x300|2   |Probe temperature (4 |0.1℃   |Start temperature:      |
|          |5    |    |channels)            |       |-40.0°C, subtract 40    |
|          |     |    |                     |       |from the upload value   |
|          |0x300|N   |Tire pressure data   |　     |Check the tire pressure |
|          |6    |    |                     |       |data sheet              |
|          |0x300|N   |Wristband data       |　     |Wristband data package  |
|          |7    |    |package              |       |(not available)         |
|          |0x300|25  |H600 video status    |       |See H600 video status   |
|          |8    |    |information          |       |table                   |
|          |0x300|11  |H600 input signal    |       |Refer to the H600 input |
|          |9    |    |quantity             |       |signal scale            |
|          |0x300|N   |payload sensor data  |       |see load cell data sheet|
|          |A    |    |packet               |       |                        |
|          |0x300|N   |external oil sensing |       |external oil sensing    |
|          |B    |    |data                 |       |data sheet              |
|          |0x300|N   |Fire truck 6 data    |%      |See Fire Truck Route 6  |
|          |C    |    |acquisition (special)|       |Data Collection Table   |
|          |0x300|N   |temperature sensor   |       |                        |
|          |D    |    |data                 |       |Thai project:           |
|          |     |    |                     |       |2 bytes: Temperature,   |
|          |     |    |                     |       |precision 0.1°C         |
|          |     |    |                     |       |Other items:            |
|          |     |    |                     |       |12 bytes: Temperature,  |
|          |     |    |                     |       |precision 0.1           |
|          |     |    |                     |       |34 bytes: Humidity,     |
|          |     |    |                     |       |precision 0.1           |
|          |     |    |                     |       |56 bytes: Voltage,      |
|          |     |    |                     |       |precision 0.01          |
|          |     |    |                     |       |78 bytes; Disassembly   |
|          |     |    |                     |       |status and signal       |
|          |     |    |                     |       |strength. The high byte |
|          |     |    |                     |       |indicates the           |
|          |     |    |                     |       |disassembly status: 0xFF|
|          |     |    |                     |       |means not disassembled, |
|          |     |    |                     |       |0x00 means disassembled.|
|          |     |    |                     |       |The low byte indicates  |
|          |     |    |                     |       |signal strength, a      |
|          |     |    |                     |       |signed number, with the |
|          |     |    |                     |       |reading in dBm.         |
|          |     |    |                     |       |78 bytes; Disassembly   |
|          |     |    |                     |       |status and signal       |
|          |     |    |                     |       |strength. The high byte |
|          |     |    |                     |       |indicates the           |
|          |     |    |                     |       |disassembly status: 0xFF|
|          |     |    |                     |       |means not disassembled, |
|          |     |    |                     |       |0x00 means disassembled.|
|          |     |    |                     |       |The low byte indicates  |
|          |     |    |                     |       |signal strength, a      |
|          |     |    |                     |       |signed number, with the |
|          |     |    |                     |       |reading in dBm.         |
|          |0x300|N   |high speed rail tire |　     |See the attached        |
|          |E    |    |pressure data        |       |table_Extended          |
|          |     |    |                     |       |Peripheral Data:        |
|          |     |    |                     |       |High-speed Rail Tire    |
|          |     |    |                     |       |Pressure Data Table     |
|          |0x301|8   |G-sensor  value      |       |Total value ,x,y,z.every|
|          |3    |    |                     |       |2 bytes                 |
|          |0x301|8　 |Input and output     |　     |input output status     |
|          |4    |    |states               |       |table                   |
|          |0x301|2   |Analog Signal Input 1|0.1    |V                       |
|          |5    |    |                     |       |                        |
|          |0x301|2   |Analog Signal Input 2|0.1    |V                       |
|          |6    |    |                     |       |                        |
|          |0x301|N   |Driver's card swiping|       |Track-3 Information     |
|          |7    |    |data packet          |       |Sheet                   |

```

42 Appendix-Alarm Command ID and Description

```text
|Function  |funct|Leng|function            |explain                        |
|ID field  |ion  |th  |                    |                               |
|          |ID[2]|[1] |                    |                               |
|          |0x000|0   |ignition reporting  |The above data cannot be       |
|          |1    |    |                    |submitted simultaneously.      |
|0x0001-0x0|     |    |                    |Only one alarm can be reported |
|500       |     |    |                    |                               |
|          |0x000|0   |Ignition failure    |                               |
|          |2    |    |report              |                               |
|          |0x000|0   |defense reporting   |                               |
|          |3    |    |                    |                               |
|          |0x000|0   |Report evacuation   |                               |
|          |4    |    |                    |                               |
|          |0x000|0   |The door is open.   |                               |
|          |5    |    |                    |                               |
|          |0x000|0   |The car door is     |                               |
|          |6    |    |closed.             |                               |
|          |0x000|0   |system start-up     |                               |
|          |7    |    |                    |                               |
|          |0x010|0   |Trailer alarm       |                               |
|          |1    |    |                    |                               |
|          |0x010|0   |Positioning alarm   |                               |
|          |2    |    |                    |                               |
|          |0x010|0   |terminal pullout    |                               |
|          |3    |    |alarm               |                               |
|          |0x010|0   |terminal insertion  |                               |
|          |4    |    |alarm               |                               |
|          |0x010|0   |low voltage alarm   |                               |
|          |5    |    |                    |                               |
|          |0x010|X   |idle time alarm     |                               |
|          |6    |    |                    |                               |
|          |0x010|X   |over speed alarm    |                               |
|          |7    |    |                    |                               |
|          |0x010|X   |Fatigue Driving     |                               |
|          |8    |    |Alarm               |                               |
|          |0x010|X   |water temperature   |                               |
|          |9    |    |alarm               |                               |
|          |0x010|0   |high speed coasting |                               |
|          |A    |    |warning             |                               |
|          |0x010|0   |Fuel consumption    |                               |
|          |B    |    |does not support    |                               |
|          |     |    |alarm               |                               |
|          |0x010|0   |OBD does not support|                               |
|          |C    |    |alarms              |                               |
|          |0x010|0   |low water           |                               |
|          |D    |    |temperature and high|                               |
|          |     |    |speed               |                               |
|          |0x010|0   |Bus no sleep alarm  |                               |
|          |E    |    |                    |                               |
|          |0x010|0   |Open door without   |                               |
|          |F    |    |permission          |                               |
|          |0x011|0   |Illegal ignition    |                               |
|          |0    |    |                    |                               |
|          |0x011|0   |rapid acceleration  |                               |
|          |1    |    |alarm               |                               |
|          |0x011|0   |Emergency           |                               |
|          |2    |    |deceleration alarm  |                               |
|          |0x011|0   |Sudden turn warning |                               |
|          |3    |    |                    |                               |
|          |0x011|0   |collision alarm     |                               |
|          |4    |    |                    |                               |
|          |0x011|0   |abnormal vibration  |                               |
|          |5    |    |alarm               |                               |
|          |0x020|0   |GPS module fault    |                               |
|          |1    |    |alarm               |                               |
|          |0x020|0   |FLASH fault alarm   |                               |
|          |2    |    |                    |                               |
|          |0x020|0   |CAN module fault    |                               |
|          |3    |    |alarm               |                               |
|          |0x020|0   |3D Sensor Fault     |                               |
|          |4    |    |Alarm               |                               |
|          |0x020|0   |RTC module fault    |                               |
|          |5    |    |alarm               |                               |
|          |0x020|0   |fault alarm of      |                               |
|          |6    |    |temperature sensor  |                               |
|          |0x030|0   |Security glass not  |                               |
|          |1    |    |closed reminder     |                               |
|          |0x030|0   |Failed to lock the  |                               |
|          |2    |    |car.                |                               |
|          |0x030|0   |Timeout alert       |                               |
|          |3    |    |                    |                               |
|          |0x040|0   |slam the brakes on  |If the current speed exceeds a |
|          |1    |    |                    |specified threshold and the    |
|          |     |    |                    |difference between the next and|
|          |     |    |                    |previous second's speeds       |
|          |     |    |                    |surpasses the threshold, an    |
|          |     |    |                    |emergency brake alarm is       |
|          |     |    |                    |triggered. For parameter       |
|          |     |    |                    |settings, refer to 8103.       |
|          |     |    |                    |Speed difference threshold: 9  |
|          |     |    |                    |km/h                           |
|          |     |    |                    |Speed exceeds a certain speed: |
|          |     |    |                    |0 km/h                         |
|          |0x040|0   |spike stop          |If the speed difference between|
|          |2    |    |                    |the next and previous vehicle  |
|          |     |    |                    |seconds exceeds the threshold, |
|          |     |    |                    |an emergency brake alarm is    |
|          |     |    |                    |triggered. For parameter       |
|          |     |    |                    |settings, refer to 8103.       |
|          |     |    |                    |Speed difference threshold: 18 |
|          |     |    |                    |km/h                           |
|          |0x040|0   |overspeed           |The rotational speed exceeds   |
|          |3    |    |                    |the set threshold, triggering  |
|          |     |    |                    |this alarm. For parameter      |
|          |     |    |                    |settings, refer to 8103.       |
|          |     |    |                    |Engine speed threshold: 2400   |
|          |     |    |                    |rpm                            |
|          |0x040|0   |PTO idling          |When the RPM exceeds the       |
|          |4    |    |                    |specified threshold during idle|
|          |     |    |                    |operation, this alarm is       |
|          |     |    |                    |triggered. For parameter       |
|          |     |    |                    |settings, refer to 8103.       |
|          |     |    |                    |Engine speed threshold: 1000   |
|          |     |    |                    |rpm                            |
|          |0x040|0   |OBD connector (4-5) |                               |
|          |5    |    |removed             |                               |
|          |0x040|0   |Insert the OBD      |                               |
|          |6    |    |connector (4-5)     |                               |
|          |0x040|0   |Alarm for host      |                               |
|          |7    |    |removal (probe)     |                               |
|          |0x040|0   |Host box alarm      |                               |
|          |8    |    |triggered (light    |                               |
|          |     |    |sensor)             |                               |
|          |0x040|0   |Change of charging  |For real-time updating of      |
|          |9    |    |state of new energy |charging status for electric   |
|          |     |    |                    |vehicles                       |
|          |0x040|0   |Low battery level   |Trigger when the battery level |
|          |A    |    |alarm               |drops below a certain threshold|
|          |0x040|0   |OBD1 head (6-14)    |                               |
|          |B    |    |removed             |                               |
|          |0x040|0   |OBD2 connector (1-9)|                               |
|          |C    |    |removed             |                               |
|          |0x040|0   |OBD2 connector      |                               |
|          |D    |    |(3-11) removed      |                               |
|          |0x040|0   |OBD2 connector      |                               |
|          |E    |    |(11-12) removed     |                               |
|          |0x040|0   |very low voltage    |                               |
|          |F    |    |alarm               |                               |
|          |0x041|0   |low oil level alarm |0x00: Alarm cleared; 0x01:     |
|          |0    |    |                    |Alarm triggered;               |
|          |     |    |                    |The terminal can use the low   |
|          |     |    |                    |oil pressure field to trigger  |
|          |     |    |                    |an oil level low alarm.        |

```

43 Appendix_Base Station Data Flow

```text
|content   |Bytes |data  |description                                        |
|          |      |type  |                                                   |
|time      |6     |byte  |Trigger time: YY-MM-DD-hh-mm-ss (GMT+8) Eastern    |
|bcd[6]    |      |      |Time, BCD code                                     |
|mcc       |n     |string|Mobile user country code, e.g., 460                |
|,         |1     |byte  |English single-comma separator                     |
|mnc       |n     |string|Mobile network number: China Mobile: 0; China      |
|          |      |      |Unicom: 1                                          |
|,         |1     |byte  |English single-comma separator                     |
|base num  |1     |byte  |Number of community information: 0-9               |
|,         |1     |byte  |English single-comma separator                     |
|lac [1]   |n     |string|Location area code, range: 0-65535                 |
|,         |1     |byte  |English single-comma separator                     |
|cellid [1]|n     |string|Base station cell ID, valid range:                 |
|          |      |      |0-65535,0-268435455. The values 0, 65535, and      |
|          |      |      |268435455 are not used. A cell ID greater than     |
|          |      |      |65535 indicates a 3G base station.                 |
|,         |1     |byte  |English single-comma separator                     |
|signal [1]|n     |string|Signal intensity, 1-31                             |
|......    |      |      |This field appears when base num is greater than 1:|
|          |      |      |LAC[2], Cellid [2], Signal [2], separated by       |
|          |      |      |commas.                                            |
|          |      |      |Format as the gray section above, accumulating     |
|          |      |      |multiple cell information sequentially.            |

```

44 Appendix Basic Data Items: Accelerometer

```text
|overall      |byte  |content |byte        |type                             |
|length       |sequen|        |            |                                 |
|             |ce    |        |            |                                 |
|Route type   |0     |1       |0x01        |Total GPS distance (cumulative)  |
|             |      |        |0x02        |Other 1[J1939 Mileage Algorithm  |
|             |      |        |            |1]                               |
|             |      |        |0x03        |Other 2[J1939 Mileage Algorithm  |
|             |      |        |            |2]                               |
|             |      |        |0x04        |Other 3[J1939 Mileage Algorithm  |
|             |      |        |            |3]                               |
|             |      |        |0x05        |Other 4[J1939 Mileage Algorithm  |
|             |      |        |            |4]                               |
|             |      |        |0x06        |Other 5[J1939 Mileage Algorithm  |
|             |      |        |            |5]                               |
|             |      |        |0x07        |OBD instrument mileage           |
|             |      |        |0x08        |OBD speedometer                  |
|             |      |        |0x09        |Other 6[J1939 Mileage Algorithm  |
|             |      |        |            |6]                               |
|             |      |        |0x0A        |Other 7[J1939 Mileage Algorithm  |
|             |      |        |            |7]                               |
|             |      |        |0x0B        |Other 8[J1939 Mileage Algorithm  |
|             |      |        |            |8]                               |
|             |      |        |0x0C        |Other 9[J1939 Mileage Algorithm  |
|             |      |        |            |9]                               |
|Total mileage|1     |4       |Unit: meters                                   |

```

45 Appendix_Basic Data Items: Cumulative Mileage 2 Format Table

```text
|project      |byte  |length  |algorithmic |Algorithm name                   |
|             |sequen|        |index       |                                 |
|             |ce    |        |            |                                 |
|Cumulative   |0     |1       |0x01        |Accumulated GPS speed            |
|type         |      |        |            |                                 |
|             |      |        |0x02        |OBD speed cumulative             |
|             |      |        |0x03        |OBD instrument cumulative        |
|Cumulative   |1     |4       |Unit: meters                                   |
|mileage 2    |      |        |                                               |

```

46 Appendix_Basic Data Items: Total Fuel Consumption Format Table

```text
|project      |byte  |length  |fuel type   |Algorithm name                   |
|             |sequen|        |            |                                 |
|             |ce    |        |            |                                 |
|fuel type    |0     |1       |0x01        |J1939 Fuel Consumption Algorithm |
|             |      |        |            |1                                |
|             |      |        |0x02        |J1939 Fuel Consumption Algorithm |
|             |      |        |            |2                                |
|             |      |        |0x03        |J1939 Fuel Consumption Algorithm |
|             |      |        |            |3                                |
|             |      |        |0x04        |J1939 Fuel Consumption Algorithm |
|             |      |        |            |4                                |
|             |      |        |0x05        |J1939 Fuel Consumption Algorithm |
|             |      |        |            |5                                |
|             |      |        |0x0B        |OBD Fuel Consumption Algorithm 1 |
|             |      |        |0x0C        |OBD Fuel Consumption Algorithm 2 |
|             |      |        |0x0D        |OBD Fuel Consumption Algorithm 3 |
|             |      |        |0x0E        |OBD Fuel Consumption Algorithm 4 |
|cumulative   |1     |4       |unit ：ML                                      |
|fuel         |      |        |                                               |
|consumption  |      |        |                                               |

```

47 Appendix Basic Data Items: Accelerometer

```text
|overall length                 |byte      |content                          |
|                               |sequence  |                                 |
|OBD protocol type table        |0X11      |CAN 11_500                       |
|                               |0X12      |CAN 11_250                       |
|                               |0X13      |CAN 29_500_EX                    |
|                               |0X14      |CAN 29_250_EX                    |
|                               |0X20      |KWP2000                          |
|                               |0X30      |KWP2000M                         |
|                               |0X40      |ISO9141                          |
|                               |0X50      |VPW                              |
|                               |0X60      |PWM                              |
|                               |0X70      |PRIVATE                          |
|                               |0XF0      |J1939                            |

```

48 Appendix_Basic Data Items: Vehicle Status Table

```text
|sequence |subsequence |conten|word    |data                                   |
|of       |            |t     |number  |type                                   |
|segments |            |      |        |                                       |
|0        |Idle Alarm  |1     |        |0x00: Alarm cleared; the following data|
|         |Property    |      |        |items are included                     |
|         |            |      |        |0x01: Alarm triggered; no data items   |
|         |            |      |        |below                                  |
|1        |Alarm       |2     |second  |                                       |
|         |duration    |      |        |                                       |
|3        |idle fuel   |2     |ML      |                                       |
|         |consumption |      |        |                                       |
|5        |maximum idle|2     |RPM     |                                       |
|         |speed       |      |        |                                       |
|7        |minimum idle|2     |RPM     |                                       |
|         |speed       |      |        |                                       |

```

49 Appendix-Alarm Description: Speed Exceeding Alarm Description

```text
|byte     |project     |length|unit    |description                            |
|sequence |            |      |        |                                       |
|0        |Excessive   |1     |        |0x00: Alarm cleared; the following data|
|         |Speed Alarm |      |        |items are included                     |
|         |Property    |      |        |0x01: Alarm triggered; no data items   |
|         |            |      |        |below                                  |
|1        |Alarm       |2     |second  |                                       |
|         |duration    |      |        |                                       |
|3        |maximum     |2     |0.1KM/H |                                       |
|         |speed       |      |        |                                       |
|5        |average     |2     |0.1KM/H |                                       |
|         |speed       |      |        |                                       |
|7        |excess speed|2     |Mi      |                                       |
|         |distance    |      |        |                                       |

```

50 Appendix-Alarm Description: Fatigue Driving Alarm Description

```text
|byte     |project     |length|unit    |description                           |
|sequence |            |      |        |                                      |
|0        |Alarm       |1     |        |0x00: Alarm cleared; the following    |
|         |attribute   |      |        |data items are included               |
|         |            |      |        |0x01: Alarm triggered; no data items  |
|         |            |      |        |below                                 |
|1        |Alarm       |2     |second  |                                      |
|         |duration    |      |        |                                      |

```

51 Appendix-Alarm Description: Water Temperature Excess Alarm Description

```text
|byte     |project     |length|unit    |description                           |
|sequence |            |      |        |                                      |
|0        |Water       |1     |        |0x00: Alarm cleared; the following    |
|         |temperature |      |        |data items are included               |
|         |alarm       |      |        |0x01: Alarm triggered; no data items  |
|         |attribute   |      |        |below                                 |
|1        |Alarm       |4     |second  |                                      |
|         |duration    |      |        |                                      |
|5        |maximum     |2     |0.1     |                                      |
|         |temperature |      |degree  |                                      |
|7        |average     |2     |0.1     |                                      |
|         |temperature |      |degree  |                                      |

```

52 Appendix Extended Peripheral Data: H600 Video Status Information Table

```text
|bit  |definition|explain                                                   |
|1    |Total     |Camera channels (1-4)                                     |
|     |number of |                                                          |
|     |channels  |                                                          |
|2    |intercom  |0: No intercom request 1: The device is initiating an     |
|     |request   |intercom request                                          |
|3    |real-time |0: Unconnected, non-zero: Streaming video on network.     |
|     |video     |Bit0: First channel, Bit1: Second channel, Bit2: Third    |
|     |          |channel, Bit3: Fourth channel                             |
|4    |Intercom  |0: Not started, 1: On hold                                |
|     |status    |                                                          |
|5    |Video     |0: Not started, non-zero: Remote playback channel bit0    |
|     |playback  |(channel 1), bit1 (channel 2), bit2 (channel 3), bit3     |
|     |          |(channel 4)                                               |
|6    |SD1 state |0: Not found, 1: Normal, 0xff: Disk error                 |
|7    |SD2 state |0: Not found, 1: Normal, 0xff: Disk error                 |
|8    |HDD state |0: Not found, 1: Normal, 0xff: Disk error                 |
|9    |USB status|0: Not found, 1: Normal, 0xff: Disk error                 |
|10   |EMMC state|0: Not found, 1: Normal, 0xff: Disk error                 |
|11   |work disk |0xff: No working disk. 0: SD1 is the working disk. 1: SD2 |
|     |          |is the working disk. 2: The hard disk is the working disk.|
|12   |Video     |0: All video channels are normal. Non-zero: Video loss    |
|     |status    |anomalies detected in channels bit0 (first channel), bit1 |
|     |          |(second channel), bit2 (third channel), and bit3 (fourth  |
|     |          |channel).                                                 |
|13   |Video     |0: All video channels are normal. Non-zero: Obstruction   |
|     |blocking  |anomaly in channel video (bit0: first channel, bit1:      |
|     |          |second channel, bit2: third channel, bit3: fourth         |
|     |          |channel).                                                 |
|14   |Channel   |0: No recording, 1: Scheduled recording, 2: Manual        |
|     |Video     |recording, 3: Alarm recording                             |
|15   |Channe2   |0: No recording, 1: Scheduled recording, 2: Manual        |
|     |video     |recording, 3: Alarm recording                             |
|     |recording |                                                          |
|16   |Channe3   |0: No recording, 1: Scheduled recording, 2: Manual        |
|     |video     |recording, 3: Alarm recording                             |
|     |recording |                                                          |
|17   |Channe4   |0: No recording, 1: Scheduled recording, 2: Manual        |
|     |video     |recording, 3: Alarm recording                             |
|     |recording |                                                          |
|18   |Channe5   |0: No recording, 1: Scheduled recording, 2: Manual        |
|     |video     |recording, 3: Alarm recording                             |
|     |recording |                                                          |
|19   |Channe6   |0: No recording, 1: Scheduled recording, 2: Manual        |
|     |video     |recording, 3: Alarm recording                             |
|     |recording |                                                          |
|20   |Channe7   |0: No recording, 1: Scheduled recording, 2: Manual        |
|     |video     |recording, 3: Alarm recording                             |
|     |recording |                                                          |
|21   |Channe8   |0: No recording, 1: Scheduled recording, 2: Manual        |
|     |video     |recording, 3: Alarm recording                             |
|     |recording |                                                          |
|22   |disaster  |0: No video recording. Non-zero: Channel video recording  |
|     |recovery  |(bit0 for the first channel, bit1 for the second, bit2 for|
|     |video     |the third, bit3 for the fourth).                          |
|23   |emmc      |0: No video recording. Non-zero: Channel video recording  |
|     |picture   |(bit0 for the first channel, bit1 for the second, bit2 for|
|     |recording |the third, bit3 for the fourth).                          |
|24   |Authorizat|0: Unauthorized, 1: Authorized                            |
|     |ion status|                                                          |
|25   |AV output |The upper 4 bits indicate the number of frames, and the   |
|     |          |lower 4 bits indicate the zoom sequence number.           |
|     |          |0x11-0x16 Single Frame                                    |
|     |          |0x20:2 frames, 0x40:4 frames, 0x60:6 frames, 0x90:9 frames|
|     |          |For single frame: 0x11: Channel 1 zoomed in 0x12: Channel |
|     |          |2 zoomed in                                               |
|     |          |0x16: Channel 6 amplification                             |

```

53 Appendix Extended Peripheral Data: H600 Input Signal Count

```text
|bit  |definitio|explain                                                      |
|     |n        |                                                             |
|0    |Signal 1 |Brake signal (high trigger) 1: Triggered 0: Not triggered    |
|1    |Signal 2 |Low-beam signal (high trigger) 1: Triggered 0: Not triggered |
|2    |Signal 3 |High Trigger High Beam Signal 1: Triggered 0: Not Triggered  |
|3    |Signal 4 |Left-turn signal (high trigger) 1: Triggered 0: Not triggered|
|4    |Signal 5 |Right-turn signal (high trigger) 1: Triggered 0: Not         |
|     |         |triggered                                                    |
|5    |Signal 6 |Custom High 1 Signal (High Trigger) 1: Triggered 0: Not      |
|     |         |Triggered                                                    |
|6    |Signal 7 |Custom High 2 Signal (High Trigger) 1: Triggered 0: Not      |
|     |         |Triggered                                                    |
|7    |Signal 8 |Alarm signal (low trigger) 1: Triggered 0: Not triggered     |
|8    |Signal 9 |Gate signal (low trigger) 1: Triggered 0: Not triggered      |
|     |         |Gate signal (low trigger) 1: Triggered 0: Not triggered      |
|9    |Signal 10|Custom Low 1 Signal (Low Trigger) 1: Triggered 0: Not        |
|     |         |Triggered                                                    |
|10   |Signal 11|Custom Low 2 Signal (Low Trigger) 1: Triggered 0: Not        |
|     |         |Triggered                                                    |

```

54 Appendix Extended Peripheral Data: Tire Pressure Data Table

```text
|overal|byte   |type |lengt|content   |description                             |
|l     |sequenc|     |h    |          |                                        |
|length|e      |     |     |          |                                        |
|4+4*N |0      |u32  |4    |tire mask |The higher bits come first, followed by |
|      |       |     |     |          |the lower bits.                         |
|      |       |     |     |          |BIT31: Tire No.1 (If 1, the subsequent  |
|      |       |     |     |          |byte contains tire pressure; otherwise, |
|      |       |     |     |          |it is empty)                            |
|      |       |     |     |          |BIT30: Tire No.2 (If 1, subsequent tire |
|      |       |     |     |          |pressure bytes follow; otherwise, it is |
|      |       |     |     |          |empty)                                  |
|      |       |     |     |          |..................                      |
|      |       |     |     |          |BIT0: Tire number 32 (1 indicates       |
|      |       |     |     |          |subsequent tire pressure bytes,         |
|      |       |     |     |          |otherwise empty)                        |
|      |4      |u16  |2    |Tire      |Unit: 1 Kpa                             |
|      |       |     |     |pressure  |                                        |
|      |       |     |     |of tire X |                                        |
|      |6      |u8   |1    |Tire      |Unit 1 C shows the value of the         |
|      |       |     |     |temperatur|displayed bit, minus 40 C               |
|      |       |     |     |e of tire |                                        |
|      |       |     |     |X         |                                        |
|      |7      |u8   |1    |Status of |BYTE                                    |
|      |       |     |     |Tire X    |BIT7: Quick leak                        |
|      |       |     |     |          |BIT6: Slow leak                         |
|      |       |     |     |          |BIT5: Low power                         |
|      |       |     |     |          |BIT4: High temperature                  |
|      |       |     |     |          |BIT3: High pressure                     |
|      |       |     |     |          |BIT2: Low voltage                       |
|      |       |     |     |          |                                        |
|      |       |     |     |          |Other reserves                          |
|      |...    |...  |...  |...       |...                                     |
|      |N      |u16  |2    |Tire      |Unit: 1 Kpa                             |
|      |       |     |     |pressure  |                                        |
|      |       |     |     |of tire   |                                        |
|      |       |     |     |X+N       |                                        |
|      |N+2    |u8   |1    |Tire      |Unit 1 C: Display value minus 40 C      |
|      |       |     |     |temperatur|                                        |
|      |       |     |     |e of tire |                                        |
|      |       |     |     |X+N       |                                        |
|      |N+3    |u8   |1    |Tire      |BYTE                                    |
|      |       |     |     |condition |BIT7: Quick leak                        |
|      |       |     |     |at        |BIT6: Slow leak                         |
|      |       |     |     |position  |BIT5: Low power                         |
|      |       |     |     |X+N       |BIT4: High temperature                  |
|      |       |     |     |          |BIT3: High pressure                     |
|      |       |     |     |          |BIT2: Low voltage                       |
|      |       |     |     |          |                                        |
|      |       |     |     |          |Other reserves                          |

```

Note: Only tires with the tire mask set will have the tire  pressure  byte
follow.
For example, when 0x80000000 is the mask, only the first tire pressure  is
displayed.
Example: 0x88000000 0x0082 0x10 0x00 0x0096 0x11 0x80
deputy
Tire No.1: Pressure 130 kPa, temperature 16°C, condition normal.
Tire No.5: Pressure 150 kPa, Temperature 17°C, Condition: Near leak

55 Appendix_Weight Sensor Data Sheet

```text
|field       |data type |field     |Description and Requirements            |
|0           |BYTE      |type      |1: Unit-ton; 2: Unit-kilogram           |
|1           |Word      |rated load|Rated load, did not fill 0              |
|2           |Word      |Current   |Current load                            |
|            |          |load      |                                        |
|3           |BYTE      |original  |No original data exists to generate this|
|            |          |data type |and subsequent fields                   |
|            |          |          |1-Jiangsu Super Control                 |
| 4          |BYTE[N]   |initial   |                                        |
|            |          |data      |                                        |

```

56 Appendix_External Oil Sensitivity Data Table

```text
|overal|byte   |type |lengt|content   |description                           |
|l     |sequenc|     |h    |          |                                      |
|length|e      |     |     |          |                                      |
|3+5*N |0      |u8   |1    |valid flag|0: Invalid 1: Valid (oil sense online)|
|      |1      |u8   |1    |oil type  |0: Aide ultrasonic oil sensor; 1:     |
|      |       |     |     |          |Omnicomm oil sensor; 2: Differential  |
|      |       |     |     |          |pressure sensor                       |
|      |2      |u8   |1    |oil mask  |The higher bits come first, followed  |
|      |       |     |     |          |by the lower bits.                    |
|      |       |     |     |          |BIT6: Oil sense 1 (If 1, subsequent   |
|      |       |     |     |          |bytes indicate oil sense; otherwise,  |
|      |       |     |     |          |it is empty)                          |
|      |       |     |     |          |BIT5: Oil sense 2 (If 1, subsequent   |
|      |       |     |     |          |bytes indicate oil sense; otherwise,  |
|      |       |     |     |          |it is empty)                          |
|      |       |     |     |          |..................                    |
|      |       |     |     |          |BIT0: Oil sense bit 8 (1 indicates    |
|      |       |     |     |          |subsequent oil sense bytes, 0         |
|      |       |     |     |          |indicates none)                       |
|      |3      |u8   |1    |No.1 Oil  |1：0.1mm      2: 0.1%     3:0.1ml     |
|      |       |     |     |Sensitivit|                                      |
|      |       |     |     |y Unit    |                                      |
|      |3+1    |u32  |4    |1 oil     |actual value                          |
|      |       |     |     |sense     |                                      |
|      |       |     |     |value     |                                      |
|      |…      |…    |…    |…         |…                                     |
|      |3+（N-1|u8   |1    |No.1 Oil  |1：0.1mm      2: 0.1%     3:0.1ml     |
|      |）*5   |     |     |Sensitivit|                                      |
|      |       |     |     |y Unit    |                                      |
|      |3+（N-1|u32  |4    |N oil     |actual value                          |
|      |）*5+1 |     |     |sense     |                                      |
|      |       |     |     |value     |                                      |

```

57 Appendix_6 Data Collection Table for Fire Truck

```text
|overal|byte   |type |lengt|content      |description                        |
|l     |sequenc|     |h    |             |                                   |
|length|e      |     |     |             |                                   |
|12    |0      |WORD |2    |Fire truck   |Actual value: 0.01% (the uploaded  |
|      |       |     |     |water tank   |value divided by 100 is xx.xx%)    |
|      |       |     |     |level        |                                   |
|      |2      |WORD |2    |Fire truck   |Actual value: 0.01% (the uploaded  |
|      |       |     |     |foam tank    |value divided by 100 is xx.xx%)    |
|      |       |     |     |liquid level |                                   |
|      |4      |WORD |2    |obligate     |                                   |
|      |6      |WORD |2    |obligate     |                                   |
|      |8      |WORD |2    |obligate     |                                   |
|      |10     |WORD |2    |obligate     |                                   |

```

58 Appendix Version Information Package

```text
|Start byte |field        |data type  |Description and Requirements          |
|0          |Terminal     |STRING[14] |Software version: HLM200_V201001      |
|           |software     |           |HL--------Product Name                |
|           |version      |           |M200_------Terminal Name Code         |
|           |number       |           |V201-------Major software version     |
|           |             |           |number, release version               |
|           |             |           |001--------Software minor version     |
|           |             |           |number, for internal testing          |
|           |             |           |submission                            |
|14         |Terminal     |STRING[10] |Release date: 2018-11-19              |
|           |software     |           |                                      |
|           |version date |           |                                      |
|24         |CPU ID       |BYTE[12]   |                                      |
|36         |GSM TYPE Name|STRING[15] |GSM model ：                          |
|51         |GSM IMEI     |STRING[15] |GSM IMEI                              |
|66         |SIM card IMSI|STRING[15] |Terminal SIM card IMSI number         |
|           |number       |           |                                      |
|81         |SIM card     |STRING[20] |Terminal SIM card ICCID number        |
|           |ICCID        |           |                                      |
|101        |Car Type     |WORD       |Vehicle series model ID               |
|103        |VIN          |STRING[17] |Vehicle VIN                           |
|120        |Total mileage|DWORD      |Cumulative mileage after terminal     |
|           |             |           |installation or instrument mileage (m)|
|124        |cumulative   |DWORD      |Cumulative fuel consumption (ml) after|
|           |fuel         |           |terminal installation                 |
|           |consumption  |           |                                      |

```

59 Appendix Version Information Package Response

```text
|Start byte |field       |data type  |Description and Requirements          |
|0          |Current time|BYTE[6]    |Date and time (BCD code) Beijing Time,|
|           |on the      |           |Eastern Time Zone 8                   |
|           |platform    |           |For example:                          |
|           |            |           |0x19,0x01,0x28,0x18,0x10,0x30         |
|           |            |           |At 18:10:30 Beijing Time on January   |
|           |            |           |19,2028                               |
|6          |motorcycle  |WORD       |Fill with 0 if no vehicle model is    |
|           |type ID     |           |required                              |
|8          |displacement|WORD       |Unit: milliliters. Fill with 0 if not |
|           |            |           |specified.                            |
|10         |Upgrade     |BYTE       |Upgrade 0x55, no other upgrades       |

```

60 Attachment_TEXT Information Distribution Message Body

```text
|Start byte |field       |data type  |Description and Requirements          |
|0          |sign        |BYTE       |Text Message Flag Meaning Appendix    |
|1          |Text message|STRING     |The maximum length is 102 bytes,      |
|           |            |           |encoded in GBK.                       |

```

61 Appendix_Text Information Flag Meaning

```text
|bit                             |sign                                      |
|0                               |1: Urgent (for sending SMS)               |
|1                               |continue to have                          |
|2                               |1: Terminal display                       |
|3                               |1: Terminal TTS playback                  |
|4                               |1: Display on the advertisement screen    |
|5                               |1: HUD text data transparency             |
|6-7                             |continue to have                          |

```

62 Attachment Text Information Sender

```text
|Start  |field    |data type     |Description and Requirements               |
|byte   |         |              |                                           |
|0      |sign     |BYTE          |'0' represents TXT_BG2312, '1' represents  |
|       |         |              |TXT_UNICODE                                |
|1      |tag mark |STRING        |The default is "*prompt*" and occupies 6   |
|       |         |              |bytes                                      |
|7      |Text     |STRING        |The maximum length is 1024 bytes, encoded  |
|       |message  |              |in GBK.                                    |

```

63 Attachment Data Transmission Message Body

```text
|Start  |field       |data type  |Description and Requirements               |
|byte   |            |           |                                           |
|0      |Transparent |BYTE       |Transparent Message Type Definition Table  |
|       |message type|           |                                           |
|1      |Transmit    |[N]BYTE    |Match message content                      |
|       |message     |           |                                           |
|       |content     |           |                                           |

```

64 Attachment_Definition of Through-Transmission Message Types

```text
|Transparen|Transmit message content |Description and Requirements          |
|t message |                         |                                      |
|type      |                         |                                      |
|0xF1      |Driving range data (sent |trip data packet                      |
|          |when engine is off)      |                                      |
|0xF2      |fault code data (uplink  |fault code data packet                |
|          |transmission of status   |                                      |
|          |change)                  |                                      |
|0xF3      |Enter hibernation (Send  |Sleep in packet                       |
|          |data in hibernation mode)|                                      |
|0xF4      |Wake from sleep (Exit    |hibernation wake up packet            |
|          |sleep mode and send      |                                      |
|          |uplink)                  |                                      |
|0xF5      |Vehicle GPS streamlined  |Not joined yet                        |
|          |data package (Truck      |                                      |
|          |version, uplink)         |                                      |
|0xF6      |MCU Upgrade Status       |MCU Upgrade Status Feedback Package   |
|          |Feedback Package (Uplink)|                                      |
|0xF7      |Suspected collision alarm|suspected collision alarm description |
|          |description package      |package                               |
|          |(uplink)                 |                                      |
|0x41      |Serial port 1 transparent|Serial port 1 transparent transmission|
|          |transmission             |                                      |
|          |(upstream/downstream)    |                                      |
|0x42      |Serial port 2 transparent|Serial port 2 transparent transmission|
|          |transmission             |information                           |
|          |(upstream/downstream)    |                                      |

```

65 Appendix_Driving Trip Data Package F1

```text
|field    |data type|Description and Requirements                            |
|informati|WORD     |                                                        |
|on ID    |         |                                                        |
|message  |BYTE     |                                                        |
|length   |         |                                                        |
|informati|         |dynamic information table of driving mileage data       |
|on       |         |                                                        |
|content  |         |                                                        |

```

66 Appendix_Dynamic Information Table of Driving Trip Data

```text
|inform|infor|information content      |type|description                     |
|ation |matio|                         |    |                                |
|ID    |n    |                         |    |                                |
|      |lengt|                         |    |                                |
|      |h    |                         |    |                                |
|0x0001|6    |ACC ON TimeBCD[6]        |u8  |YY-MM-DD-hh-mm-ss (GMT+8)       |                               |
|      |     |                         |    |Eastern Time, BCD code          |                               |
|0x0002|6    |ACC OFF TimeBCD[6]       |u8  |YY-MM-DD-hh-mm-ss (GMT+8)       |
|      |     |                         |    |Eastern Time, BCD code          |
|0x0003|4    |ACCON latitude           |u32 |Unit: 0.000001 degree, Bit31=0/1|
|      |     |                         |    |north latitude/south latitude   |
|0x0004|4    |ACCON longitude          |u32 |Unit: 0.000001 degree, Bit31=0/1|
|      |     |                         |    |east longitude/west longitude   |
|0x0005|4    |ACC ACC Latitude         |u32 |Unit: 0.000001 degree, Bit31=0/1|
|      |     |                         |    |north latitude/south latitude   |
|0x0006|4    |ACC longitude            |u32 |Unit: 0.000001 degree, Bit31=0/1|
|      |     |                         |    |east longitude/west longitude   |
|0x0007|2    |Trip Mark                |u16 |Driving Cycle Label             |
|0x0008|1    |Trip Distance Type       |u8  |A driving cycle total mileage   |
|      |     |                         |    |type:                           |
|      |     |                         |    |0x01 Total GPS mileage          |
|      |     |                         |    |(cumulative) 0x01 Total GPS     |
|      |     |                         |    |mileage (cumulative)            |
|      |     |                         |    |0x02 Other 1[J1939 Mileage      |
|      |     |                         |    |Algorithm 1] 0x02 Other 1[J1939 |
|      |     |                         |    |Mileage Algorithm 1]            |
|      |     |                         |    |0x03 Other 2[J1939 Mileage      |
|      |     |                         |    |Algorithm 2] 0x03 Other 2[J1939 |
|      |     |                         |    |Mileage Algorithm 2]            |
|      |     |                         |    |0x04 Other 3[J1939 Mileage      |
|      |     |                         |    |Algorithm 3] 0x04 Other 3[J1939 |
|      |     |                         |    |Mileage Algorithm 3]            |
|      |     |                         |    |0x05 Other 4[J1939 Mileage      |
|      |     |                         |    |Algorithm 4] 0x05 Other 4[J1939 |
|      |     |                         |    |Mileage Algorithm 4]            |
|      |     |                         |    |0x06 Other 5[J1939 Mileage      |
|      |     |                         |    |Algorithm 5] 0x06 Other 5[J1939 |
|      |     |                         |    |Mileage Algorithm 5]            |
|      |     |                         |    |0x07 OBD Instrument Mileage 0x07|
|      |     |                         |    |OBD Instrument Mileage          |
|      |     |                         |    |0x08 OBD speed and mileage 0x08 |
|      |     |                         |    |OBD speed and mileage           |
|      |     |                         |    |0x09 Other 6[J1939 Mileage      |
|      |     |                         |    |Algorithm 6] 0x09 Other 6[J1939 |
|      |     |                         |    |Mileage Algorithm 6]            |
|      |     |                         |    |0x0A Other 7[J1939 Mileage      |
|      |     |                         |    |Algorithm 7] 0x0A Other 7[J1939 |
|      |     |                         |    |Mileage Algorithm 7]            |
|      |     |                         |    |0x0B Other 8[J1939 Mileage      |
|      |     |                         |    |Algorithm 8] 0x0B Other 8[J1939 |
|      |     |                         |    |Mileage Algorithm 8]            |
|      |     |                         |    |0x0C Other 9[J1939 Mileage      |
|      |     |                         |    |Algorithm 9] 0x0C Other 9[J1939 |
|      |     |                         |    |Mileage Algorithm 9]            |
|0x0009|4    |Trip Distance            |u32 |A driving cycle's total         |
|      |     |                         |    |distance, in meters             |
|0x000A|4    |Trip Fuel Consum         |u32 |Total fuel consumption per      |
|      |     |                         |    |driving cycle, in milliliters   |
|      |     |                         |    |(ml)                            |
|0x000B|4    |Trip Duration Total      |u32 |Total duration of a driving     |
|      |     |                         |    |cycle, in seconds               |
|0x000C|2    |Trip Overspeed Duration  |u16 |The cumulative duration of a    |
|      |     |                         |    |driving cycle speeding, in      |
|      |     |                         |    |seconds                         |
|0x000D|2    |Trip OverSpd Times       |u16 |Number of speeding violations   |
|      |     |                         |    |per driving cycle               |
|0x000E|1    |Trip Speed Average       |u8  |The average speed of a driving  |
|      |     |                         |    |cycle, in km/h                  |
|0x000F|1    |Trip Speed Maximum       |u8  |The maximum speed of a driving  |
|      |     |                         |    |cycle, in km/h                  |
|0x0010|4    |Trip Idle Duration       |u32 |The idle duration per driving   |
|      |     |                         |    |cycle, in seconds               |
|0x0011|1    |Trip Mask of Braking     |u8  |Whether to support the number of|
|      |     |                         |    |foot brake operations during    |
|      |     |                         |    |driving cycles. 1 means support.|
|0x0012|2    |Trip Number of Braking   |u16 |Total number of foot brake      |
|      |     |                         |    |operations per driving cycle,   |
|      |     |                         |    |per unit                        |
|0x0013|4    |Trip Accelerate times    |u32 |Number of rapid accelerations in|
|      |     |                         |    |a driving cycle                 |
|0x0014|4    |Trip Decelerate times    |u32 |Number of sharp decelerations in|
|      |     |                         |    |a driving cycle                 |
|0x0015|4    |Trip Sharp turn times    |u32 |Number of sharp turns in a      |
|      |     |                         |    |driving cycle                   |
|0x0016|4    |Trip Miles Spd less than |u32 |Distance at-20 km/h, unit: m    |
|      |     |20Km/H                   |    |                                |
|0x0017|4    |Trip Miles Spd between   |u32 |Distance at a speed of 20-40    |
|      |     |20-40Km/H                |    |km/h, unit: m                   |
|0x0018|4    |Trip Miles Spd between   |u32 |Distance at 40-60 km/h, unit: m |
|      |     |40-60Km/H                |    |                                |
|0x0019|4    |Trip Miles Spd between   |u32 |Distance at 60-80 km/h, unit: m |
|      |     |60-80Km/H                |    |                                |
|0x001A|4    |Trip Miles Spd between   |u32 |Distance at a speed of 80-100   |
|      |     |80-100Km/H               |    |km/h, unit: m                   |
|0x001B|4    |Trip Miles Spd between   |u32 |Distance at a speed of 100-120  |
|      |     |100-120Km/H              |    |km/h, unit: m                   |
|0x001C|4    |Trip Miles Spd Over      |u32 |Miles at speeds above 120 km/h, |
|      |     |120Km/H                  |    |unit: m                         |
|0x001D|4    |idle fuel consumption    |u32 |Idle fuel consumption per trip, |
|      |     |                         |    |unit: mL                        |

```

67 Appendix Fault Code Data Packet F2

```text
|byte     |content |Bytes|data  |description                                  |
|position |        |     |type  |                                             |
|0        |TIME    |6    |u8    |YY-MM-DD-hh-mm-ss (GMT+8 time)               |
|         |BCD[6]  |     |      |                                             |
|6        |latitude|4    |u32   |Unit: 0.000001 degree, Bit31=0/1 north       |
|         |        |     |      |latitude/south latitude                      |
|10       |longitud|4    |u32   |Unit: 0.000001 degree, Bit31=0/1 east        |
|         |e       |     |      |longitude/west longitude                     |
|14       |Dtc Num |1    |u8    |0 indicates no fault code, non-zero indicates|
|         |        |     |      |the number of fault codes.                   |
|15       |Dtc1 ID |4    |BYTE  |The first fault code ID: 4 bytes             |
|19       |Dtc2 ID |4    |BYTE  |The second fault code ID: 4 bytes            |
|23       |Dtc3 ID |4    |BYTE  |The third fault code ID: 4 bytes             |
|…        |…       |…    |…     |…                                            |

```

Note: A fault code consists of 4 bytes.

When the protocol type is  not  0xF0  (i.e.,  not  J1939  protocol),  the
corresponding values are system ID, fault byte 1, fault byte  2,  and  fault
byte 3.

If the protocol type is OXF0, the first three bytes represent  the  fault
code, and the fourth byte indicates the fault code status.

68 Attachment_Hibernation Enter Data Packet F3

```text
|byte   |content    |Bytes |Number|description                               |
|positio|           |      |type  |                                          |
|n      |           |      |      |                                          |
|0      |Time       |6     |u8    |Sleep-in time: YY-MM-DD-hh-mm-ss (GMT+8)  |                          |
|       |BCD[6]     |      |      |Eastern Time, BCD code                    |                          |

```

69 Appendix_Hibernation Wakeup Data Packet F4

```text
|byte    |content   |Bytes |data  |description                               |
|position|          |      |type  |                                          |
|0       |Time      |6     |u8    |Sleep-wake time (YY-MM-DD-hh-mm-ss, GMT+8,|
|        |BCD[6]    |      |      |Eastern Time), BCD code                   |
|6       |Wake Type |1     |u8    |Heartbeat 0X01  Heartbeat 0X01            |
|        |          |      |      |CAN1  0X02  CAN1  0X02                    |
|        |          |      |      |Low voltage 0X04  Low voltage 0X04        |
|        |          |      |      |G-SENSOR   0X08 G-SENSOR   0X08           |
|        |          |      |      |ACC Interrupt 0X10 ACC Interrupt 0X10     |
|        |          |      |      |GSM       0X20  GSM       0X20            |
|        |          |      |      |Voltage threshold meets 0X40              |
|        |          |      |      |Voltage fluctuation 0X80                  |
|7       |Bat Vol   |2     |u16   |bus voltage                               |
|9       |Accel     |2     |u16   |Vibration acceleration value              |
|        |Total     |      |      |                                          |

```

70 Appendix: Feedback Package F6 on MCU Upgrade Status

```text
|byte   |content    |Bytes |Number|description                               |
|positio|           |      |type  |                                          |
|n      |           |      |      |                                          |
|0      |Upgrade    |1     |u8    |0x00 Successful                           |                          |
|       |status     |      |      |0x01 The software version numbers are the |                          |
|       |           |      |      |same                                      |                          |
|       |           |      |      |0x02 Upgrade parameter format error       |                          |
|       |           |      |      |0x03 FTP login timeout                    |                          |
|       |           |      |      |0x04 Download timed out                   |                          |
|       |           |      |      |0x05 File verification error              |                          |
|       |           |      |      |0x06 Invalid file type                    |                          |
|       |           |      |      |0x07 The file does not exist              |                          |
|       |           |      |      |0x08 Other errors                         |                          |

```

71 Appendix_Suspected Collision Alarm Description Package F7

After triggering a collision, the system collects collision  data  at  fixed
time points before and after the collision at a  specified  frequency,  then
reports it to the platform via the F7 command.

Note: If the device supports F7 collision reporting,  the  0x0114  collision
command in the 0200 alarm data does not need to  be  reported,  and  the  F7
command takes precedence.

```text
|byte       |content  |Byt|data type  |description                           |
|position   |         |es |           |                                      |
|0          |TIME     |6  |unsigned   |YY-MM-DD-hh-mm-ss (GMT+8 time), the   |
|           |BCD[6]   |   |char       |time of collision                     |
|6          |latitude |4  |unsigned   |Unit: 0.000001 degree, Bit31=0/1 north|
|           |         |   |int        |latitude/south latitude, latitude     |
|           |         |   |           |during collision                      |
|10         |longitude|4  |unsigned   |Unit: 0.000001 degree, Bit31=0/1 east |
|           |         |   |int        |longitude/west longitude, longitude   |
|           |         |   |           |when collision occurs                 |
|14         |frequency|4  |unsigned   |Set the data collection frequency to  |
|           |of       |   |int        |ensure 20 seconds of data is collected|
|           |collectio|   |           |before and after the collision. The   |
|           |n        |   |           |default frequency is 500 milliseconds |
|           |         |   |           |and can be modified.                  |
|           |         |   |           |<1> Frequency: 1000 milliseconds per  |
|           |         |   |           |cycle, total collection: 20 times,    |
|           |         |   |           |total duration: 20 seconds            |
|           |         |   |           |<2> Frequency: 500 milliseconds per   |
|           |         |   |           |cycle, total collection: 40 times,    |
|           |         |   |           |total duration: 20 seconds            |
|           |         |   |           |<3> Frequency: 250 milliseconds per   |
|           |         |   |           |cycle, total collection: 80 times,    |
|           |         |   |           |total duration: 20 seconds            |
|18         |collision|1  |unsigned   |0x00: Minor                           |
|           |level    |   |char       |0x01: Moderate                        |
|           |         |   |           |0x02: Severity Level                  |
|19+((N-1)*7|X-axis   |2  |signed     |N=1; Unit: mg; Range: -32768 to 32768 |
|)+0        |accelerat|   |short int  |                                      |
|           |ion [1]  |   |           |                                      |
|19+((N-1)*7|Y-axis   |2  |signed     |N=1; Unit: mg; Range: -32768 to 32768 |
|)+2        |accelerat|   |short int  |                                      |
|           |ion [1]  |   |           |                                      |
|19+((N-1)*7|Z-axis   |2  |signed     |N=1; Unit: mg; Range: -32768 to 32768 |
|)+4        |accelerat|   |short int  |                                      |
|           |ion [1]  |   |           |                                      |
|19+((N-1)*7|Speed [1]|1  |unsigned   |N=1; unit: km/h                       |
|)+6        |         |   |char       |                                      |
|19+((N-1)*7|X-axis   |2  |signed     |N=2; Unit: mg; Range: -32768 to 32768 |
|)+0        |accelerat|   |short int  |                                      |
|           |ion [2]  |   |           |                                      |
|19+((N-1)*7|Y-axis   |2  |signed     |N=2; Unit: mg; Range: -32768 to 32768 |
|)+2        |accelerat|   |short int  |                                      |
|           |ion [2]  |   |           |                                      |
|19+((N-1)*7|Z-axis   |2  |signed     |N=2; Unit: mg; Range: -32768 to 32768 |
|)+4        |accelerat|   |short int  |                                      |
|           |ion [2]  |   |           |                                      |
|19+((N-1)*7|Speed [2]|1  |unsigned   |N=2; unit: km/h                       |
|)+6        |         |   |char       |                                      |
|...        |...      |...|...        |...                                   |
|...        |...      |...|...        |...                                   |
|...        |...      |...|...        |...                                   |
|...        |...      |...|...        |...                                   |
|19+((N-1)*7|X-axis   |2  |signed     |N=N; unit: mg; range: -32768 to 32768 |
|)+0        |accelerat|   |short int  |                                      |
|           |ion [N]  |   |           |                                      |
|19+((N-1)*7|Y-axis   |2  |signed     |N=N; unit: mg; range: -32768 to 32768 |
|)+2        |accelerat|   |short int  |                                      |
|           |ion [N]  |   |           |                                      |
|19+((N-1)*7|Z-axis   |2  |signed     |N=N; unit: mg; range: -32768 to 32768 |
|)+4        |accelerat|   |short int  |                                      |
|           |ion [N]  |   |           |                                      |
|19+((N-1)*7|velocity |1  |unsigned   |N=N; unit: km/h                       |
|)+6        |[N]      |   |char       |                                      |

```

72 Appendix CAN Broadcast Data Stream [Custom Feature]

```text
|content   |Bytes |data  |description                                        |
|          |      |type  |                                                   |
|time      |6     |BCD[6]|YY-MM-DD-hh-mm-ss (GMT+8 device reporting uses     |
|          |      |      |Beijing Time as the reference)                     |
|CANID tote|2     |Word  |The total number of CAN ID data collected by the   |
|          |      |      |bus, corresponding to the number of lists, N       |
|CAN       |12    |BYTE[1|The total is 12 bytes, with the first 4 bytes being|
|List[1]   |      |2]    |the CAN ID and the last 8 bytes being the          |
|          |      |      |corresponding data stream.                         |
|...       |      |      |                                                   |
|CAN       |12    |BYTE[1|The total is 12 bytes, with the first 4 bytes being|
|List[N]   |      |2]    |the CAN ID and the last 8 bytes being the          |
|          |      |      |corresponding data stream.                         |

```

73 Appendix: New Energy Vehicle BMS Data Information Body

```text
|Start   |field         |data   |Description and Requirements                 |
|byte    |              |type   |                                             |
|0       |time          |BCD[6] |YY-MM-DD-hh-mm-ss (GMT+8 device reporting    |
|        |              |       |uses Beijing Time as the reference)          |
|6       |BMS data      |WORD   |                                             |
|        |content length|       |                                             |
|8       |BMS data      |nByte  |For details, see the data flow of the new    |
|        |content       |       |energy vehicle BMS.                          |
|        |              |       |Data format: Data packet includes ID (2      |
|        |              |       |bytes), length (2 bytes) + data (N bytes)    |

```

74 Appendix: New Energy Vehicle BMS Data Flow

```text
|functio|Length|function        |unit   |description                          |
|n      |[2]   |                |       |                                     |
|ID[2]  |      |                |       |                                     |
|0x0001 |N     |voltage of a    |       |Voltage Data Sheet of Single Cell    |
|       |      |single cell     |       |Battery Pack                         |
|0x0002 |N     |temperature of a|       |Temperature Data Sheet of Single Cell|
|       |      |single battery  |       |Battery Pack                         |
|       |      |pack            |       |                                     |
|       |      |                |       |                                     |

```

75 Appendix_ New Energy Vehicle BMS Data Flow: Voltage Data Table of  Single
Battery Pack

```text
|overal|byte   |type |content        |description                               |
|l     |sequenc|     |               |                                          |
|length|e      |     |               |                                          |
|16+2*N|0      |DWORD|Voltage mask 0 |The higher bits come first, followed by   |
|      |       |     |for single     |the lower bits.                           |
|      |       |     |battery pack   |BIT31: Unit 1 battery pack (If 1,         |
|      |       |     |               |subsequent bytes indicate battery packs;  |
|      |       |     |               |otherwise, it is empty)                   |
|      |       |     |               |BIT30: The second cell pack (if 1,        |
|      |       |     |               |subsequent cell pack bytes will follow;   |
|      |       |     |               |otherwise, it is empty)                   |
|      |       |     |               |..................                        |
|      |       |     |               |BIT0: The 32nd cell pack (if 1, subsequent|
|      |       |     |               |cell pack bytes follow; otherwise, it is  |
|      |       |     |               |empty)                                    |
|      |4      |DWORD|Voltage mask 1 |The higher bits come first, followed by   |
|      |       |     |for single cell|the lower bits.                           |
|      |       |     |battery pack   |BIT31: The 33rd cell pack (if 1,          |
|      |       |     |               |subsequent bytes indicate cell packs;     |
|      |       |     |               |otherwise, it is empty)                   |
|      |       |     |               |..................                        |
|      |       |     |               |BIT0: The 64th cell pack (if 1, subsequent|
|      |       |     |               |cell pack bytes follow; otherwise, it is  |
|      |       |     |               |empty)                                    |
|      |8      |DWORD|Voltage mask 2 |The higher bits come first, followed by   |
|      |       |     |for single cell|the lower bits.                           |
|      |       |     |battery pack   |BIT31: Unit 65 battery pack (If 1,        |
|      |       |     |               |subsequent bytes indicate battery packs;  |
|      |       |     |               |otherwise, it is empty)                   |
|      |       |     |               |..................                        |
|      |       |     |               |BIT0: The 96th cell pack (if 1, subsequent|
|      |       |     |               |cell pack bytes follow; otherwise, it is  |
|      |       |     |               |empty)                                    |
|      |12     |DWORD|Voltage mask 3 |The higher bits come first, followed by   |
|      |       |     |for single-cell|the lower bits.                           |
|      |       |     |battery pack   |BIT31: Unit 97 battery pack (If 1,        |
|      |       |     |               |subsequent bytes indicate battery packs;  |
|      |       |     |               |otherwise, it is empty)                   |
|      |       |     |               |..................                        |
|      |       |     |               |BIT0: The 128th cell pack (if 1,          |
|      |       |     |               |subsequent bytes indicate cell packs;     |
|      |       |     |               |otherwise, it is empty)                   |
|      |16     |DWORD|Voltage mask 4 |The higher bits come first, followed by   |
|      |       |     |for single cell|the lower bits.                           |
|      |       |     |battery pack   |BIT31: The 129th cell pack (if 1,         |
|      |       |     |               |subsequent bytes indicate cell packs;     |
|      |       |     |               |otherwise, it is empty)                   |
|      |       |     |               |..................                        |
|      |       |     |               |BIT0: The 160th cell pack (if 1,          |
|      |       |     |               |subsequent cell pack bytes follow;        |
|      |       |     |               |otherwise, it is empty)                   |
|      |20     |DWORD|Voltage mask 5 |The higher bits come first, followed by   |
|      |       |     |for single-cell|the lower bits.                           |
|      |       |     |battery pack   |BIT31: The 161st cell pack (if 1,         |
|      |       |     |               |subsequent bytes indicate cell packs;     |
|      |       |     |               |otherwise, it is empty)                   |
|      |       |     |               |..................                        |
|      |       |     |               |BIT0: The 192nd cell pack (if 1,          |
|      |       |     |               |subsequent bytes indicate cell packs;     |
|      |       |     |               |otherwise, it is empty)                   |
|      |24     |DWORD|Voltage mask 6 |The higher bits come first, followed by   |
|      |       |     |for single-cell|the lower bits.                           |
|      |       |     |battery pack   |BIT31: The 193rd cell pack (if 1,         |
|      |       |     |               |subsequent bytes indicate cell packs;     |
|      |       |     |               |otherwise, it is empty)                   |
|      |       |     |               |..................                        |
|      |       |     |               |BIT0: The 224th cell pack (1 indicates    |
|      |       |     |               |subsequent cell pack bytes, 0 indicates   |
|      |       |     |               |none)                                     |
|      |28     |DWORD|Voltage mask 7 |The higher bits come first, followed by   |
|      |       |     |for single-cell|the lower bits.                           |
|      |       |     |battery pack   |BIT31: The 225th cell pack (if 1,         |
|      |       |     |               |subsequent cell pack bytes follow;        |
|      |       |     |               |otherwise, it is empty)                   |
|      |       |     |               |..................                        |
|      |       |     |               |BIT0: The 256th cell pack (1 indicates    |
|      |       |     |               |subsequent cell pack bytes, 0 indicates   |
|      |       |     |               |none)                                     |
|      |32     |DWORD|Voltage mask 8 |The higher bits come first, followed by   |
|      |       |     |for single cell|the lower bits.                           |
|      |       |     |battery pack   |BIT31: Unit 257 battery pack (If 1,       |
|      |       |     |               |subsequent bytes indicate battery packs;  |
|      |       |     |               |otherwise, it is empty)                   |
|      |       |     |               |..................                        |
|      |       |     |               |BIT0: The 288th cell pack (if 1,          |
|      |       |     |               |subsequent cell pack bytes follow;        |
|      |       |     |               |otherwise, it is empty)                   |
|      |36     |DWORD|Voltage mask 9 |The higher bits come first, followed by   |
|      |       |     |for single-cell|the lower bits.                           |
|      |       |     |battery pack   |BIT31: The 289th cell pack (if 1,         |
|      |       |     |               |subsequent cell pack bytes follow;        |
|      |       |     |               |otherwise, it is empty)                   |
|      |       |     |               |..................                        |
|      |       |     |               |BIT0: The 320th cell pack (1 indicates    |
|      |       |     |               |subsequent cell pack bytes, 0 indicates   |
|      |       |     |               |none)                                     |
|      |40     |DWORD|Voltage mask 10|The higher bits come first, followed by   |
|      |       |     |for a single   |the lower bits.                           |
|      |       |     |battery pack   |BIT31: The 321st cell pack (if 1,         |
|      |       |     |               |subsequent bytes indicate cell packs;     |
|      |       |     |               |otherwise, it is empty)                   |
|      |       |     |               |..................                        |
|      |       |     |               |BIT0: The 352nd cell pack (1 indicates    |
|      |       |     |               |subsequent cell pack bytes, 0 indicates   |
|      |       |     |               |none)                                     |
|      |44     |DWORD|Voltage mask 11|The higher bits come first, followed by   |
|      |       |     |of a single    |the lower bits.                           |
|      |       |     |cell battery   |BIT31: The 353rd cell pack (if 1,         |
|      |       |     |pack           |subsequent bytes indicate cell packs;     |
|      |       |     |               |otherwise, it is empty)                   |
|      |       |     |               |..................                        |
|      |       |     |               |BIT0: The 384th cell pack (if 1,          |
|      |       |     |               |subsequent cell pack bytes follow;        |
|      |       |     |               |otherwise, it is empty)                   |
|      |48     |WORD |Voltage of the |Unit 0.001V                               |
|      |       |     |first single   |Range: 0~65534 (with a value offset of    |
|      |       |     |battery pack   |32767, indicating-32.767V to +32.767V)    |
|      |       |     |               |Description: (Upload value-32767)/1000V   |
|      |...    |WORD |...            |Unit 0.001V                               |
|      |       |     |               |Range: 0~65534 (with a value offset of    |
|      |       |     |               |32767, indicating-32.767V to +32.767V)    |
|      |       |     |               |Description: (Upload value-32767)/1000V   |
|      |N      |WORD |Voltage of the |Unit 0.001V                               |
|      |       |     |Nth monomer    |Range: 0~65534 (with a value offset of    |
|      |       |     |battery pack   |32767, indicating-32.767V to +32.767V)    |
|      |       |     |               |Description: (Upload value-32767)/1000V   |

```

Note: Only the subsequent cell pack with the voltage mask set for the cell
pack will be followed by the cell pack voltage byte.
For example, when  0x80000000,0x00000000,0x00000000,  and  0x00000000  are
used as masks, only the voltage of the  first  individual  battery  pack  is
displayed.
For example, when 0x88000000,0x00000000,0x00000000,0x00000000,0x8158,  and
0x7EA6 are used as masks, they are followed by the voltage values  of  the
1st and 5th individual battery packs, as shown below:
The voltage of the No.1 single-cell battery pack is +3.45V.
The voltage of the 5th single battery pack is-3.45V.

76 Appendix_ New Energy Vehicle BMS Data Flow:  Temperature  Data  Table  of
Single Battery Pack

```text
|overal|byte   |type |content       |description                               |
|l     |sequenc|     |              |                                          |
|length|e      |     |              |                                          |
|16+2*N|0      |DWORD|Temperature   |The higher bits come first, followed by   |
|      |       |     |mask 0 for    |the lower bits.                           |
|      |       |     |single battery|BIT31: Unit 1 battery pack (If 1,         |
|      |       |     |pack          |subsequent bytes indicate battery packs;  |
|      |       |     |              |otherwise, it is empty)                   |
|      |       |     |              |BIT30: The second cell pack (if 1,        |
|      |       |     |              |subsequent cell pack bytes will follow;   |
|      |       |     |              |otherwise, it is empty)                   |
|      |       |     |              |..................                        |
|      |       |     |              |BIT0: The 32nd cell pack (if 1, subsequent|
|      |       |     |              |cell pack bytes follow; otherwise, it is  |
|      |       |     |              |empty)                                    |
|      |4      |DWORD|Temperature   |The higher bits come first, followed by   |
|      |       |     |mask 1 for    |the lower bits.                           |
|      |       |     |single battery|BIT31: The 33rd cell pack (if 1,          |
|      |       |     |pack          |subsequent bytes indicate cell packs;     |
|      |       |     |              |otherwise, it is empty)                   |
|      |       |     |              |..................                        |
|      |       |     |              |BIT0: The 64th cell pack (if 1, subsequent|
|      |       |     |              |cell pack bytes follow; otherwise, it is  |
|      |       |     |              |empty)                                    |
|      |8      |DWORD|Temperature   |The higher bits come first, followed by   |
|      |       |     |mask 2 for    |the lower bits.                           |
|      |       |     |single cell   |BIT31: Unit 65 battery pack (If 1,        |
|      |       |     |battery pack  |subsequent bytes indicate battery packs;  |
|      |       |     |              |otherwise, it is empty)                   |
|      |       |     |              |..................                        |
|      |       |     |              |BIT0: The 96th cell pack (if 1, subsequent|
|      |       |     |              |cell pack bytes follow; otherwise, it is  |
|      |       |     |              |empty)                                    |
|      |12     |DWORD|Temperature   |The higher bits come first, followed by   |
|      |       |     |mask 3 for    |the lower bits.                           |
|      |       |     |single battery|BIT31: Unit 96 battery pack (If 1,        |
|      |       |     |pack          |subsequent bytes indicate battery packs;  |
|      |       |     |              |otherwise, it is empty)                   |
|      |       |     |              |..................                        |
|      |       |     |              |BIT0: The 128th cell pack (if 1,          |
|      |       |     |              |subsequent bytes indicate cell packs;     |
|      |       |     |              |otherwise, it is empty)                   |
|      |16     |DWORD|Temperature   |The higher bits come first, followed by   |
|      |       |     |mask 4 for    |the lower bits.                           |
|      |       |     |single battery|BIT31: The 129th cell pack (if 1,         |
|      |       |     |pack          |subsequent bytes indicate cell packs;     |
|      |       |     |              |otherwise, it is empty)                   |
|      |       |     |              |..................                        |
|      |       |     |              |BIT0: The 160th cell pack (if 1,          |
|      |       |     |              |subsequent cell pack bytes follow;        |
|      |       |     |              |otherwise, it is empty)                   |
|      |20     |DWORD|Temperature   |The higher bits come first, followed by   |
|      |       |     |mask 5 for    |the lower bits.                           |
|      |       |     |single battery|BIT31: The 161st cell pack (if 1,         |
|      |       |     |pack          |subsequent bytes indicate cell packs;     |
|      |       |     |              |otherwise, it is empty)                   |
|      |       |     |              |..................                        |
|      |       |     |              |BIT0: The 192nd cell pack (if 1,          |
|      |       |     |              |subsequent bytes indicate cell packs;     |
|      |       |     |              |otherwise, it is empty)                   |
|      |24     |DWORD|Temperature   |The higher bits come first, followed by   |
|      |       |     |mask 6 for    |the lower bits.                           |
|      |       |     |single battery|BIT31: The 193rd cell pack (if 1,         |
|      |       |     |pack          |subsequent bytes indicate cell packs;     |
|      |       |     |              |otherwise, it is empty)                   |
|      |       |     |              |..................                        |
|      |       |     |              |BIT0: The 224th cell pack (1 indicates    |
|      |       |     |              |subsequent cell pack bytes, 0 indicates   |
|      |       |     |              |none)                                     |
|      |28     |DWORD|Temperature   |The higher bits come first, followed by   |
|      |       |     |mask 7 for    |the lower bits.                           |
|      |       |     |single cell   |BIT31: The 225th cell pack (if 1,         |
|      |       |     |battery pack  |subsequent cell pack bytes follow;        |
|      |       |     |              |otherwise, it is empty)                   |
|      |       |     |              |..................                        |
|      |       |     |              |BIT0: The 256th cell pack (1 indicates    |
|      |       |     |              |subsequent cell pack bytes, 0 indicates   |
|      |       |     |              |none)                                     |
|      |32     |DWORD|Temperature   |The higher bits come first, followed by   |
|      |       |     |mask 8 for    |the lower bits.                           |
|      |       |     |single cell   |BIT31: Unit 257 battery pack (If 1,       |
|      |       |     |battery pack  |subsequent bytes indicate battery packs;  |
|      |       |     |              |otherwise, it is empty)                   |
|      |       |     |              |..................                        |
|      |       |     |              |BIT0: The 288th cell pack (if 1,          |
|      |       |     |              |subsequent cell pack bytes follow;        |
|      |       |     |              |otherwise, it is empty)                   |
|      |36     |DWORD|Temperature   |The higher bits come first, followed by   |
|      |       |     |mask 9 for    |the lower bits.                           |
|      |       |     |single cell   |BIT31: The 289th cell pack (if 1,         |
|      |       |     |battery pack  |subsequent cell pack bytes follow;        |
|      |       |     |              |otherwise, it is empty)                   |
|      |       |     |              |..................                        |
|      |       |     |              |BIT0: The 320th cell pack (1 indicates    |
|      |       |     |              |subsequent cell pack bytes, 0 indicates   |
|      |       |     |              |none)                                     |
|      |40     |DWORD|Temperature   |The higher bits come first, followed by   |
|      |       |     |mask 10 for   |the lower bits.                           |
|      |       |     |single cell   |BIT31: The 321st cell pack (if 1,         |
|      |       |     |battery pack  |subsequent bytes indicate cell packs;     |
|      |       |     |              |otherwise, it is empty)                   |
|      |       |     |              |..................                        |
|      |       |     |              |BIT0: The 352nd cell pack (1 indicates    |
|      |       |     |              |subsequent cell pack bytes, 0 indicates   |
|      |       |     |              |none)                                     |
|      |44     |DWORD|Temperature   |The higher bits come first, followed by   |
|      |       |     |mask 11 of    |the lower bits.                           |
|      |       |     |single cell   |BIT31: The 353rd cell pack (if 1,         |
|      |       |     |battery pack  |subsequent bytes indicate cell packs;     |
|      |       |     |              |otherwise, it is empty)                   |
|      |       |     |              |..................                        |
|      |       |     |              |BIT0: The 384th cell pack (if 1,          |
|      |       |     |              |subsequent cell pack bytes follow;        |
|      |       |     |              |otherwise, it is empty)                   |
|      |48     |WORD |Temperature of|Unit 0.1℃                                 |
|      |       |     |the first     |Range: 0--2400 (with a numerical offset of|
|      |       |     |single battery|40°C, indicating a temperature range      |
|      |       |     |pack          |from-40°C to +200°C), and the smallest    |
|      |       |     |              |measurement unit is 0.1°C.                |
|      |       |     |              |Description: (Upload value-400) / 10°C    |
|      |...    |WORD |...           |Unit 0.1℃                                 |
|      |       |     |              |Range: 0--2400 (with a numerical offset of|
|      |       |     |              |40°C, indicating a temperature range      |
|      |       |     |              |from-40°C to +200°C), and the smallest    |
|      |       |     |              |measurement unit is 0.1°C.                |
|      |       |     |              |Description: (Upload value-400) / 10°C    |
|      |N      |WORD |Temperature of|Unit 0.1℃                                 |
|      |       |     |the Nth       |Range: 0--2400 (with a numerical offset of|
|      |       |     |monomer       |40°C, indicating a temperature range      |
|      |       |     |battery pack  |from-40°C to +200°C), and the smallest    |
|      |       |     |              |measurement unit is 0.1°C.                |
|      |       |     |              |Description: (Upload value-400) / 10°C    |

```

Note: Only the subsequent cell pack with the temperature mask set for  the
cell pack will be followed by the cell pack temperature byte.
For example, when  0x80000000,0x00000000,0x00000000,  and  0x00000000  are
used as masks, only the temperature of the first individual battery pack  is
displayed.
For example, when 0x88000000,0x00000000,0x00000000,0x00000000,0x0000,  and
0x0960 are used as masks, they are followed by the temperature readings of
the 1st and 5th individual battery packs, as shown below:
The temperature of the No.1 single battery pack is-40.0℃.
The temperature of the 5th monomer battery pack is +200.0℃.

77 Wifi Data Flow

```text
|content   |Bytes |data  |description                                        |
|          |      |type  |                                                   |
|wifi num  |1     |byte  |Number of WiFi hotspots                            |
|,         |1     |byte  |English single-comma separator                     |
|ecn[0]    |n     |string|WiFi hotspot encryption method (backup), fixed to  |
|          |      |      |"-"                                                |
|,         |1     |byte  |English single-comma separator                     |
|ssid[0]   |n     |string|WiFi hotspot name, backup, fixed "-"               |
|,         |1     |byte  |English single-comma separator                     |
|rssi[0]   |1     |byte  |WiFi hotspot signal strength, unit: dBm            |
|,         |1     |byte  |English single-comma separator                     |
|mac [0]   |n     |string|The MAC address of the WiFi hotspot signal, such as|
|          |      |      |"1C:20:DB:8D:D7:80"                                |
|,         |1     |byte  |English single-comma separator                     |
|channel   |1     |byte  |The WiFi hotspot's frequently used channels vary   |
|[0]       |      |      |based on the range returned by each module.        |
|ecn[1]    |n     |string|WiFi hotspot encryption method (backup), fixed to  |
|          |      |      |"-"                                                |
|,         |1     |byte  |English single-comma separator                     |
|ssid[1]   |n     |string|WiFi hotspot name, backup, fixed "-"               |
|,         |1     |byte  |English single-comma separator                     |
|rssi[1]   |1     |byte  |WiFi hotspot signal strength, unit: dBm            |
|,         |1     |byte  |English single-comma separator                     |
|mac [1]   |n     |string|The MAC address of the WiFi hotspot signal, such as|
|          |      |      |"1C:20:DB:8D:D7:80"                                |
|,         |1     |byte  |English single-comma separator                     |
|channel   |1     |byte  |The WiFi hotspot's frequently used channels vary   |
|[1]       |      |      |based on the range returned by each module.        |
|......    |      |      |This field appears only when the wifi num is       |
|          |      |      |greater than 1, with enc[1], ssid[1], rssi[1],     |
|          |      |      |mac[1], and channel[1] separated by commas.        |
|          |      |      |The format is as shown in the gray section above,  |
|          |      |      |with multiple Wi-Fi hotspots added sequentially.   |

```

78 Appendix Extended Peripheral Data: High-Speed  Rail  Tire  Pressure  Data
Table

```text
|overal|byte   |type |lengt|content       |description                         |
|l     |sequenc|     |h    |              |                                    |
|length|e      |     |     |              |                                    |
|8*N   |0      |u8   |1    |Position of   |The first axle has 2 wheels (0x01   |
|      |       |     |     |Sensor X      |and 0x02), while other axles can    |
|      |       |     |     |              |accommodate either 2 or 4 wheels.   |
|      |       |     |     |              |For example, when the second axle   |
|      |       |     |     |              |has two wheels, the numbering is    |
|      |       |     |     |              |0x11 and 0x12; when it has four     |
|      |       |     |     |              |wheels, the numbering is            |
|      |       |     |     |              |0x10,0x11,0x12, and 0x13.           |
|      |       |     |     |              |The third axis is numbered 0x21 and |
|      |       |     |     |              |0x22 for two wheels, and            |
|      |       |     |     |              |0x20,0x21,0x22, and 0x23 for four   |
|      |       |     |     |              |wheels, and so on.                  |
|      |1      |u16  |2    |Pressure of   |Unit: 1 Kpa                         |
|      |       |     |     |the Xth sensor|                                    |
|      |3      |u8   |1    |Temperature of|Unit: 1℃ Display value minus 55℃    |
|      |       |     |     |Sensor X      |                                    |
|      |4      |u16  |2    |Voltage of the|Unit V, precision 0.01              |
|      |       |     |     |Xth sensor    |                                    |
|      |6      |u8   |1    |Y-axis        |unit g, precision 0.1               |
|      |       |     |     |acceleration  |                                    |
|      |       |     |     |of tire X     |                                    |
|      |7      |u8   |1    |Z-axis        |unit g, precision 0.1               |
|      |       |     |     |acceleration  |                                    |
|      |       |     |     |of tire X     |                                    |
|      |...    |...  |...  |...           |...                                 |
|      |N      |u8   |1    |Position of   |The first axle has 2 wheels (0x01   |
|      |       |     |     |sensor X+N    |and 0x02), while other axles can    |
|      |       |     |     |              |accommodate either 2 or 4 wheels.   |
|      |       |     |     |              |For example, when the second axle   |
|      |       |     |     |              |has two wheels, the numbering is    |
|      |       |     |     |              |0x11 and 0x12; when it has four     |
|      |       |     |     |              |wheels, the numbering is            |
|      |       |     |     |              |0x10,0x11,0x12, and 0x13.           |
|      |       |     |     |              |The third axis is numbered 0x21 and |
|      |       |     |     |              |0x22 for two wheels, and            |
|      |       |     |     |              |0x20,0x21,0x22, and 0x23 for four   |
|      |       |     |     |              |wheels, and so on.                  |
|      |N+1    |u16  |2    |Pressure of   |Unit: 1 Kpa                         |
|      |       |     |     |the X+N sensor|                                    |
|      |N+3    |u8   |1    |Temperature of|Unit: 1℃ Display value minus 55℃    |
|      |       |     |     |Sensor X+N    |                                    |
|      |N+4    |u16  |2    |Voltage of the|Unit V, precision 0.01              |
|      |       |     |     |X+N sensor    |                                    |
|      |N+6    |u8   |1    |Y-axis        |unit g, precision 0.1               |
|      |       |     |     |acceleration  |                                    |
|      |       |     |     |of tire X+N   |                                    |
|      |N+7    |u8   |1    |Z-axis        |unit g, precision 0.1               |
|      |       |     |     |acceleration  |                                    |
|      |       |     |     |of tire X+N   |                                    |

```

79 Appendix_Input Output Status Table

The first 4 bytes indicate the input status (high/low level), with  every  2
bits representing one input state.  For  example,  Bit0-Bit1  indicates  IN1
(not supported: 00:01: high level 10: low level) (11 reserved). The  last  4
bytes represent the output  status,  with  every  2  bits  representing  one
output state (floating/low level). For  example,  Bit0-Bit1  indicates  OUT1
(not supported: 00:01: floating 10:  low  level)  (Ping  11  reserved).  The
specific definitions are as follows:

```text
|byte   |field  |type   |length |description                         |
|positio|       |       |       |                                    |
|n      |       |       |       |                                    |
|       |       |       |       |                                    |
|0      |input  |1      |u8     |Bit0Bit1  00:not support  01:high   |
|       |mode   |       |       |voltage                             |
|       |       |       |       |10:low voltage   11:Reserve    IN1  |
|       |       |       |       |Bit2Bit3  00:not support  01:high   |
|       |       |       |       |voltage                             |
|       |       |       |       |10:low voltage   11:Reserve    IN2  |
|       |       |       |       |Bit4Bit5  00:not support  01:high   |
|       |       |       |       |voltage                             |
|       |       |       |       |10:low voltage   11:Reserve    IN3  |
|       |       |       |       |Bit6Bit7  00:not support  01:high   |
|       |       |       |       |voltage                             |
|       |       |       |       |10:low voltage   11:Reserve    IN4  |
|1      |       |1      |u8     |Bit0Bit1  00:not support  01:high   |
|       |       |       |       |voltage                             |
|       |       |       |       |10:low voltage   11:Reserve    IN5  |
|       |       |       |       |Bit2Bit3  00:not support  01:high   |
|       |       |       |       |voltage                             |
|       |       |       |       |10:low voltage   11:Reserve    IN6  |
|       |       |       |       |Bit4Bit5  00:not support  01:high   |
|       |       |       |       |voltage                             |
|       |       |       |       |10:low voltage   11:Reserve    IN7  |
|       |       |       |       |Bit6Bit7  00:not support  01:high   |
|       |       |       |       |voltage                             |
|       |       |       |       |10:low voltage   11:Reserve    IN8  |
|2      |output |1      |u8     |Bit0Bit1  00:not support  01:high   |
|       |state  |       |       |voltage                             |
|       |       |       |       |10:low voltage   11:float   OUT1    |
|       |       |       |       |Bit2Bit3  00:not support  01:high   |
|       |       |       |       |voltage                             |
|       |       |       |       |10:low voltage   11:float   OUT2    |
|       |       |       |       |Bit4Bit5  00:not support  01:high   |
|       |       |       |       |voltage                             |
|       |       |       |       |10:low voltage   11:float   OUT3    |
|       |       |       |       |Bit6Bit7  00:not support  01:high   |
|       |       |       |       |voltage                             |
|       |       |       |       |10:low voltage   11:float   OUT4    |
|3      |       |1      |u8     |Bit0Bit1  00:not support  01:high   |
|       |       |       |       |voltage                             |
|       |       |       |       |10:low voltage   11:float   OUT5    |
|       |       |       |       |Bit2Bit3  00:not support  01:high   |
|       |       |       |       |voltage                             |
|       |       |       |       |10:low voltage   11:float   OUT6    |
|       |       |       |       |Bit4Bit5  00:not support  01:high   |
|       |       |       |       |voltage                             |
|       |       |       |       |10:low voltage   11:float   5V_OUT1 |
|       |       |       |       |Bit6Bit7  00:not support  01:high   |
|       |       |       |       |voltage                             |
|       |       |       |       |10:low voltage   11:float   5V_OUT2 |
|4      |       |1      |u8     |Bit0Bit1  00:not support  01:high   |
|       |       |       |       |voltage                             |
|       |       |       |       |10:low voltage   11:float   12V_OUT |

```

80   Schedule_Driving Licence Data Packets(Nbytes) Schedule_Driving  Licence
Data Packets(Nbytes)

```text
|Package Information item format                                        |
|Field         |Data type     |Number  |Description and Requirements    |
|              |              |of bytes|                                |
|Dynamic       |u16           |2       |0x0001~0xFFFF                   |
|Information ID|              |        |                                |
|Dynamic       |u16           |2       |1-65535                         |
|information   |              |        |                                |
|length        |              |        |                                |
|Dynamic       |u8            |N       |See the table below for dynamic |
|information   |              |        |information content             |
|Content       |              |        |                                |

|Function |Funct|Len|Function              |Unit   |Describe            |
|ID field |ion  |gth|                      |       |                    |
|         |ID   |   |                      |       |                    |
|Underlyin|0x900|N  |Driver's card swiping |       |See  3.83 Track1- 3 |
|g data   |9    |   |data packet (Track    |       |information         |
|items    |     |   |1-3)                  |       |                    |
|[0X0001-0|     |   |                      |       |                    |
|XFFFF]   |     |   |                      |       |                    |
|         |0x901|1  |Login status          |U8     |1: log  in          |
|         |0    |   |                      |       |0: log out          |
|         |0x901|1  |DLT permit Flg        |U8     |0x01：correct       |
|         |1    |   |                      |       |0x00:incorrect      |

```

81 Track 1-3 information※

```text
|byte    |Functio|Length|Function           |Unit   |Describe            |
|position|n      |(1byte|                   |       |                    |
|        |ID(1byt|)     |                   |       |                    |
|        |e)     |      |                   |       |                    |
|0       |0x9901 |n     |Driver's Name      |string |Driver's Name       |
|        |0x9902 |6     |country            |Ascll  |country             |
|        |0x9903 |13    |ID card No         |Ascll  |ID card No          |
|        |0x9904 |4     |due date           |Ascll  |due date            |
|        |0x9905 |8     |birthday           |Ascll  |birthday            |
|        |0x9906 |n     |Driver's license   |Ascll  |Driver's license    |
|        |       |      |type               |       |type                |
|        |0x9907 |1     |sex                |Ascll  |sex                 |
|        |0x9908 |n     |License number     |Ascll  |License number      |
|        |0x9909 |5     |issuing branch     |Ascll  |issuing branch      |
|        |0x990A |n     |All track sheets   |Ascll  |T1+T2+T3            |

```

82 Track 3 information※

```text
|byte    |Functio|Length|Function           |Unit   |Describe            |
|position|n      |(1byte|                   |       |                    |
|        |ID(1byt|)     |                   |       |                    |
|        |e)     |      |                   |       |                    |
|0       |0x9906 |4     |Driver's license   |Ascll  |Driver's license    |
|        |       |      |type               |       |type                |
|        |0x9907 |1     |sex                |Ascll  |sex                 |
|        |0x9908 |7     |License number     |Ascll  |License number      |
|        |0x9909 |5     |issuing branch     |Ascll  |issuing branch      |
|        |0x9011 |1     |Allow driver's     |U8     |0x01: Allow 0x00: Do|
|        |       |      |license            |       |not allow           |

```

83 Appendix CAN Broadcast Data Stream (Department Standard 808-2013)

```text
|Start |field           |Byte|data type |description                     |
|byte  |                |s   |          |                                |
|0     |Number of data  |2   |WORD      |The number of CAN bus data items|
|      |items           |    |          |included, greater than 0        |
|2     |CAN bus data    |5   |BCD[5]    |Article 1: CAN bus data         |
|      |receive time    |    |          |reception time, in hours,       |
|      |                |    |          |minutes, seconds, and           |
|      |                |    |          |milliseconds                    |
|7     |CAN bus data    |--  |--        |CAN bus data item format table  |
|      |item            |    |          |                                |

```

84 CAN bus data item format table

```text
|Start |field           |Byte|data type |description                     |
|byte  |                |s   |          |                                |
|0     |CAN ID          |4   |DWORD     |The bit31 indicates the CAN     |
|      |                |    |          |channel number: 0 for CAN1, 1   |
|      |                |    |          |for CAN2.                       |
|      |                |    |          |bit30 indicates the frame type: |
|      |                |    |          |0 for standard frame, 1 for     |
|      |                |    |          |extended frame.                 |
|      |                |    |          |The bit29 indicates the data    |
|      |                |    |          |acquisition method: 0 for raw   |
|      |                |    |          |data, 1 for the average value of|
|      |                |    |          |the acquisition interval.       |
|      |                |    |          |bit28-bit0 indicates the CAN bus|
|      |                |    |          |ID                              |
|4     |CAN DATA        |8   |BYTE[8]   |CAN data                        |
|--    |--              |--  |--        |--                              |

```

Appendix II: Sample

1 Transformation function example:

/***************************************************************************
****

* Function name: void JT_EscapeData (u16 InLen, u8 *InBuf, u16  *OutLen,  u8
*OutBuf)

* Note: Transference

* InBuf: Input requires escaping

* InLen: Length of input data requiring escaping

* OutBuf: Output requires escaping

* OutLen: Length of output data requiring escaping

****************************************************************************
***/

void JT_EscapeData (u16 InLen,u8 *InBuf, u16 *OutLen, u8 *OutBuf)

{

u16 i=0;

u16 Len=0;

// transferred meaning

for(i=0;i<InLen;i++)

{

if(InBuf[i]==0x7E)

{

OutBuf[Len++]=0x7D;

OutBuf[Len++]=0x02;

}

else if(InBuf[i]==0x7D)

{

OutBuf[Len++]=0x7D;

OutBuf[Len++]=0x01;

}

else

{

OutBuf[Len++]=InBuf[i];

}

}

*OutLen=Len;

}

2 Inverse function example:

/***************************************************************************
****

* Function name: void JT_UnEscapeData (u16 InLen, u8  *InBuf,  u16  *OutLen,
u8 *OutBuf)

* Note: Enter reverse-sense data to output the reverse-sense original data

* InBuf: Input requires reverse sense data

* InLen: Length of input reverse-sense data

* OutBuf: Output requires reverse-quoted data

* OutLen: Length of output requiring reverse-quoted data

****************************************************************************
***/

void JT_UnEscapeData (u16 InLen,u8 *InBuf,u16 *OutLen,u8 *OutBuf)

{

u16 i=0;

u16 ValidPos=0;

if(InBuf[0]!=0x7E)

return 0;

OutBuf[ValidPos++]=0x7E;

for(i=1;i<InLen;i++)

{

if(InBuf[i]==0x7D)

{

if(InBuf[i+1]==0x01)

{

OutBuf[ValidPos++]=0x7D;

i++;

}

else if(InBuf[i+1]==0x02)

{

OutBuf[ValidPos++]=0x7E;

i++;

}

else  return 0;

}

else

{

OutBuf[ValidPos++]=InBuf[i];

}

if(InBuf[i]==0x7E)

{

break;

}

}

if(i==InLen)

return 0;

*OutLen=ValidPos;

return (i+1);

}

3 [0200] Location Data Analysis Details

4 [0900]Transparent uplink data parsing details

5 [8300]Text Information Data Analysis Details
