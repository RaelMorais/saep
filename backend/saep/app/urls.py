from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (LoginView, UsuarioCreateView, ClienteViewSet, LogViewSet, ProdutoViewSet, EstoqueViewSet, CategoriaViewSet, MovimentacaoEstoqueViewSet)

router = DefaultRouter()
router.register(r'clientes', ClienteViewSet, basename='clientes')
router.register(r'logs', LogViewSet, basename='logs')
router.register(r'produtos', ProdutoViewSet, basename='produtos')
router.register(r'estoques', EstoqueViewSet, basename='estoques')
router.register(r'categorias', CategoriaViewSet, basename='categorias')
router.register(r'movimentacoes', MovimentacaoEstoqueViewSet, basename='movimentacoes')

urlpatterns = [
    path('login/', LoginView.as_view(), name='login_view'),
    path('create/user/', UsuarioCreateView.as_view(), name='create-user'),
    path('', include(router.urls)),
]
