from django.core.management.base import BaseCommand
from django.utils import timezone
from app.models import (
    Usuario,
    Cliente,
    Log,
    Produto,
    Estoque,
    Categoria,
    MovimentacaoEstoque
)


class Command(BaseCommand):
    help = "Popula o banco com dados iniciais (seed)"

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("Iniciando seed..."))

        # ------------------------
        # USUÁRIO
        # ------------------------
        if not Usuario.objects.filter(email="admin@admin.com").exists():
            user = Usuario.objects.create_superuser(
                email="admin@admin.com",
                nome="Administrador",
                password="admin123"
            )
            self.stdout.write(self.style.SUCCESS("Usuário admin criado."))
        else:
            user = Usuario.objects.get(email="admin@admin.com")
            self.stdout.write("Usuário admin já existe.")

        # ------------------------
        # LOG
        # ------------------------
        log = Log.objects.create(
            createdAt=timezone.now(),
            updateAt=timezone.now(),
            is_activate=True
        )

        # ------------------------
        # CLIENTE
        # ------------------------
        cliente = Cliente.objects.create(
            nome="Cliente Teste",
            email="cliente@teste.com",
            telefone="11999999999"
        )

        # ------------------------
        # CATEGORIA
        # ------------------------
        categoria = Categoria.objects.create(
            nome="Acessórios",
            descricao="Itens variados de acessórios"
        )

        # ------------------------
        # ESTOQUE
        # ------------------------
        estoque = Estoque.objects.create(
            descricao="Estoque principal",
            setor="Central",
            quantidade=100
        )

        # ------------------------
        # PRODUTO
        # ------------------------
        produto = Produto.objects.create(
            nome="Mouse Gamer",
            descricao="Mouse RGB 16000 DPI",
            sku="MOUSE-001",
            id_usuario=user,
            id_log=log
        )

        # ------------------------
        # MOVIMENTAÇÃO
        # ------------------------
        MovimentacaoEstoque.objects.create(
            id_estoque=estoque,
            id_categoria=categoria,
            id_produto=produto,
            id_cliente=cliente,
            quantidade=10,
            movimentedAt=timezone.now()
        )

        self.stdout.write(self.style.SUCCESS("Seed finalizado com sucesso! 🎉"))
