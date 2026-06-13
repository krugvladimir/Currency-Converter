# 💱 Currency Converter – мультиязычный конвертер валют

> Утилита командной строки и библиотека для конвертации валют с использованием реальных курсов (API + кэш). Реализована на 7 языках программирования.

![License](https://img.shields.io/badge/license-MIT-green)
![Languages](https://img.shields.io/badge/7-languages-blue)
![API](https://img.shields.io/badge/API-exchangerate--api.com-brightgreen)

## ✨ Продвинутые возможности

- 🌍 **Актуальные курсы** – данные с `api.exchangerate-api.com/v4/latest/`
- ⏱ **Кэширование** – курсы обновляются раз в час (уменьшает нагрузку на API)
- 📜 **История** – последние 10 конверсий сохраняются и выводятся по запросу
- 💰 **Автоопределение валют** – `$100` → `USD`, `€50` → `EUR`, `£25` → `GBP`
- 📊 **Форматы вывода** – человекочитаемая таблица, JSON, plain text
- 🖥 **Два режима работы**:
  - `--amount --from --to` – однократная конвертация
  - `interactive` – диалог с историей
- 📦 **Офлайн‑режим** – при недоступности API используются встроенные курсы

## 🚀 Быстрый старт

Выберите язык, который хотите запустить:

| Язык | Команда | Файл |
|------|---------|------|
| TypeScript | `npm install && npm start -- 100 USD EUR` | `converter.ts` |
| Python | `python converter.py 100 USD EUR` | `converter.py` |
| C++ | `g++ converter.cpp -o conv && ./conv 100 USD EUR` | `converter.cpp` |
| Go | `go run converter.go 100 USD EUR` | `converter.go` |
| Rust | `cargo run -- 100 USD EUR` | `converter.rs` |
| Java | `javac Converter.java && java Converter 100 USD EUR` | `Converter.java` |
| C# | `dotnet run 100 USD EUR` | `converter.cs` |

### Примеры использования

```bash
# Однократная конвертация
$ python converter.py 150 USD EUR
150.00 USD = 137.48 EUR (курс: 0.9165)

# Интерактивный режим
$ python converter.py interactive
>> 100 USD EUR
100.00 USD = 91.65 EUR
>> history
1) 100 USD → EUR = 91.65
>> exit

# Автодетект валют
$ python converter.py $50 EUR
50.00 USD = 45.82 EUR

# Вывод в JSON
$ python converter.py --json 100 USD GBP
{"amount":100,"from":"USD","to":"GBP","result":79.23,"rate":0.7923}
