"""
Optimisation des images uploadées : redimensionnement + conversion WebP.

Les photos d'origine (PNG de 2-3 Mo) ralentissaient tout le site. Les images sont
maintenant réduites à la sauvegarde ; en cas de problème (fichier illisible…) on
retombe sur le fichier d'origine plutôt que de bloquer l'upload.
"""
import os
from io import BytesIO

from django.core.files.base import ContentFile
from PIL import Image, ImageOps

FULL_SIDE  = 1400   # image affichée en grand (fiche produit)
THUMB_SIDE = 720    # miniature (catalogue, panier, accueil…) — assez large pour les écrans retina
CARD_SIDE  = 900    # images de catégorie
REF_SIDE   = 600    # images de références produit
QUALITY    = 82


def _open(source):
    """Ouvre une image PIL depuis un FieldFile/UploadedFile/chemin, orientation EXIF appliquée."""
    if hasattr(source, 'seek'):
        source.seek(0)
    img = Image.open(source)
    img.load()
    img = ImageOps.exif_transpose(img)
    # WebP gère la transparence ; on ne garde le canal alpha que s'il est utile
    if img.mode not in ('RGB', 'RGBA'):
        img = img.convert('RGBA' if 'A' in img.mode or 'transparency' in img.info else 'RGB')
    return img


def _webp(img, max_side, quality=QUALITY):
    """Renvoie les octets WebP de `img` réduite à `max_side` px (jamais agrandie)."""
    work = img.copy()
    work.thumbnail((max_side, max_side), Image.LANCZOS)
    buf = BytesIO()
    work.save(buf, format='WEBP', quality=quality, method=4)
    return buf.getvalue()


def webp_name(original_name, suffix=''):
    stem = os.path.splitext(os.path.basename(original_name))[0]
    return f'{stem}{suffix}.webp'


def optimize_field(field_file, max_side):
    """
    Remplace, avant sauvegarde, le fichier uploadé d'un ImageField par sa version WebP réduite.
    Sans effet si le fichier est déjà enregistré. Renvoie l'image PIL ouverte (pour d'autres
    dérivés, ex. miniature) ou None en cas d'échec.
    """
    if not field_file or getattr(field_file, '_committed', True):
        return None
    try:
        img = _open(field_file.file)
        data = _webp(img, max_side)
        field_file.save(webp_name(field_file.name), ContentFile(data), save=False)
        return img
    except Exception:
        return None


def make_thumbnail(img, name, max_side=THUMB_SIDE):
    """ContentFile WebP miniature depuis une image PIL, nommée d'après `name`."""
    return webp_name(name, '_thumb'), ContentFile(_webp(img, max_side, quality=80))


ALLOWED_UPLOAD_FORMATS = {'JPEG', 'PNG', 'WEBP', 'GIF'}
MAX_UPLOAD_BYTES  = 8 * 1024 * 1024   # 8 Mo
MAX_UPLOAD_PIXELS = 50_000_000        # garde-fou "bombe de décompression"


def validate_image_upload(uploaded, max_bytes=MAX_UPLOAD_BYTES):
    """
    Valide un fichier envoyé par un visiteur (endpoint public) : taille raisonnable et
    VRAIE image (contenu vérifié par Pillow, pas seulement l'extension/type MIME déclarés,
    qui sont falsifiables). Lève ValueError avec un message affichable.
    """
    if uploaded.size > max_bytes:
        raise ValueError(f'Image trop lourde (maximum {max_bytes // (1024 * 1024)} Mo).')
    try:
        uploaded.seek(0)
        img = Image.open(uploaded)
        fmt, (w, h) = img.format, img.size
        img.verify()
    except Exception:
        raise ValueError("Le fichier n'est pas une image valide.")
    finally:
        uploaded.seek(0)
    if fmt not in ALLOWED_UPLOAD_FORMATS:
        raise ValueError('Format non accepté (JPEG, PNG, WebP ou GIF).')
    if w * h > MAX_UPLOAD_PIXELS:
        raise ValueError('Image trop grande (dimensions).')
