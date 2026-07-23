const fs = require('fs');

// Verificar se a imagem 4.jpg existe
if (fs.existsSync('4.jpg')) {
    // Copiar para a pasta public
    fs.copyFileSync('4.jpg', 'public/4.jpg');
    console.log('Imagem 4.jpg copiada para pasta public com sucesso!');
} else {
    console.log('Imagem 4.jpg não encontrada no diretório atual');
}