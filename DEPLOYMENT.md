# ============================================
# DEPLOYMENT GUIDE — CinemaHub AI Ultimate
# ============================================
#
# Bu hujjat loyihani kompyuterdan serverga ko'chirish
# uchun batafsil yo'riqnoma beradi.
#
# SAVER: @shakh_041
# BOT: @super_kino_yukla_bot
# ============================================

## 📋 SERVER TALABLARI

### Minimal talablar:
- RAM: 2 GB+
- CPU: 2 core+
- Disk: 20 GB+
- OS: Ubuntu 22.04 LTS / Debian 12
- Docker + Docker Compose

### Tavsiya etiladigan:
- RAM: 4 GB+
- CPU: 4 core+
- Disk: 50 GB+ (SSD)
- Domain + SSL (nginx orqali)
- Fail2ban (xavfsizlik)

---

## 🚀 1-QADAM: Serverga Kirish va Tayyorgarlik

```bash
# Serverga SSH orqali kirish
ssh root@SERVER_IP

# Tizimni yangilash
apt update && apt upgrade -y

# Kerakli dasturlarni o'rnatish
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs nginx certbot python3-certbot-nginx git

# Docker o'rnatish
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Docker Compose o'rnatish
apt install -y docker-compose-plugin

# PM2 o'rnatish (Node.js protsess boshqaruvchisi)
npm install -g pm2 pm2-startup
```

---

## 📦 2-QADAM: Kodni Serverga Ko'chirish

```bash
# Loyihani clone qilish
cd /opt
git clone https://github.com/Shohijahon041/super_kino_yukla_bot.git cinemahub
cd cinemahub

# .env faylini yaratish
cat > backend/.env << 'EOF'
# ============ APPLICATION ============
NODE_ENV=production
APP_PORT=3002
APP_NAME=CinemaHub AI Ultimate
APP_URL=http://YOUR_SERVER_IP:3002

# ============ DATABASE ============
DATABASE_URL=postgresql://cinemahub:STRONG_PASSWORD_HERE@cinemahub-db:5432/cinemahub?schema=public

# ============ REDIS ============
REDIS_HOST=cinemahub-redis
REDIS_PORT=6379
REDIS_PASSWORD=REDIS_PASSWORD_HERE

# ============ TELEGRAM ============
TELEGRAM_BOT_TOKEN=8353415660:AAGXVAj-X9DMndHeFpGhtsCVHcaNsTI_PVA
TELEGRAM_ADMIN_IDS=5453333583,1821045481
TELEGRAM_CHANNEL_ID=-1003405816623

# ============ TELETHON (channel import uchun) ============
TELETHON_API_ID=26798463
TELETHON_API_HASH=7785cf36e73f7a0eb1bb71c9af52cb68
TELETHON_PHONE=+998911278902

# ============ JWT ============
JWT_SECRET=YOUR_RANDOM_SECRET_KEY_HERE
JWT_EXPIRES_IN=7d

# ============ MINIO (file storage) ============
MINIO_ENDPOINT=cinemahub-minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=cinemahub
MINIO_USE_SSL=false

# ============ ELASTICSEARCH ============
ELASTICSEARCH_NODE=http://cinemahub-elastic:9200

# ============ GAMIFICATION ============
DAILY_BONUS_COINS=10
SPIN_WHEEL_DAILY_LIMIT=3
PREMIUM_SPIN_DAILY_LIMIT=5
EOF

# Admin panel .env
cat > admin/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:3002/api/v1
NEXT_PUBLIC_WS_URL=ws://YOUR_SERVER_IP:3002
NEXT_PUBLIC_APP_NAME=CinemaHub Admin
EOF

# Kuchli parol yaratish
openssl rand -base64 32
# Chiqqan navbatni DATABASE_URL va REDIS_PASSWORD ga kiriting!
```

---

## 🏗️ 3-QADAM: Build va Ishga Tushirish

```bash
cd /opt/cinemahub

# Docker xizmatlarini ishga tushirish
docker compose up -d

# Backend build
cd backend
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npx nest build
cd ..

# Admin panel build
cd admin
npm install
npm run build
cd ..

# PM2 bilan ishga tushirish
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
# Chiqqan buyruqni ko'chirib, Terminalga joylashtiring!

echo "✅ Loyiha ishga tushdi!"
pm2 status
```

---

## 🌐 4-QADAM: Nginx Sozlash (Domain + SSL)

```bash
# Nginx konfiguratsiya fayli
cat > /etc/nginx/sites-available/cinemahub << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN.com;

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 100M;
    }

    # Admin panel
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

# Aktivlashtirish
ln -sf /etc/nginx/sites-available/cinemahub /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# SSL olish (domain bo'lsa)
certbot --nginx -d YOUR_DOMAIN.com
```

---

## 🔒 5-QADAM: Xavfsizlik

```bash
# Firewall sozlash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# Fail2ban o'rnatish
apt install -y fail2ban
systemctl enable fail2ban

# SSH xavfsizligi
sed -i 's/#PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sed -i 's/PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
systemctl restart sshd

# Docker xavfsizligi
chmod 600 backend/.env
```

---

## 📊 6-QADAM: Monitoring va Loglar

```bash
# PM2 monitoring
pm2 status                    # Holat
pm2 logs cinemahub-backend    # Backend loglari
pm2 logs cinemahub-admin      # Admin loglari
pm2 monit                     # Real-time monitoring

# Docker loglari
docker compose logs -f        # Barcha loglar
docker compose logs -f cinemahub-db  # Database loglari

# System resurslari
htop                          # CPU/RAM
df -h                         # Disk
docker system df              # Docker disk ishlatishi
```

---

## 🔄 7-QADAM: Backup

```bash
# Database backup skripti
cat > /opt/cinemahub/scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/cinemahub/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# PostgreSQL backup
docker exec cinemahub-db pg_dump -U cinemahub cinemahub | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Eski backuplarni tozalash (30 kundan ortiq)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup tayyor: $BACKUP_DIR/db_$DATE.sql.gz"
EOF

chmod +x /opt/cinemahub/scripts/backup.sh

# Har kuni 3:00 da backup olish
echo "0 3 * * * /opt/cinemahub/scripts/backup.sh" | crontab -
```

---

## 🐛 MUAMMOLARNI HAL QILISH

### Bot ishlamayapti:
```bash
pm2 restart cinemahub-backend
pm2 logs cinemahub-backend --lines 50
```

### Database xatoligi:
```bash
docker exec -it cinemahub-db psql -U cinemahub -d cinemahub
# VACUUM ANALYZE;
```

### Disk to'lgan:
```bash
docker system prune -af
pm2 flush
```

### Port band:
```bash
netstat -tlnp | grep :3002
kill -9 PROCESS_ID
```

---

## 📱 TELEGRAM BOT SOZLASHI

Bot token allaqachon mavjud. Serverga ko'chirgandan keyin:
1. Bot token .env faylda to'g'ri ekanligini tekshiring
2. `TELEGRAM_BOT_TOKEN` ni BotFather'dan olishingiz mumkin
3. Bot webhook o'rniga long polling ishlatadi (avtomatik)
4. Kanal ID to'g'ri ekanligini tekshiring

---

## ✅ TEKSHIRISH RO'YXATI

- [ ] Serverga SSH kirish ishlayapti
- [ ] Docker va Docker Compose o'rnatilgan
- [ ] Node.js 22+ o'rnatilgan
- [ ] .env fayllar to'ldirilgan (parollar kuchli!)
- [ ] Docker xizmatlari ishlayapti (docker compose ps)
- [ ] Backend ishlayapti (curl localhost:3002/api/v1/health)
- [ ] Admin panel ishlayapti (curl localhost:3001)
- [ ] Bot javob beradi (@super_kino_yukla_bot)
- [ ] PM2 avtomatik ishga tushirilgan (pm2 save + pm2 startup)
- [ ] Firewall faollashtirilgan (ufw status)
- [ ] Backup sozlangan (crontab -l)
- [ ] SSL sertifikati o'rnatilgan (agar domain bo'lsa)
