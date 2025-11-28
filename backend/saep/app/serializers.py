from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    Cliente,
    Log,
    Produto,
    Estoque,
    Categoria,
    MovimentacaoEstoque,
)

Usuario = get_user_model()


class UsuarioCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = ["id", "email", "nome", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        usuario = Usuario(**validated_data)
        usuario.set_password(password)
        usuario.save()
        return usuario


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ["id", "email", "nome", "is_active", "is_staff"]


class CustomLoginSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["nome"] = user.nome
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UsuarioSerializer(self.user).data
        return data


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = "__all__"


class LogSerializer(serializers.ModelSerializer):
    class Meta:
        model = Log
        fields = [
            "id",
            "createdAt",
            "updateAt",
            "is_activate",
        ]


class ProdutoSerializer(serializers.ModelSerializer):
    estoque_atual = serializers.SerializerMethodField()

    class Meta:
        model = Produto
        fields = ["id", "nome", "descricao", "sku", "estoque_minimo", "estoque_atual"]

    def get_estoque_atual(self, obj):
        return obj.calcular_estoque()

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user
        produto = Produto.objects.create(id_usuario=user, **validated_data)
        return produto


class EstoqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estoque
        fields = "__all__"


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = "__all__"


class MovimentacaoEstoqueSerializer(serializers.ModelSerializer):
    estoque = EstoqueSerializer(source="id_estoque", read_only=True)
    produto = ProdutoSerializer(source="id_produto", read_only=True)
    cliente = ClienteSerializer(source="id_cliente", read_only=True)

    class Meta:
        model = MovimentacaoEstoque
        fields = [
            "id",
            "quantidade",
            "tipo",
            "movimentedAt",
            "id_estoque",
            "id_produto",
            "id_cliente",
            "estoque",
            "produto",
            "cliente",
        ]
