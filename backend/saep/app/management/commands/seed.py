from django.core.management.base import BaseCommand
from django.utils import timezone

from app.models import (
    Usuario,
    Cliente,
    Log,
    Categoria,
    Estoque,
    Produto,
    EstoqueProduto,
    MovimentacaoEstoque,
)


class Command(BaseCommand):
    help = "Popula o banco com dados de exemplo (3 de cada entidade e 3 superusers)."

    def handle(self, *args, **options):
        # ---------- USUÁRIOS (3 SUPERUSERS) ----------
        admin1, created1 = Usuario.objects.get_or_create(
            email="admin1@mail.com",
            defaults={"nome": "Admin 1"},
        )
        if created1:
            admin1.set_password("admin123")
        admin1.is_staff = True
        admin1.is_superuser = True
        admin1.is_active = True
        admin1.save()

        admin2, created2 = Usuario.objects.get_or_create(
            email="admin2@example.com",
            defaults={"nome": "Admin 2"},
        )
        if created2:
            admin2.set_password("admin123")
        admin2.is_staff = True
        admin2.is_superuser = True
        admin2.is_active = True
        admin2.save()

        admin3, created3 = Usuario.objects.get_or_create(
            email="admin3@example.com",
            defaults={"nome": "Admin 3"},
        )
        if created3:
            admin3.set_password("admin123")
        admin3.is_staff = True
        admin3.is_superuser = True
        admin3.is_active = True
        admin3.save()

        # ---------- CLIENTES (3) ----------
        cliente1, _ = Cliente.objects.get_or_create(
            email="cliente1@example.com",
            defaults={"nome": "Cliente Um", "telefone": "11999990001"},
        )
        cliente2, _ = Cliente.objects.get_or_create(
            email="cliente2@example.com",
            defaults={"nome": "Cliente Dois", "telefone": "11999990002"},
        )
        cliente3, _ = Cliente.objects.get_or_create(
            email="cliente3@example.com",
            defaults={"nome": "Cliente Três", "telefone": "11999990003"},
        )

        # ---------- LOGS (3) ----------
        log1, _ = Log.objects.get_or_create(
            id=1, defaults={"createdAt": timezone.now(), "is_activate": True}
        )
        log2, _ = Log.objects.get_or_create(
            id=2, defaults={"createdAt": timezone.now(), "is_activate": True}
        )
        log3, _ = Log.objects.get_or_create(
            id=3, defaults={"createdAt": timezone.now(), "is_activate": False}
        )

        # ---------- CATEGORIAS (3) ----------
        cat1, _ = Categoria.objects.get_or_create(
            nome="Smartphones",
            defaults={"descricao": "Celulares e smartphones em geral"},
        )
        cat2, _ = Categoria.objects.get_or_create(
            nome="Notebooks",
            defaults={"descricao": "Notebooks e ultrabooks"},
        )
        cat3, _ = Categoria.objects.get_or_create(
            nome="Smart TVs",
            defaults={"descricao": "Televisores smart de várias marcas"},
        )

        # ---------- ESTOQUES (3) ----------
        est1, _ = Estoque.objects.get_or_create(
            setor="Depósito Central",
            defaults={"descricao": "Depósito principal da loja"},
        )
        est2, _ = Estoque.objects.get_or_create(
            setor="Loja 1",
            defaults={"descricao": "Estoque da loja física 1"},
        )
        est3, _ = Estoque.objects.get_or_create(
            setor="Loja 2",
            defaults={"descricao": "Estoque da loja física 2"},
        )

        # ---------- PRODUTOS (3) ----------
        prod1, _ = Produto.objects.get_or_create(
            sku="SMART-001",
            defaults={
                "nome": "Smartphone X",
                "descricao": "Smartphone de entrada",
                "id_usuario": admin1,
                "estoque_minimo": 10,
            },
        )
        prod2, _ = Produto.objects.get_or_create(
            sku="NOTE-001",
            defaults={
                "nome": "Notebook Y",
                "descricao": "Notebook intermediário",
                "id_usuario": admin1,
                "estoque_minimo": 5,
            },
        )
        prod3, _ = Produto.objects.get_or_create(
            sku="TV-001",
            defaults={
                "nome": "Smart TV Z",
                "descricao": "TV 50 polegadas",
                "id_usuario": admin2,
                "estoque_minimo": 3,
            },
        )

        # ---------- ESTOQUEPRODUTO (3) ----------
        EstoqueProduto.objects.get_or_create(
            id_estoque=est1, id_categoria=cat1, id_produto=prod1, id_log=log1
        )
        EstoqueProduto.objects.get_or_create(
            id_estoque=est2, id_categoria=cat2, id_produto=prod2, id_log=log2
        )
        EstoqueProduto.objects.get_or_create(
            id_estoque=est3, id_categoria=cat3, id_produto=prod3, id_log=log3
        )

        # ---------- MOVIMENTAÇÕES DE ESTOQUE (3) ----------
        MovimentacaoEstoque.objects.get_or_create(
            id_produto=prod1,
            id_estoque=est1,
            id_cliente=cliente1,
            quantidade=20,
            tipo="E",
            movimentedAt=timezone.now(),
        )
        MovimentacaoEstoque.objects.get_or_create(
            id_produto=prod1,
            id_estoque=est1,
            id_cliente=cliente1,
            quantidade=5,
            tipo="S",
            movimentedAt=timezone.now(),
        )
        MovimentacaoEstoque.objects.get_or_create(
            id_produto=prod2,
            id_estoque=est2,
            id_cliente=cliente2,
            quantidade=7,
            tipo="E",
            movimentedAt=timezone.now(),
        )

        self.stdout.write(self.style.SUCCESS("Dados iniciais criados com sucesso."))
