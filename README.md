# permis-ge

Outil bête et débile qui se contente de spam le site de Genève pour les rendez-vous d'examen de la pratique pour le permis de conduire. Une fois un rendez-vous disponible, un web-hook Discord sera déclenché en mentionnant @everyone. Dans le cas contraire, un message pour indiquer que le bot est toujours en vie est envoyé.

C'est un outil qui se lance directement depuis le terminal.

```
    --n <numéro> : (Obligatoire) Numéro d'inscription
    --birthday <DD>/<MM>/<YYYY> : (Obligatoire) Date de naissance
    --webhook : (Obligatoire) URL du web-hook

    --inst [nom_instance] : (Optionel) Nom de l'instance, qui sera affiché sur Discord
```

Pour que le bot aille chercher plus loin dans le temps, modifier la constante `NB_ITER` à l'intérieur du code qui correspond au nombre de fois où le bouton « Semaine suivante » sera cliqué.

Pour que le bot filtre les dates voulues, modifier la fonction `check_if_wanted`.

Programme normalement fonctionnel. Rien est garanti et j'en ai aucune responsabilité.

Code très probablement moche, nul et sale. Il a été fait en deux petites heures **mais** il marche.