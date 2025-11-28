CREATE DATABASE saep_db;

\c saep_db;

CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(150),
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE cliente (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(15) NOT NULL
);

CREATE TABLE log (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_activate BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE categoria (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL
);

CREATE TABLE estoque (
    id SERIAL PRIMARY KEY,
    descricao TEXT NOT NULL,
    setor VARCHAR(255) NOT NULL
);

CREATE TABLE produto (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    sku VARCHAR(255) NOT NULL UNIQUE,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id),
    estoque_minimo INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE estoque_produto (
    id SERIAL PRIMARY KEY,
    id_estoque INTEGER NOT NULL REFERENCES estoque(id),
    id_categoria INTEGER NOT NULL REFERENCES categoria(id),
    id_produto INTEGER NOT NULL REFERENCES produto(id),
    id_log INTEGER NOT NULL REFERENCES log(id)
);

CREATE TABLE movimentacao_estoque (
    id SERIAL PRIMARY KEY,
    id_produto INTEGER NOT NULL REFERENCES produto(id),
    id_estoque INTEGER NOT NULL REFERENCES estoque(id),
    id_cliente INTEGER REFERENCES cliente(id),
    quantidade INTEGER NOT NULL,
    tipo CHAR(1) NOT NULL,
    movimented_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO usuario (email, nome, password, is_active, is_staff) VALUES
('almoxarife@saep.com', 'Almoxarife Principal', 'senha_hash_1', TRUE, FALSE),
('gestor@saep.com', 'Gestor de Estoque', 'senha_hash_2', TRUE, TRUE),
('operador@saep.com', 'Operador de Estoque', 'senha_hash_3', TRUE, FALSE);

INSERT INTO cliente (nome, email, telefone) VALUES
('Cliente Varejo A', 'cliente.a@exemplo.com', '11999990001'),
('Cliente Varejo B', 'cliente.b@exemplo.com', '11999990002'),
('Cliente Corporativo C', 'cliente.c@exemplo.com', '11999990003');

INSERT INTO log (created_at, updated_at, is_activate) VALUES
(NOW(), NOW(), TRUE),
(NOW(), NOW(), TRUE),
(NOW(), NOW(), TRUE);

INSERT INTO categoria (nome, descricao) VALUES
('Smartphones', 'Dispositivos móveis smartphones de diversas marcas e modelos'),
('Notebooks', 'Computadores portáteis para uso doméstico e corporativo'),
('Smart TVs', 'Televisores inteligentes com acesso a aplicativos e internet');

INSERT INTO estoque (descricao, setor) VALUES
('Almoxarifado Principal', 'Depósito Central'),
('Showroom Loja 1', 'Loja 1'),
('Depósito Externo', 'Galpão Externo');

INSERT INTO produto (nome, descricao, sku, id_usuario, estoque_minimo) VALUES
('Smartphone X100', 'Smartphone com 128GB, 6GB RAM, tela 6.5 polegadas', 'SKU-SMART-001', 1, 5),
('Notebook Pro 15', 'Notebook 15" com 16GB RAM e SSD 512GB', 'SKU-NOTE-001', 2, 3),
('Smart TV Ultra 50', 'Smart TV 50" 4K com Wi-Fi e 3 HDMI', 'SKU-TV-001', 1, 2);

INSERT INTO estoque_produto (id_estoque, id_categoria, id_produto, id_log) VALUES
(1, 1, 1, 1),
(1, 2, 2, 2),
(2, 3, 3, 3);

INSERT INTO movimentacao_estoque (id_produto, id_estoque, id_cliente, quantidade, tipo, movimented_at) VALUES
(1, 1, NULL, 10, 'E', NOW()),
(1, 1, 1, 3, 'S', NOW()),
(1, 1, 2, 2, 'S', NOW()),
(2, 1, NULL, 5, 'E', NOW()),
(2, 1, 3, 1, 'S', NOW()),
(2, 1, NULL, 2, 'E', NOW()),
(3, 2, NULL, 4, 'E', NOW()),
(3, 2, 1, 1, 'S', NOW()),
(3, 2, 2, 1, 'S', NOW());
