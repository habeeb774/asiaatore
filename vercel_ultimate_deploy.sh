#!/bin/bash

echo "🚀 أهلاً بك في أداة النشر النهائية المطلقة على Vercel!"

WORK_DIR="/tmp/vercel_ultimate"
rm -rf $WORK_DIR
mkdir -p $WORK_DIR

# ---- 1. تثبيت Vercel CLI إذا لم يكن موجود ----
if ! command -v vercel &> /dev/null
then
    echo "تثبيت Vercel CLI..."
    npm install -g vercel
fi

# ---- 2. تسجيل الدخول على Vercel ----
vercel login

# ---- 3. بيانات MySQL ----
read -p "أدخل MySQL Host: " DB_HOST
read -p "أدخل MySQL User: " DB_USER
read -p "أدخل MySQL Password: " DB_PASS
read -p "أدخل MySQL Database: " DB_NAME

# ---- 4. إعداد المشاريع ----
declare -A BACKEND_URLS

read -p "كم عدد مشاريع Backend لديك؟ " NUM_BACKEND
for ((i=1;i<=NUM_BACKEND;i++)); do
    echo "🔹 إعداد Backend رقم $i"
    read -p "رابط Git للـ Backend $i: " BACKEND_REPO
    read -p "فرع Git (default: main): " BACKEND_BRANCH
    BACKEND_BRANCH=${BACKEND_BRANCH:-main}
    read -p "اسم المشروع على Vercel للـ Backend $i: " BACKEND_NAME
    read -p "منفذ Backend (default 3000): " BACKEND_PORT
    BACKEND_PORT=${BACKEND_PORT:-3000}

    BACKEND_DIR="$WORK_DIR/backend_$i"
    git clone -b $BACKEND_BRANCH $BACKEND_REPO $BACKEND_DIR || (cd $BACKEND_DIR && git pull)
    cd $BACKEND_DIR

    # إعداد Serverless Functions
    if [ ! -d "api" ]; then
        mkdir api
        find . -maxdepth 1 -type f -name "*.js" -exec mv {} api/ \;
    fi

    # إنشاء vercel.json إذا لم يكن موجود
    if [ ! -f "vercel.json" ]; then
cat <<EOL > vercel.json
{
  "version": 2,
  "builds": [
    { "src": "api/**/*.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/\$1.js" }
  ]
}
EOL
    fi

    # Environment Variables
    vercel env add MYSQL_HOST production <<< "$DB_HOST"
    vercel env add MYSQL_USER production <<< "$DB_USER"
    vercel env add MYSQL_PASSWORD production <<< "$DB_PASS"
    vercel env add MYSQL_DATABASE production <<< "$DB_NAME"
    vercel env add BACKEND_PORT production <<< "$BACKEND_PORT"

    # نشر Backend (use --yes and capture output robustly)
    DEPLOY_OUT=$(vercel --prod --yes 2>&1 || true)
    # Try to extract first https:// URL from output
    BACKEND_URL=$(echo "$DEPLOY_OUT" | grep -Eo 'https?://[^[:space:]]+' | head -n1 || true)
    # Fallback: if not found, run inspect and try again
    if [ -z "$BACKEND_URL" ]; then
      DEPLOY_OUT=$(vercel --prod --yes --debug 2>&1 || true)
      BACKEND_URL=$(echo "$DEPLOY_OUT" | grep -Eo 'https?://[^[:space:]]+' | head -n1 || true)
    fi
    BACKEND_URLS[$i]="$BACKEND_URL"
    echo "✅ Backend $i URL: ${BACKEND_URL:-(not-detected)}"
done

read -p "كم عدد مشاريع Frontend لديك؟ " NUM_FRONTEND
for ((i=1;i<=NUM_FRONTEND;i++)); do
    echo "🔹 إعداد Frontend رقم $i"
    read -p "رابط Git للـ Frontend $i: " FRONTEND_REPO
    read -p "فرع Git (default: main): " FRONTEND_BRANCH
    FRONTEND_BRANCH=${FRONTEND_BRANCH:-main}
    read -p "اسم المشروع على Vercel للـ Frontend $i: " FRONTEND_NAME

    FRONTEND_DIR="$WORK_DIR/frontend_$i"
    git clone -b $FRONTEND_BRANCH $FRONTEND_REPO $FRONTEND_DIR || (cd $FRONTEND_DIR && git pull)
    cd $FRONTEND_DIR

    # اختيار Backend للربط
    echo "المشاريع المتاحة للربط: "
    for key in "${!BACKEND_URLS[@]}"; do
        echo "$key) ${BACKEND_URLS[$key]}/api"
    done
    read -p "اختر رقم Backend لربط هذا Frontend: " LINK_BACKEND_INDEX
    LINKED_BACKEND_URL=${BACKEND_URLS[$LINK_BACKEND_INDEX]}

    # إنشاء .env.production
    echo "VITE_API_URL=$LINKED_BACKEND_URL/api" > .env.production

  # نشر Frontend (use --yes and capture URL)
  DEPLOY_OUT=$(vercel --prod --yes 2>&1 || true)
  FRONTEND_URL=$(echo "$DEPLOY_OUT" | grep -Eo 'https?://[^[:space:]]+' | head -n1 || true)
  echo "✅ Frontend $i URL: ${FRONTEND_URL:-(not-detected)}"
done

echo "🎉 كل المشاريع تم نشرها بنجاح! كل شيء متصل تلقائيًا."
