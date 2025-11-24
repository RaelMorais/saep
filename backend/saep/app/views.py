from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView

from django.contrib.auth import get_user_model

from .permissions import IsActiveUser
from .models import (
    Cliente,
    Log,
    Produto,
    Estoque,
    Categoria,
    MovimentacaoEstoque,
)
from .serializers import (
    UsuarioCreateSerializer,
    CustomLoginSerializer,
    ClienteSerializer,
    LogSerializer,
    ProdutoSerializer,
    EstoqueSerializer,
    CategoriaSerializer,
    MovimentacaoEstoqueSerializer,
)

Usuario = get_user_model()


# ============================================================
# USUÁRIO / AUTENTICAÇÃO
# ============================================================

class UsuarioCreateView(generics.CreateAPIView):
    """
    Endpoint para cadastro de usuário.
    Acesso liberado (AllowAny) para permitir que novos usuários se registrem.
    """
    queryset = Usuario.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UsuarioCreateSerializer


class LoginView(TokenObtainPairView):
    """
    Endpoint de login JWT.
    Retorna access e refresh + dados básicos do usuário.
    """
    serializer_class = CustomLoginSerializer
    permission_classes = [AllowAny]


# ============================================================
# CLIENTE
# ============================================================

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [IsActiveUser]

    def destroy(self, request, *args, **kwargs):
        return Response(
            {"detail": "Operação de delete não permitida. Use um endpoint de ativação/desativação, se disponível."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


# ============================================================
# PRODUTO
# ============================================================

class ProdutoViewSet(viewsets.ModelViewSet):
    """
    Produtos.
    O serializer usa request.user para setar id_usuario no create.
    """
    queryset = Produto.objects.all()
    serializer_class = ProdutoSerializer
    permission_classes = [IsActiveUser]

    def get_serializer_context(self):
        """
        Garante que o `request` esteja disponível no serializer,
        para o ProdutoSerializer.create conseguir acessar `request.user`.
        """
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def destroy(self, request, *args, **kwargs):
        return Response(
            {"detail": "Operação de delete não permitida. Use um endpoint de ativação/desativação, se disponível."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


# ============================================================
# ESTOQUE
# ============================================================

class EstoqueViewSet(viewsets.ModelViewSet):
    queryset = Estoque.objects.all()
    serializer_class = EstoqueSerializer
    permission_classes = [IsActiveUser]

    def destroy(self, request, *args, **kwargs):
        return Response(
            {"detail": "Operação de delete não permitida."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


# ============================================================
# CATEGORIA
# ============================================================

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [IsActiveUser]

    def destroy(self, request, *args, **kwargs):
        return Response(
            {"detail": "Operação de delete não permitida."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


# ============================================================
# MOVIMENTAÇÃO DE ESTOQUE
# ============================================================

class MovimentacaoEstoqueViewSet(viewsets.ModelViewSet):
    """
    Movimentações de estoque (Entrada/Saída).
    Modelo: MovimentacaoEstoque
      - id_produto
      - id_estoque
      - id_cliente (opcional)
      - quantidade
      - tipo: 'E' ou 'S'
    """
    queryset = MovimentacaoEstoque.objects.all()
    serializer_class = MovimentacaoEstoqueSerializer
    permission_classes = [IsActiveUser]

    def destroy(self, request, *args, **kwargs):
        return Response(
            {"detail": "Operação de delete não permitida."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


# ============================================================
# LOG
# ============================================================

class LogViewSet(viewsets.ModelViewSet):
    queryset = Log.objects.all()
    serializer_class = LogSerializer
    permission_classes = [IsActiveUser]

    def destroy(self, request, *args, **kwargs):
        return Response(
            {
                "detail": "Operação de delete não permitida. Use o endpoint de ativar/desativar."
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @action(detail=True, methods=["put"], url_path="ativar-desativar")
    def ativar_desativar(self, request, pk=None):
        """
        PUT /logs/<id>/ativar-desativar/
        body: { "is_activate": true/false }
        """
        log = self.get_object()
        is_activate = request.data.get("is_activate")

        if is_activate is None:
            return Response(
                {"detail": "Campo 'is_activate' é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if isinstance(is_activate, str):
            is_activate = is_activate.lower() == "true"

        log.is_activate = is_activate
        log.save()

        serializer = self.get_serializer(log)
        return Response(serializer.data, status=status.HTTP_200_OK)
