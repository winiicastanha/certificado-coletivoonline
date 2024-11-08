# Usar a imagem oficial do Node.js como base
FROM node:18.17.0

# Criar um grupo e usuário 'puppeteer' para não rodar como root

# Atualizar a lista de pacotes e instalar as dependências necessárias para o Chromium
RUN apt-get update && apt-get install -y wget gnupg ca-certificates procps libxss1 \
    libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 libxi6 libxtst6 \
    libnss3 libcups2 libxrandr2 libasound2 libpangocairo-1.0-0 libatk1.0-0 \
    libatk-bridge2.0-0 libgtk-3-0

# Instalar o Chromium
RUN apt-get update && apt-get install -y chromium

# Limpar o cache do apt para reduzir o tamanho da imagem
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /var/cache/apt/*

# Definir o diretório de trabalho e conceder permissões ao usuário 'puppeteer'
RUN mkdir /app
# && chown puppeteer:puppeteer /app
WORKDIR /app

# Copiando os arquivos para o container
COPY . .

# Instalar as dependências do projeto, incluindo o Puppeteer
RUN npm install

CMD ["node", "index.js"]
