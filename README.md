# k6 — нагрузочные сценарии

Два сценария для **Grafana k6**, от отладочного к ступенчатому.

## webtours.js — пользовательский сценарий (smoke)

Реалистичное «путешествие пользователя» по демо-приложению **WebTours**:
главная → welcome-страница → выбор города из списка. Проверки `check()`
на каждый шаг, паузы как у живого пользователя. Режим `vus: 1, iterations: 1` —
отладочный прогон одного виртуального пользователя.

## load_test.js — ступенчатая нагрузка (ramping-arrival-rate)

Два параллельных сценария с исполнителем `ramping-arrival-rate`:

- **ya_scenario** — разгон 60 → 72 req/min (5 мин ramp + 10 мин плато на ступень)
- **www_scenario** — ступени от 120 req/min

`preAllocatedVUs: 10`, `maxVUs: 50` — VU выделяются под arrival rate,
а не под длину итерации.

## Запуск

```bash
k6 run webtours.js
k6 run load_test.js
```

## Результаты (load_test.js)

<img width="552" height="292" alt="ResponseTime" src="https://github.com/user-attachments/assets/2c88b0a7-c17f-4f18-9a68-b33269582740" />
<img width="549" height="292" alt="TotalRequest" src="https://github.com/user-attachments/assets/5343227b-6c47-4bc0-b33a-bae8317c29ba" />
<img width="546" height="297" alt="VUs" src="https://github.com/user-attachments/assets/2a95d32-f87d-40cb-8381-69a131d7d04b" />
