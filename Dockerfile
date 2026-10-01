# Menggunakan image Node.js versi Alpine yang sangat ringan
FROM node:20-alpine

# Menentukan direktori kerja di dalam container
WORKDIR /app

# Menyalin file package.json dan package-lock.json terlebih dahulu
# Ini memanfaatkan sistem cache Docker agar build lebih cepat jika dependensi tidak berubah
COPY package*.json ./

# Menginstal dependensi (express, axios) khusus untuk environment production
RUN npm install --omit=dev

# Menyalin seluruh sisa kode (termasuk server.js) ke dalam container
COPY . .

# Membuka port 3000 agar bisa diakses dari luar container
EXPOSE 3000

# Perintah utama untuk menjalankan server saat container dinyalakan
CMD ["node", "server.js"]
