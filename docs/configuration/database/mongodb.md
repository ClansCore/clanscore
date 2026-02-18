# 🔗 Externer Zugriff MongoDB Compass

Es ist möglich sich extern über [MongoDB Compass](https://www.mongodb.com/try/download/compass) mit der Datenbank zu verbinden. Hierzu muss auf dem Server ein Endpunkt gegen aussen geöffnet werden:

`<deine-server-url>:27018`

Der Port kann in `docker-compose.yml` angepasst werden.

In der `.env`-Datei muss jetzt ein **sicheres** Passwort bei `MONGO_INITDB_ROOT_PASSWORD` gesetzt werden (mind. 20 Stellen inkl. Symbole und Zahlen).

Danach kannst du dich mit MongoDB Compass verbinden und einloggen. Möglichkeiten:

- Add new connection > Advanced Connection Options > Authentication (dann Username/Password eingeben)
- URI: `mongodb://admin:***@<deine-serer-url>:27018/` (ersetze "***" mit dem Passwort)

**Wichtiger Hinweis:** Es gibt momentan keine zusätzliche Sicherheits-Barriere, bis auf dieses Passwort. Der User hat damit Admin-Rechte in der Datenbank und somit volle Zugriffskontrolle. **Behandle das Passwort streng geheim** oder lass den Endpunkt geschlossen, falls du ihn nicht benötigst.
