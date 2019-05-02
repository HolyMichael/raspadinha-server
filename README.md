Como instalar: 

1. Instalar NodeJs
2. Instalar npm 
3. Na pasta do projeto, correr npm install express 
4. Executar node index.js 
5. Abrir o browser, escrever localhost:3000
6. Have fun and drink tea.

Nota: Pode ser necessário instalar, usando o npm, o body-parser.
Especificação dos Ficheiros: 

index.js --> Código Servidor 
registry.js ---> Código Cliente
registry_bundled.js --> Código cliente. Contém o código cliente a executar, além das funcões por defeito. Deve ser atualizado sempre que o ficheiro registry.js for modificado, através de browserify registry.js -o registry_bundled.js
