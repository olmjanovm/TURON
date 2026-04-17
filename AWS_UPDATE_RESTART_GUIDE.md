# AWS Code Update + Restart Guide

**Hozir Kerakli Qadam:**
1. ✅ Supabase migration applied - OK
2. ⏳ AWS-da pull qiling + restart

---

## 🚀 AWS-da Kerakli Amallar

### **Qadam 1: SSH AWS-ga**

```bash
ssh -i your-key.pem ec2-user@your-aws-instance-ip
# yoki
ssh -i your-key.pem ubuntu@your-aws-instance-ip
```

### **Qadam 2: Project Folderiga Kiring**

```bash
cd /path/to/TURON
# yoki
cd /home/ec2-user/TURON
```

### **Qadam 3: Latest Code Pull Qiling**

```bash
git pull origin main
```

**Kutishni davom ettiring** - Migration files qo'shiladi.

### **Qadam 4: Backend Restart**

#### **Opsion A: Docker Compose (Agar Docker bo'lsa)**

```bash
docker-compose down
docker-compose up -d
```

#### **Opsion B: PM2 (Agar PM2 o'rnatilgan bo'lsa)**

```bash
pm2 restart backend
pm2 logs backend  # Tekshirish
```

#### **Opsion C: Manual Service (Agar systemd bo'lsa)**

```bash
sudo systemctl restart turon-backend
sudo systemctl status turon-backend  # Tekshirish
```

#### **Opsion D: Node.js Direct (Development uchun)**

```bash
# Agar manual ishlatilsa:
cd apps/backend
npm install  # yoki pnpm install
npm run build  # yoki pnpm build
npm start  # yoki pnpm start
```

---

## 🔄 Batafsil - Eng Ko'p Ishlatilgan (Docker)

```bash
# 1. SSH
ssh -i turon.pem ubuntu@54.123.45.67

# 2. Folder
cd /home/ubuntu/TURON

# 3. Pull
git pull origin main

# 4. Build + Restart
docker-compose down
docker-compose up -d

# 5. Tekshirish - Logs
docker-compose logs -f backend
docker-compose logs -f miniapp
```

**Kutishni davom ettiring** 30-60 sekund...

Agar koʻrinsa:
```
✅ Server listening on port 3000
✅ Health check: OK
```

**Xolos!** ✓

---

## ✔️ Tekshirish - Hammasi Ishlaydi Mi?

### **Backend Health Check:**

```bash
curl http://localhost:3000/health
# yoki
curl http://your-aws-ip:3000/health
```

✅ Javob: `{"status": "ok"}`

### **Database Connection:**

```bash
curl http://localhost:3000/courier/orders
# yoki POST requests test qiling
```

### **Logs Tekshirish:**

```bash
# Docker
docker-compose logs backend | tail -100

# yoki PM2
pm2 logs backend | tail -100

# yoki Direct
cat /var/log/turon/backend.log | tail -100
```

---

## 🔍 Agar Muammo Bo'lsa

### **Database Error:**
```
Error: relation "IdempotencyKey" does not exist
```
→ Migration Supabase-da applya qilganmi? Tekshiring.

### **Connection Refused:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
→ Database URL `.env`-da to'g'rimi? Tekshiring.

### **Port Already in Use:**
```
Error: listen EADDRINUSE :::3000
```
→ Eski process hali ishaydi:
```bash
lsof -i :3000
kill -9 <PID>
```

---

## 📋 Eng Tez Usuli (Copy-Paste)

AWS terminal-da:

```bash
cd /home/ubuntu/TURON && \
git pull origin main && \
docker-compose down && \
docker-compose up -d && \
echo "✅ Updated & Restarted!" && \
sleep 5 && \
curl http://localhost:3000/health
```

**Bir satrda** hammasi! 🚀

---

## ✅ Tekshirilishi

Hamma muvaffaqiyatli bo'lganini tekshiring:

```bash
# 1. Containers ishaydi
docker-compose ps

# 2. Logs OK
docker-compose logs backend | grep -i "error" 
# (hech qanday error bo'lmasligi kerak)

# 3. Health OK
curl http://localhost:3000/health

# 4. Migration table mavjud
docker-compose exec db psql -U postgres -c "SELECT table_name FROM information_schema.tables WHERE table_name='IdempotencyKey';"
```

---

## 🎉 Keyin

1. ✅ AWS updated + restarted
2. ✅ Kuryer app: Yangi buyurtma qilib test
3. ✅ Supabase Console: idempotency_keys jadval-ga qarang (order olish bilan new entries qoʻshilishi kerak)

---

## 📞 Qaysi usuli?

**Agar bilemaysiz:**
- Docker-Compose taqdiri: **Option A: Docker Compose**
- PM2 taqdiri: **Option B: PM2**
- Systemd taqdiri: **Option C: Service**

**Yoki eng tez copy-paste** yuqoridagi birning satrda!

---

**Tayyormi?** ✅ AWS-da git pull + restart qiling!
