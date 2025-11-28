from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
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


class UsuarioCreateView(generics.CreateAPIView):
    queryset = Usuario.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UsuarioCreateSerializer


class LoginView(TokenObtainPairView):
    serializer_class = CustomLoginSerializer
    permission_classes = [AllowAny]


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [IsActiveUser]

    def destroy(self, request, *args, **kwargs):
        return Response(
            {"detail": "Operação de delete não permitida."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


class ProdutoViewSet(viewsets.ModelViewSet):
    serializer_class = ProdutoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Produto.objects.all()
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(nome__icontains=search)
                | Q(descricao__icontains=search)
                | Q(sku__icontains=search)
            )
        return qs.order_by("nome")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class EstoqueViewSet(viewsets.ModelViewSet):
    queryset = Estoque.objects.all()
    serializer_class = EstoqueSerializer
    permission_classes = [IsActiveUser]

    def destroy(self, request, *args, **kwargs):
        return Response(
            {"detail": "Operação de delete não permitida."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [IsActiveUser]

    def destroy(self, request, *args, **kwargs):
        return Response(
            {"detail": "Operação de delete não permitida."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


class MovimentacaoEstoqueViewSet(viewsets.ModelViewSet):
    queryset = MovimentacaoEstoque.objects.all()
    serializer_class = MovimentacaoEstoqueSerializer
    permission_classes = [IsActiveUser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        movimentacao = serializer.save()
        produto = movimentacao.id_produto
        estoque_atual = produto.calcular_estoque()
        data = self.get_serializer(movimentacao).data
        data["estoque_atual"] = estoque_atual
        data["estoque_minimo"] = produto.estoque_minimo
        data["estoque_abaixo_minimo"] = estoque_atual < produto.estoque_minimo
        headers = self.get_success_headers(serializer.data)
        return Response(data, status=status.HTTP_201_CREATED, headers=headers)

    def destroy(self, request, *args, **kwargs):
        return Response(
            {"detail": "Operação de delete não permitida."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


class LogViewSet(viewsets.ModelViewSet):
    queryset = Log.objects.all()
    serializer_class = LogSerializer
    permission_classes = [IsActiveUser]

    def destroy(self, request, *args, **kwargs):
        return Response(
            {"detail": "Operação de delete não permitida."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @action(detail=True, methods=["put"], url_path="ativar-desativar")
    def ativar_desativar(self, request, pk=None):
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
