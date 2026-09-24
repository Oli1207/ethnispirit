"""
Optimise les images déjà en base (avant l'optimisation automatique à l'upload).

  python manage.py optimize_images --dry-run           # simule, n'écrit rien
  python manage.py optimize_images                      # crée les WebP + miniatures
  python manage.py optimize_images --delete-originals   # + supprime les anciens PNG/JPEG

Sûr à relancer : les images déjà en WebP avec miniature sont ignorées.
"""
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand

from api.imaging import (
    _open, _webp, webp_name, FULL_SIDE, THUMB_SIDE, CARD_SIDE, REF_SIDE,
)
from api.models import Category, ProductImage, ProductReference


def _size(field):
    try:
        return field.size
    except Exception:
        return 0


class Command(BaseCommand):
    help = "Convertit les images produit/catégorie/référence en WebP réduit + miniatures produit."

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help="N'écrit rien, affiche seulement le plan.")
        parser.add_argument('--delete-originals', action='store_true', help="Supprime les anciens fichiers remplacés.")

    def handle(self, *args, **opts):
        self.dry = opts['dry_run']
        self.delete = opts['delete_originals']
        self.before = 0
        self.after = 0
        self.errors = 0

        for img in ProductImage.objects.select_related('product').all():
            self._product_image(img)
        for cat in Category.objects.exclude(image='').exclude(image__isnull=True):
            self._replace(cat, 'image', CARD_SIDE, f'catégorie « {cat.name} »')
        for ref in ProductReference.objects.exclude(image='').exclude(image__isnull=True):
            self._replace(ref, 'image', REF_SIDE, f'référence « {ref} »')

        mb = lambda n: f'{n / 1e6:.1f} Mo'
        self.stdout.write(self.style.SUCCESS(
            f"Terminé{' (simulation)' if self.dry else ''} : {mb(self.before)} → {mb(self.after)} "
            f"({self.errors} erreur(s))."
        ))

    # ── helpers ───────────────────────────────────────────────────────────────
    def _product_image(self, obj):
        needs_full  = not obj.image.name.lower().endswith('.webp')
        needs_thumb = not obj.thumbnail
        if not (needs_full or needs_thumb):
            return
        label = f'produit « {obj.product.name} » (image {obj.id})'
        old_name, old_size = obj.image.name, _size(obj.image)
        try:
            with obj.image.open('rb') as fh:
                pil = _open(fh)
        except Exception as exc:
            self.errors += 1
            self.stderr.write(f'✗ {label} : {exc}')
            return

        new_full = _webp(pil, FULL_SIDE) if needs_full else None
        thumb    = _webp(pil, THUMB_SIDE, quality=80) if needs_thumb else None
        self.before += old_size
        self.after  += len(new_full) if new_full else old_size
        self.stdout.write(f'• {label} : {old_size // 1024} Ko → '
                          f'{(len(new_full) // 1024) if new_full else "=" } Ko'
                          f'{" + miniature " + str(len(thumb) // 1024) + " Ko" if thumb else ""}')
        if self.dry:
            return

        if new_full:
            obj.image.save(webp_name(old_name), ContentFile(new_full), save=False)
        if thumb:
            obj.thumbnail.save(webp_name(old_name, '_thumb'), ContentFile(thumb), save=False)
        obj.save()
        if new_full and self.delete and old_name != obj.image.name:
            default_storage.delete(old_name)

    def _replace(self, obj, attr, max_side, label):
        field = getattr(obj, attr)
        if field.name.lower().endswith('.webp'):
            return
        old_name, old_size = field.name, _size(field)
        try:
            with field.open('rb') as fh:
                pil = _open(fh)
            data = _webp(pil, max_side)
        except Exception as exc:
            self.errors += 1
            self.stderr.write(f'✗ {label} : {exc}')
            return
        self.before += old_size
        self.after  += len(data)
        self.stdout.write(f'• {label} : {old_size // 1024} Ko → {len(data) // 1024} Ko')
        if self.dry:
            return
        field.save(webp_name(old_name), ContentFile(data), save=False)
        obj.save()
        if self.delete and old_name != getattr(obj, attr).name:
            default_storage.delete(old_name)
