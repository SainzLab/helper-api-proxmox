# Gunakan image Node.js Alpine yang sangat ringan
FROM node:20-alpine

# Tentukan direktori kerja
WORKDIR /app

# Copy file package.json dan install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Install OpenSSL dan Generate Self-Signed Certificate secara otomatis
RUN apk add --no-cache openssl && \
    openssl req -nodes -new -x509 -keyout server.key -out server.cert -subj "/C=ID/CN=mymomox-bridge"

# Copy seluruh sisa kode (termasuk server.js)
COPY . .

# Buka port 3000
EXPOSE 3000

# Jalankan server
CMD ["node", "server.js"]