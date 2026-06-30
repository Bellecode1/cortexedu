#!/bin/bash
# ============================================
# Script de build pour déploiement Oracle Cloud
# ============================================
# À exécuter sur ton PC avant d'envoyer sur le serveur
# Usage: bash build.sh
# ============================================

echo "📦 Build du frontend..."
cd client
npm install
npm run build
echo "✅ Frontend build terminé !"

echo ""
echo "📦 Installation des dépendances du backend..."
cd ../server
npm install
echo "✅ Backend prêt !"

echo ""
echo "===================================="
echo "📋 RÉSUMÉ :"
echo "  - Frontend build : client/dist/"
echo "  - Backend prêt : server/"
echo ""
echo "🚀 Pour déployer, transfère les fichiers sur le serveur :"
echo "  scp -r client/dist/* root@TON_IP:/var/www/cortexedu/"
echo "  scp -r server/* root@TON_IP:/var/www/cortexedu/server/"
echo "===================================="
