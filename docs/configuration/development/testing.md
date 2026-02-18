# 🧪 Testing-Strategie

Diese Dokumentation beschreibt die Testing-Strategie für das ClansCore-Projekt, einschliesslich der verwendeten Frameworks und Tools für Unit- und Integrationtests.

---

## Übersicht

Das ClansCore-Projekt verwendet unterschiedliche Testing-Frameworks für die verschiedenen Komponenten:

| Komponente | Testing-Framework | Test Runner | Test-Umgebung |
|------------|------------------|-------------|----------------|
| **Dashboard** | Jasmine | Karma | Browser |
| **Discord-Bot** | Jest | Jest | Node.js |

---

## Dashboard - Jasmine & Karma

### Framework-Übersicht

Die Unit- und Integrationtests des Admin-Dashboards werden mit dem **Jasmine-Testing-Framework** umgesetzt, welches standardmässig in Angular-Projekten integriert ist. Als Test Runner kommt **Karma** zum Einsatz, der die automatisierte Ausführung der Tests in einer browserbasierten Testumgebung ermöglicht.

### Konfiguration

**Dependencies** (`apps/dashboard/package.json`):
- `jasmine-core: ~5.2.0` - Jasmine Testing Framework
- `@types/jasmine: ~5.1.0` - TypeScript-Typen für Jasmine
- `karma: ~6.4.0` - Test Runner
- `karma-jasmine: ~5.1.0` - Karma-Plugin für Jasmine
- `karma-chrome-launcher: ~3.2.0` - Chrome-Launcher für Tests
- `karma-coverage: ~2.2.0` - Code-Coverage-Reporting
- `karma-jasmine-html-reporter: ~2.1.0` - HTML-Reporter für Test-Ergebnisse

**Angular-Konfiguration** (`angular.json`):
```json
"test": {
  "builder": "@angular-devkit/build-angular:karma",
  "options": {
    "polyfills": ["zone.js", "zone.js/testing"],
    "tsConfig": "tsconfig.spec.json",
    "inlineStyleLanguage": "scss"
  }
}
```

### Test-Implementierung

Die Tests werden über die **Angular Testing Utilities (TestBed)** implementiert. Dadurch können neben isolierten Unit-Tests auch Integrationstests durchgeführt werden, bei denen das Zusammenspiel einzelner Komponenten überprüft wird.

**Beispiel-Test** (`apps/dashboard/src/app/app.component.spec.ts`):
```typescript
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideTestStore()]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
```

### Test-Ausführung

Die Testausführung erfolgt lokal über den Befehl:
```bash
npm test
# oder
ng test
```

Dies startet Karma, öffnet einen Browser und führt alle Tests aus. Die Tests werden automatisch neu ausgeführt, wenn sich Dateien ändern (Watch-Mode).

### Test-Struktur

**Test-Dateien**: Alle Test-Dateien haben das Suffix `.spec.ts` und befinden sich neben den zu testenden Komponenten.

**Beispiele**:
- `app.component.spec.ts` - Tests für die Root-Komponente
- `user-page.component.spec.ts` - Tests für die User-Page-Komponente
- `user-table.component.spec.ts` - Tests für die User-Table-Komponente
- `auth.guard.spec.ts` - Tests für den Auth Guard

**Aktuell**: 29 Test-Dateien im Dashboard-Projekt

### Test-Typen

1. **Unit-Tests**: Isolierte Tests einzelner Komponenten, Services oder Guards
2. **Integration-Tests**: Tests, die das Zusammenspiel mehrerer Komponenten überprüfen (mit TestBed)

---

## Discord-Bot - Jest

### Framework-Übersicht

Die Unit- und Integrationtests des Discord-Bots werden mit dem **Jest-Testing-Framework** umgesetzt. Jest ist ein modernes, JavaScript-basiertes Testing-Framework, das speziell für Node.js-Anwendungen optimiert ist und eine schnelle Testausführung sowie umfangreiche Mocking-Funktionen bietet.

### Konfiguration

**Dependencies** (`apps/discord-bot/package.json`):
- `jest: ^29.0.0` - Jest Testing Framework
- `@types/jest: ^29.5.14` - TypeScript-Typen für Jest
- `ts-jest: ^29.4.6` - TypeScript-Transformer für Jest

**Jest-Konfiguration** (`jest.config.cjs`):
```javascript
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: {
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
            },
        }],
    },
    moduleNameMapper: {
        '^@clanscore/shared$': '<rootDir>/../../shared/src/index.ts',
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
    ],
};
```

### Test-Implementierung

Jest bietet umfangreiche Mocking-Funktionen, die für die Tests des Discord-Bots essentiell sind, da externe Dependencies (Discord.js, API-Calls) gemockt werden müssen.

**Beispiel-Test** (`apps/discord-bot/tests/ping.test.ts`):
```typescript
import { CommandInteraction } from "discord.js";
import { handlePing } from "../src/commands/other/ping";
import { api } from "../src/api/apiClient";

jest.mock("../src/api/apiClient");
jest.mock("../src/config", () => ({
    config: {
        CLANSCORE_API_URL: "http://localhost:3000/api",
        CLANSCORE_API_KEY: "test-key",
    },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe("ping command", () => {
    let interaction: CommandInteraction;

    beforeEach(() => {
        interaction = {
            reply: jest.fn(),
            deferReply: jest.fn(),
            editReply: jest.fn(),
        } as unknown as CommandInteraction;
    });

    it("replies with the first user name if user is found", async () => {
        mockApi.getFirstUser.mockResolvedValue(ok({...}));
        await handlePing(interaction);
        expect(interaction.editReply).toHaveBeenCalled();
    });
});
```

### Test-Ausführung

Die Testausführung erfolgt lokal über den Befehl:
```bash
npm test
# oder
jest
```

Jest führt alle Tests in der Node.js-Umgebung aus und bietet Optionen für Watch-Mode, Coverage-Reports und Filterung nach Dateinamen.

### Test-Struktur

**Test-Dateien**: Alle Test-Dateien haben das Suffix `.test.ts` und befinden sich im `tests/` Verzeichnis.

**Beispiele**:
- `ping.test.ts` - Tests für den Ping-Command
- `join.test.ts` - Tests für den Join-Command
- `createTask.test.ts` - Tests für Task-Erstellung
- `syncusers.test.ts` - Tests für User-Synchronisation

**Aktuell**: 17 Test-Dateien im Discord-Bot-Projekt

### Test-Typen

1. **Unit-Tests**: Isolierte Tests einzelner Commands oder Funktionen mit gemockten Dependencies
2. **Integration-Tests**: Tests, die das Zusammenspiel mehrerer Module überprüfen (z.B. Command → API → Response)

### Mocking-Strategie

Jest ermöglicht umfangreiches Mocking:
- **Module-Mocks**: `jest.mock()` für externe Module
- **Function-Mocks**: `jest.fn()` für einzelne Funktionen
- **API-Mocks**: Mock-Implementierungen für API-Calls
- **Discord.js-Mocks**: Mock-Objekte für Discord-Interactions

---

## Vergleich: Jasmine/Karma vs. Jest

| Aspekt | Jasmine/Karma (Dashboard) | Jest (Discord-Bot) |
|--------|---------------------------|---------------------|
| **Umgebung** | Browser | Node.js |
| **Test-Runner** | Karma (separat) | Jest (integriert) |
| **Mocking** | Angular Testing Utilities | Native Jest Mocks |
| **Coverage** | Karma Coverage Plugin | Jest Coverage (integriert) |
| **Speed** | Abhängig von Browser | Sehr schnell (V8) |
| **Watch-Mode** | ✅ Unterstützt | ✅ Unterstützt |
| **TypeScript** | ✅ Unterstützt | ✅ Unterstützt (ts-jest) |

---

## Best Practices

### Allgemein

1. **Test-Isolation**: Jeder Test sollte unabhängig von anderen Tests sein
2. **AAA-Pattern**: Arrange, Act, Assert
3. **Klare Test-Namen**: Beschreibende `describe()` und `it()` Namen
4. **Mocking**: Externe Dependencies sollten gemockt werden
5. **Coverage**: Ziel: >80% Code-Coverage

### Dashboard-spezifisch

1. **TestBed verwenden**: Für Integration-Tests
2. **NoopAnimationsModule**: Für Tests ohne Animationen
3. **Test-Helpers**: Wiederverwendbare Test-Utilities nutzen
4. **Component-Fixtures**: Für DOM-Tests

### Discord-Bot-spezifisch

1. **Module-Mocks**: Externe Module am Anfang der Datei mocken
2. **Interaction-Mocks**: Discord.js-Interactions vollständig mocken
3. **API-Mocks**: API-Calls mit `mockResolvedValue` / `mockRejectedValue` mocken
4. **Test-Isolation**: `beforeEach` für Setup, `afterEach` für Cleanup

---

## Test-Ausführung in CI/CD

### GitHub Actions

Tests können in GitHub Actions Workflows integriert werden:

```yaml
- name: Run Dashboard Tests
  run: |
    cd apps/dashboard
    npm test -- --watch=false --browsers=ChromeHeadless

- name: Run Discord-Bot Tests
  run: |
    cd apps/discord-bot
    npm test -- --coverage
```

---

## Weiterführende Informationen

- [Jasmine Dokumentation](https://jasmine.github.io/)
- [Karma Dokumentation](https://karma-runner.github.io/)
- [Jest Dokumentation](https://jestjs.io/)
- [Angular Testing Guide](https://angular.io/guide/testing)
- [TypeScript Testing Best Practices](https://www.typescriptlang.org/docs/handbook/testing.html)

---

**Letzte Aktualisierung**: 2024-01-XX

