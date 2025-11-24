from django.contrib import admin
from .models import (Usuario, Cliente, Log, Produto, Estoque, Categoria, MovimentacaoEstoque)
from django.contrib.auth.admin import UserAdmin


class UsuarioAdmin(UserAdmin):
    model = Usuario
    list_display = ("id", "email", "nome", "is_active", "is_staff")
    list_filter = ("is_active", "is_staff")
    ordering = ("email",)
    search_fields = ("email", "nome")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Informações pessoais", {"fields": ("nome",)}),
        ("Permissões", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Datas importantes", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "nome", "password1", "password2", "is_staff", "is_active"),
        }),
    )


admin.site.register(Usuario, UsuarioAdmin)

admin.site.register(Cliente)
admin.site.register(Log)
admin.site.register(Produto)
admin.site.register(Estoque)
admin.site.register(Categoria)
admin.site.register(MovimentacaoEstoque)
