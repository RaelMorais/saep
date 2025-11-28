from django.db import models
from django.utils import timezone
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager,
)
from django.db.models import Sum


class UsuarioManager(BaseUserManager):
    def create_user(self, email, nome=None, password=None, **extra_fields):
        if not email:
            raise ValueError("O e-mail é obrigatório")
        email = self.normalize_email(email)
        user = self.model(email=email, nome=nome, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, nome=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superusuário precisa ter is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superusuário precisa ter is_superuser=True.")
        return self.create_user(email, nome, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField("e-mail", unique=True)
    nome = models.CharField("nome", max_length=150, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UsuarioManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nome"]

    class Meta:
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"

    def __str__(self):
        return self.email


class Cliente(models.Model):
    nome = models.CharField(max_length=255)
    email = models.EmailField(max_length=255)
    telefone = models.CharField(max_length=15)

    def __str__(self):
        return self.nome


class Log(models.Model):
    createdAt = models.DateTimeField(default=timezone.now)
    updateAt = models.DateTimeField(auto_now=True)
    is_activate = models.BooleanField(default=True)

    def __str__(self):
        return f"Log {self.id} - ativo: {self.is_activate}"


class Categoria(models.Model):
    nome = models.CharField(max_length=255)
    descricao = models.TextField()

    def __str__(self):
        return self.nome


class Estoque(models.Model):
    descricao = models.TextField()
    setor = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.setor} - {self.descricao}"


class Produto(models.Model):
    nome = models.CharField(max_length=255)
    descricao = models.TextField()
    sku = models.CharField(max_length=255)
    id_usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    estoque_minimo = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.nome

    def calcular_estoque(self):
        entradas = (
            MovimentacaoEstoque.objects.filter(
                id_produto=self, tipo="E"
            ).aggregate(total=Sum("quantidade"))["total"]
            or 0
        )
        saidas = (
            MovimentacaoEstoque.objects.filter(
                id_produto=self, tipo="S"
            ).aggregate(total=Sum("quantidade"))["total"]
            or 0
        )
        return entradas - saidas


class EstoqueProduto(models.Model):
    id_estoque = models.ForeignKey(Estoque, on_delete=models.CASCADE)
    id_categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE)
    id_produto = models.ForeignKey(Produto, on_delete=models.CASCADE)
    id_log = models.ForeignKey(Log, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.id_produto} em {self.id_estoque} ({self.id_categoria})"


class MovimentacaoEstoque(models.Model):
    TIPO_CHOICES = (
        ("E", "Entrada"),
        ("S", "Saída"),
    )

    id_produto = models.ForeignKey(Produto, on_delete=models.CASCADE)
    id_estoque = models.ForeignKey(Estoque, on_delete=models.CASCADE)
    id_cliente = models.ForeignKey(
        Cliente, on_delete=models.CASCADE, null=True, blank=True
    )
    quantidade = models.PositiveIntegerField()
    tipo = models.CharField(max_length=1, choices=TIPO_CHOICES, default="E")
    movimentedAt = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.id_produto} - {self.quantidade}"
