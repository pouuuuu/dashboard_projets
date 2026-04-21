📷 COMMENT AJOUTER VOTRE LOGO
================================

1. Placez votre fichier logo dans ce dossier :
   C:\Users\SAGES\Desktop\myapp\static\images\

2. Renommez votre fichier logo en : logo.png
   (ou logo.jpg, logo.svg selon le format)

3. Dans le fichier table.html, modifiez la ligne dans la section sidebar-logo :

   Remplacez :
   <h2>📊 SAGES</h2>
   <p style="font-size: 0.8em; opacity: 0.8; margin: 5px 0 0 0;">Gestion de Projets</p>

   Par :
   <img src="/static/images/logo.png" alt="Logo SAGES">

4. Redémarrez le serveur et rechargez la page !

Formats recommandés :
- PNG avec fond transparent (idéal)
- SVG (vectoriel, s'adapte à toutes les tailles)
- JPG (si fond blanc/noir acceptable)

Dimensions recommandées :
- Largeur : 180-200px
- Hauteur : proportionnelle
