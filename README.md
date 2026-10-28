# Werewolf GM

A phone-first game master companion for Werewolf: it gives you the script one line per screen (what to say, what to wait for, then Next), tracks every role, works out who dies, runs the day vote with a timer, and ends with a full recap. Everything stays on the phone (localStorage), including the player names. To let someone else run the next game, "Hand over to another phone" shows a QR code: their camera opens the app with the same players, roles and card names. The names travel in the link after the `#`, which never reaches a server.

Roles: Wolves, Queen Wolf, Baby Wolf, Prostitute, Wizard, Seer and Villagers. Role names can be renamed to match your cards. Tapping a role wherever it shows (the role setup, the night's title, the night order, everyone's roles) opens a card saying what it does, when it wakes and how it wins, so a first-time game master never has to dig through the menu.

How to play is written for someone who has never played, and it explains the game around the roles most games have (the Prostitute, the Wizard and the Seer). It also has a page of its own at https://werewolf.gourav.io/how-to-play, which the game master can copy or share from Menu → How to play and send to the players before game night. Renamed cards ride along after the `#`, and the page never touches a game saved on the phone that opens it.

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # game rules
pnpm build
```
