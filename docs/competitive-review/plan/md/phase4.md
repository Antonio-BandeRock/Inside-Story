### C11. Share into Inside Story from any app
- **Ships by:** Android rebuild R1 · **Size:** M · **Tabs:** Life,Home,Food
- **Answers:** Todoist, Samsung Food, Plan to Eat · **Theme:** Capture, reminders and the second audience
- **How:** A SEND intent filter for text, links and images. A link to a recipe goes to the importer (G1); anything else lands in Capture.

### C12. App icon shortcuts and a quick settings tile
- **Ships by:** Android rebuild R1 · **Size:** S-M · **Tabs:** Home
- **Answers:** Todoist · **Theme:** Capture, reminders and the second audience
- **How:** expo-quick-actions plus a tile config plugin: Capture, Did I take it, Where is it.

### D15. Relaxation and gut-directed audio
- **Ships by:** Android rebuild R1 · **Size:** M · **Tabs:** Signals
- **Answers:** Cara Care · **Theme:** Check-ins and signals
- **How:** expo-audio and a player screen. The content has to be licensed or recorded, which is the larger job.

### G3. Mark up any web page as a recipe
- **Ships by:** Android rebuild R1 · **Size:** L · **Tabs:** Food
- **Answers:** Paprika · **Theme:** Food, scanning and Insights
- **How:** react-native-webview, for sites with no structured data.

### G24. Photo gives a first guess at ingredients, on the phone
- **Ships by:** Android rebuild R1 · **Size:** L · **Tabs:** Food
- **Answers:** Cal AI · **Theme:** Food, scanning and Insights
- **How:** ML Kit image labelling: broad items only, confirmed by the person, never saved unconfirmed. The cloud version is Z1.

### I22. Receive the gateway's pushes
- **Ships by:** Android rebuild R1 · **Size:** M-L · **Tabs:** Garden
- **Answers:** Ecowitt · **Theme:** Garden
- **How:** A small HTTP listener native module. Polling covers it until then.

### L2. Android home screen widgets
- **Ships by:** Android rebuild R1 · **Size:** L · **Tabs:** Home,Life,Schedules
- **Answers:** Tiimo, AnyList, Todoist, Waterllama, Medisafe, Cronometer · **Theme:** Phones, widgets and devices
- **How:** react-native-android-widget: next thing, next dose, Capture, grocery list, Fuel Gauges, current routine step, one-tap glass. A "hide health details on widgets" switch, since a locked phone shows them.

### L4. Breathing rate and body temperature
- **Ships by:** Android rebuild R1 · **Size:** S · **Tabs:** Trends,Signals
- **Answers:** Oura · **Theme:** Phones, widgets and devices
- **How:** Two more Health Connect permissions.

### L5. Camera originals to the gallery, and Wi-Fi only photos
- **Ships by:** Android rebuild R1 · **Size:** S · **Tabs:** all
- **Answers:** (your question) · **Theme:** Phones, widgets and devices
- **How:** expo-media-library saves the full camera picture, with its details, to the phone's gallery while the app keeps its two small sizes (X1, 1.0.53.7). expo-network tells Wi-Fi from mobile data, so "Send and fetch shared photos on Wi-Fi only" holds on the phone; until then lib/photoNative.ts reports unknown and photos go either way.

### O1. Phone contacts inside the app
- **Ships by:** Android rebuild R1 · **Size:** S-M · **Tabs:** Life
- **Answers:** (your question) · **Theme:** Talking to people
- **How:** expo-contacts: pick a contact for Emergency, a prescriber, a pharmacy, the family roster or a caregiver invite. Read on the phone, nothing copied out.

### O2. Text or call from inside the app
- **Ships by:** Android rebuild R1 · **Size:** S · **Tabs:** Life
- **Answers:** (your question) · **Theme:** Talking to people
- **How:** expo-sms opens the phone's texting app with the message filled in; calling already works through Linking.
