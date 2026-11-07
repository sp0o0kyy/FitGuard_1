# FitGuard — Руководство по развёртыванию на собственном сервере

**FitGuard** полностью независим от платформы Manus: это стандартное веб-приложение (Node.js + React + MariaDB), которое вы можете развернуть на любом своём VPS за 5–10 минут и полностью контролировать.

---

## 1. Как сайт подключается к серверу

Приложение устроено по классической клиент-серверной архитектуре:

```
[Браузер ученика / тренера]
           ↕  HTTPS (запросы)
[Nginx — обратный прокси + SSL-сертификат]
           ↕  HTTP (порт 3000)
[Node.js Express + tRPC сервер]
     ↕                   ↕
[MariaDB база]     [ИИ-модель (Groq / Gemini / OpenRouter / Ollama)]
```

* **Фронтенд** (React) собирается в статические файлы и раздаётся самим Node.js-сервером.
* **Бэкенд** (Express + tRPC) принимает запросы от фронтенда через API (`/api/trpc/*`), проверяет права (ученик/тренер), пишет данные в базу и вызывает ИИ-модуль.
* **База данных** (MariaDB) хранит пользователей, тренировки, замеры, коды приглашений и ИИ-отчёты.
* **Связка сайт ↔ сервер** происходит автоматически: фронтенд знает адрес сервера, с которого загружен, и все запросы идут по относительному пути `/api/...`. Никаких сложных настроек не требуется.

---

## 2. Нужно ли создавать аккаунт, чтобы запустить свой сервер?

**Да, один аккаунт хостинга вам понадобится.** Manus только создал и протестировал код — сервер он для вас не покупает. Вот варианты:

### Вариант A (рекомендуется): VPS-сервер — от 300 ₽/мес.

Подойдёт любой недорогой VPS с **Ubuntu 22.04 / 24.04**, от **2 ГБ RAM**, от 20 ГБ диска:

| Хостинг | Примерная цена | Где зарегистрироваться |
|---------|----------------|------------------------|
| **Timeweb Cloud** | ~350 ₽/мес | https://timeweb.cloud |
| **Beget** | ~390 ₽/мес | https://beget.com |
| **Reg.ru / Cloud** | ~400 ₽/мес | https://www.reg.ru |
| **Hetzner (Германия)** | ~3.8 €/мес | https://www.hetzner.com |
| **DigitalOcean** | ~6 $/мес | https://m.do.co |

**Что делать после покупки VPS:**
1. Вы получаете IP-адрес сервера и пароль root (приходят на email хостинга).
2. Подключаетесь по SSH: `ssh root@IP_ВАШЕГО_СЕРВЕРА`.
3. Устанавливаете Docker (одна команда).
4. Клонируете репозиторий с проектом и запускаете через `docker compose up -d`.
5. Привязываете свой домен (например, `fitguard.ru`) через A-запись DNS на IP сервера.

> **Нужен ли аккаунт где-то ещё?**
> Только регистратор домена (если хотите красивый адрес вроде `mytraining.ru` — ~200 ₽/год на Reg.ru/Timeweb). Без домена сайт будет доступен просто по IP-адресу.

### Вариант B (для тестирования): бесплатные платформы

Если платить не хочется совсем, можно запустить на бесплатных тарифах:

* **Render.com** — бесплатный Web Service (Node.js) + бесплатный MySQL/PostgreSQL (спящий режим при простое).
* **Railway.app** — $5 бесплатных кредитов в месяц.
* **Fly.io** — бесплатные микро-ВМ.

---

## 3. Быстрый старт на VPS через Docker (самый простой способ)

После подключения к серверу выполните команды:

```bash
# 1. Обновляем систему и ставим Docker
curl -fsSL https://get.docker.com | sh
sudo apt install -y git

# 2. Клонируем проект
git clone <URL_ВАШЕГО_РЕПОЗИТОРИЯ> fitguard
cd fitguard

# 3. Настраиваем переменные окружения
cp .env.example .env
nano .env   # укажите пароли базы, JWT_SECRET и ключ ИИ (см. раздел 4)

# 4. Запускаем приложение и базу данных
docker compose up -d --build

# 5. Применяем миграции базы данных
docker compose exec app npx drizzle-kit migrate

# 6. (По желанию) загружаем демо-данные: тренера Анну и учеников Ивана и Марию
docker compose exec app npx tsx server/seed.ts
```

Приложение доступно по адресу `http://IP_ВАШЕГО_СЕРВЕРА:3000`.

---

## 4. Какую модель ИИ использовать (она должна быть бесплатной)

В FitGuard встроена универсальная архитектура ИИ:

1. **Гарантированный уровень (работает БЕЗ интернета и БЕЗ ключей):** детерминированный движок считает точные дельты по каждому упражнению, тоннаж, корреляцию сна и результатов, находит жалобы на боль в заметках и формирует базовые выводы и рекомендации.
2. **Уровень ИИ-модели (бесплатно через API):** если в `.env` указан ключ, отчёт обогащается живым экспертным текстом на русском языке.

### Бесплатные варианты на выбор

| Провайдер | Модель | Цена | Где взять ключ |
|-----------|--------|------|----------------|
| **Groq (рекомендуется)** | `llama-3.3-70b-versatile` или `llama-3.1-8b-instant` | **100% бесплатно** | https://console.groq.com (регистрация 1 мин) |
| **OpenRouter** | `meta-llama/llama-3.3-70b-instruct:free` | **100% бесплатно** | https://openrouter.ai |
| **Google Gemini** | `gemini-2.5-flash` | **Бесплатный щедрый тариф** | https://aistudio.google.com |
| **Ollama (локально)** | `llama3.2` | **100% бесплатно, оффлайн** | https://ollama.com |

**Наш выбор — Groq с моделью Llama 3.3 70B:**
* Ключ создаётся за 60 секунд без привязки карты.
* Ответы за 1–2 секунды (в 10 раз быстрее большинства сервисов).
* Высокое качество русского языка, отлично понимает фитнес-терминологию.
* Лимитов бесплатного тарифа с запасом хватает на сотни тренировок в день.

### Как настроить модель в приложении

Просто добавьте 3 строки в `.env` на сервере:

```env
AI_PROVIDER=groq
AI_MODEL=llama-3.3-70b-versatile
AI_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
```

Перезапустите приложение: `docker compose restart app`. **Всё.** Менять код не нужно — переключение провайдера происходит одной строкой в файле конфигурации.

---

## 5. Домен и HTTPS-сертификат (зелёный замок)

Чтобы сайт открывался по адресу `https://fitguard.ru`:

```bash
# 1. Ставим Nginx и Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# 2. Создаём конфиг для домена
sudo nano /etc/nginx/sites-available/fitguard
```

Содержимое файла:

```nginx
server {
    listen 80;
    server_name fitguard.ru www.fitguard.ru;   # замените на ваш домен

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 3. Активируем сайт
sudo ln -s /etc/nginx/sites-available/fitguard /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 4. Получаем бесплатный SSL-сертификат Let's Encrypt (автообновление)
sudo certbot --nginx -d fitguard.ru -d www.fitguard.ru
```

---

## 6. Вариант без Docker (Node.js + pm2)

Если не хотите Docker, приложение запускается стандартным способом:

```bash
# Node.js 22 + MariaDB
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs mariadb-server git
corepack enable && corepack prepare pnpm@10.18.0 --activate
sudo npm i -g pm2

# База
sudo mysql -e "CREATE DATABASE fitguard CHARACTER SET utf8mb4; CREATE USER 'fitguard'@'localhost' IDENTIFIED BY 'PASSWORD'; GRANT ALL ON fitguard.* TO 'fitguard'@'localhost'; FLUSH PRIVILEGES;"

# Проект
git clone <URL_РЕПО> fitguard && cd fitguard
cp .env.example .env && nano .env
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm seed          # по желанию: демо-данные
pnpm build
pm2 start dist/index.js --name fitguard
pm2 save && pm2 startup
```

---

## 7. Управление и обслуживание

| Задача | Команда (Docker) | Команда (pm2) |
|---|---|---|
| Посмотреть логи | `docker compose logs -f app` | `pm2 logs fitguard` |
| Перезапуск | `docker compose restart app` | `pm2 restart fitguard` |
| Обновление кода | `git pull && docker compose up -d --build && docker compose exec app npx drizzle-kit migrate` | `git pull && pnpm install && pnpm db:migrate && pnpm build && pm2 restart fitguard` |
| Бэкап базы | `docker compose exec db mysqldump -u fitguard -p fitguard > backup_$(date +%F).sql` | `mysqldump -u fitguard -p fitguard > backup_$(date +%F).sql` |

Рекомендуется добавить ежедневный бэкап базы в `cron`:

```bash
0 3 * * * docker compose -f /root/fitguard/docker-compose.yml exec db mysqldump -u fitguard -pPASSWORD fitguard | gzip > /root/backups/fp_$(date +\%F).sql.gz
```

---

## 8. Итоговый чек-лист

- [ ] Куплен VPS (Ubuntu 22.04+)
- [ ] Клонирован проект, заполнен `.env` (пароль базы, JWT_SECRET)
- [ ] Бесплатный ключ ИИ получен на https://console.groq.com и добавлен в `AI_API_KEY`
- [ ] Запущен `docker compose up -d --build` + применены миграции
- [ ] Загружены демо-данные (по желанию): `docker compose exec app npx tsx server/seed.ts`
- [ ] Настроен Nginx + SSL-сертификат через `certbot`
- [ ] Проверена работа: вход тренера `coach`/`coach123`, ученика `ivan`/`ivan123`, отправка новой тренировки и мгновенный ИИ-отчёт
